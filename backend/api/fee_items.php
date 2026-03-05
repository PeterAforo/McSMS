<?php
header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Handle special actions
    if ($action === 'cleanup_duplicates') {
        cleanupDuplicateFeeItems($pdo);
        exit;
    }
    
    if ($action === 'find_duplicates') {
        findDuplicateFeeItems($pdo);
        exit;
    }

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT fi.*, fg.group_name, fg.group_code
                    FROM fee_items fi 
                    LEFT JOIN fee_groups fg ON fi.fee_group_id = fg.id 
                    WHERE fi.id = ?
                ");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'fee_item' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                // Use DISTINCT and GROUP BY to avoid duplicates from JOIN
                $stmt = $pdo->query("
                    SELECT fi.*, fg.group_name, fg.group_code
                    FROM fee_items fi 
                    LEFT JOIN fee_groups fg ON fi.fee_group_id = fg.id 
                    ORDER BY fg.group_name, fi.item_name
                ");
                echo json_encode(['success' => true, 'fee_items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if item with same name already exists
            $checkStmt = $pdo->prepare("SELECT id FROM fee_items WHERE item_name = ?");
            $checkStmt->execute([$data['item_name']]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                // Return existing item instead of creating duplicate
                $stmt = $pdo->prepare("SELECT fi.*, fg.group_name FROM fee_items fi LEFT JOIN fee_groups fg ON fi.fee_group_id = fg.id WHERE fi.id = ?");
                $stmt->execute([$existing['id']]);
                echo json_encode(['success' => true, 'fee_item' => $stmt->fetch(PDO::FETCH_ASSOC), 'message' => 'Fee item already exists']);
                break;
            }
            
            $stmt = $pdo->prepare("INSERT INTO fee_items (fee_group_id, item_name, item_code, description, frequency, is_optional, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['fee_group_id'],
                $data['item_name'],
                $data['item_code'],
                $data['description'] ?? null,
                $data['frequency'] ?? 'term',
                $data['is_optional'] ?? 0,
                $data['status'] ?? 'active'
            ]);
            $id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT fi.*, fg.group_name FROM fee_items fi LEFT JOIN fee_groups fg ON fi.fee_group_id = fg.id WHERE fi.id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'fee_item' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE fee_items SET fee_group_id=?, item_name=?, item_code=?, description=?, frequency=?, is_optional=?, status=? WHERE id=?");
            $stmt->execute([
                $data['fee_group_id'],
                $data['item_name'],
                $data['item_code'],
                $data['description'],
                $data['frequency'],
                $data['is_optional'],
                $data['status'],
                $id
            ]);
            $stmt = $pdo->prepare("SELECT fi.*, fg.group_name FROM fee_items fi LEFT JOIN fee_groups fg ON fi.fee_group_id = fg.id WHERE fi.id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'fee_item' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM fee_items WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// Helper function to find duplicate fee items
function findDuplicateFeeItems($pdo) {
    // Find items with same name (case-insensitive)
    $stmt = $pdo->query("
        SELECT item_name, COUNT(*) as count, GROUP_CONCAT(id) as ids
        FROM fee_items 
        GROUP BY LOWER(item_name) 
        HAVING COUNT(*) > 1
    ");
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true, 
        'duplicates' => $duplicates,
        'total_duplicate_groups' => count($duplicates)
    ]);
}

// Helper function to cleanup duplicate fee items
function cleanupDuplicateFeeItems($pdo) {
    $pdo->beginTransaction();
    
    try {
        // Find duplicates - keep the one with lowest ID (oldest)
        $stmt = $pdo->query("
            SELECT item_name, MIN(id) as keep_id, GROUP_CONCAT(id) as all_ids
            FROM fee_items 
            GROUP BY LOWER(item_name) 
            HAVING COUNT(*) > 1
        ");
        $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $deleted = 0;
        $merged = 0;
        
        foreach ($duplicates as $dup) {
            $keepId = $dup['keep_id'];
            $allIds = explode(',', $dup['all_ids']);
            $deleteIds = array_filter($allIds, fn($id) => $id != $keepId);
            
            if (count($deleteIds) > 0) {
                // Update any fee_item_rules to point to the kept item
                $placeholders = implode(',', array_fill(0, count($deleteIds), '?'));
                $updateStmt = $pdo->prepare("UPDATE fee_item_rules SET fee_item_id = ? WHERE fee_item_id IN ($placeholders)");
                $updateStmt->execute(array_merge([$keepId], $deleteIds));
                $merged += $updateStmt->rowCount();
                
                // Delete duplicate items
                $deleteStmt = $pdo->prepare("DELETE FROM fee_items WHERE id IN ($placeholders)");
                $deleteStmt->execute($deleteIds);
                $deleted += $deleteStmt->rowCount();
            }
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Cleanup complete",
            'duplicates_found' => count($duplicates),
            'items_deleted' => $deleted,
            'rules_merged' => $merged
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

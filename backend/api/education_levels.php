<?php
/**
 * Education Levels API
 * Manages configurable education levels (creche, primary, JHS, etc.)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Ensure table exists
$pdo->exec("
    CREATE TABLE IF NOT EXISTS education_levels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        level_code VARCHAR(50) NOT NULL UNIQUE,
        level_name VARCHAR(100) NOT NULL,
        display_order INT DEFAULT 0,
        description TEXT,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
");

// Check if table is empty and seed default values
$count = $pdo->query("SELECT COUNT(*) FROM education_levels")->fetchColumn();
if ($count == 0) {
    $pdo->exec("
        INSERT INTO education_levels (level_code, level_name, display_order, is_active) VALUES
        ('creche', 'Creche', 1, 1),
        ('nursery', 'Nursery', 2, 1),
        ('kg', 'Kindergarten', 3, 1),
        ('primary', 'Primary', 4, 1),
        ('jhs', 'Junior High School', 5, 1),
        ('shs', 'Senior High School', 6, 1)
    ");
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get all levels or single level
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM education_levels WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $level = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(['level' => $level]);
        } else {
            // Filter options
            $activeOnly = isset($_GET['active_only']) && $_GET['active_only'] === 'true';
            
            $sql = "SELECT * FROM education_levels";
            if ($activeOnly) {
                $sql .= " WHERE is_active = 1";
            }
            $sql .= " ORDER BY display_order ASC, level_name ASC";
            
            $stmt = $pdo->query($sql);
            $levels = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['levels' => $levels, 'total' => count($levels)]);
        }
        break;

    case 'POST':
        // Create new level
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['level_code']) || empty($data['level_name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Level code and name are required']);
            exit();
        }
        
        // Check for duplicate code
        $stmt = $pdo->prepare("SELECT id FROM education_levels WHERE level_code = ?");
        $stmt->execute([$data['level_code']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'Level code already exists']);
            exit();
        }
        
        // Get max display order
        $maxOrder = $pdo->query("SELECT MAX(display_order) FROM education_levels")->fetchColumn();
        $displayOrder = $data['display_order'] ?? ($maxOrder + 1);
        
        $stmt = $pdo->prepare("
            INSERT INTO education_levels (level_code, level_name, display_order, description, is_active)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            strtolower($data['level_code']),
            $data['level_name'],
            $displayOrder,
            $data['description'] ?? null,
            $data['is_active'] ?? 1
        ]);
        
        $id = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => $id, 'message' => 'Education level created']);
        break;

    case 'PUT':
        // Update level
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Level ID is required']);
            exit();
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check for duplicate code (excluding current record)
        if (!empty($data['level_code'])) {
            $stmt = $pdo->prepare("SELECT id FROM education_levels WHERE level_code = ? AND id != ?");
            $stmt->execute([$data['level_code'], $id]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Level code already exists']);
                exit();
            }
        }
        
        $fields = [];
        $values = [];
        
        if (isset($data['level_code'])) {
            $fields[] = 'level_code = ?';
            $values[] = strtolower($data['level_code']);
        }
        if (isset($data['level_name'])) {
            $fields[] = 'level_name = ?';
            $values[] = $data['level_name'];
        }
        if (isset($data['display_order'])) {
            $fields[] = 'display_order = ?';
            $values[] = $data['display_order'];
        }
        if (isset($data['description'])) {
            $fields[] = 'description = ?';
            $values[] = $data['description'];
        }
        if (isset($data['is_active'])) {
            $fields[] = 'is_active = ?';
            $values[] = $data['is_active'];
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit();
        }
        
        $values[] = $id;
        $sql = "UPDATE education_levels SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        echo json_encode(['success' => true, 'message' => 'Education level updated']);
        break;

    case 'DELETE':
        // Delete level
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Level ID is required']);
            exit();
        }
        
        // Check if level is in use by classes
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM classes WHERE level = (SELECT level_code FROM education_levels WHERE id = ?)");
        $stmt->execute([$id]);
        $inUse = $stmt->fetchColumn();
        
        if ($inUse > 0) {
            http_response_code(400);
            echo json_encode(['error' => "Cannot delete: $inUse class(es) are using this level. Deactivate instead."]);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM education_levels WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Education level deleted']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

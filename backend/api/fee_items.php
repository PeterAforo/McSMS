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

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT fi.*, fg.group_name, fg.group_code,
                           fir.amount, fir.currency, fir.level, fir.academic_year
                    FROM fee_items fi 
                    LEFT JOIN fee_groups fg ON fi.fee_group_id = fg.id 
                    LEFT JOIN fee_item_rules fir ON fi.id = fir.fee_item_id AND fir.is_active = 1
                    WHERE fi.id = ?
                ");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'fee_item' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $stmt = $pdo->query("
                    SELECT fi.*, fg.group_name, fg.group_code,
                           fir.amount, fir.currency, fir.level, fir.academic_year
                    FROM fee_items fi 
                    LEFT JOIN fee_groups fg ON fi.fee_group_id = fg.id 
                    LEFT JOIN fee_item_rules fir ON fi.id = fir.fee_item_id AND fir.is_active = 1
                    ORDER BY fg.group_name, fi.item_name
                ");
                echo json_encode(['success' => true, 'fee_items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
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

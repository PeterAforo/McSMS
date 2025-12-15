<?php
header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
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
                $stmt = $pdo->prepare("SELECT * FROM fee_groups WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'fee_group' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $stmt = $pdo->query("SELECT * FROM fee_groups ORDER BY group_name");
                echo json_encode(['success' => true, 'fee_groups' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO fee_groups (group_name, group_code, description, status) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['group_name'], $data['group_code'], $data['description'] ?? null, $data['status'] ?? 'active']);
            $id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM fee_groups WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'fee_group' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE fee_groups SET group_name=?, group_code=?, description=?, status=? WHERE id=?");
            $stmt->execute([$data['group_name'], $data['group_code'], $data['description'], $data['status'], $id]);
            $stmt = $pdo->prepare("SELECT * FROM fee_groups WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'fee_group' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM fee_groups WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

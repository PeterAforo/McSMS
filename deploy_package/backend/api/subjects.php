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
                $stmt = $pdo->prepare("SELECT * FROM subjects WHERE id = ?");
                $stmt->execute([$id]);
                $subject = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'subject' => $subject]);
            } else {
                $stmt = $pdo->query("SELECT * FROM subjects ORDER BY subject_name");
                $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'subjects' => $subjects]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO subjects (subject_name, subject_code, category, description, status) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$data['subject_name'], $data['subject_code'], $data['category'] ?? 'core', $data['description'] ?? null, $data['status'] ?? 'active']);
            $id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM subjects WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'subject' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE subjects SET subject_name=?, subject_code=?, category=?, description=?, status=? WHERE id=?");
            $stmt->execute([$data['subject_name'], $data['subject_code'], $data['category'], $data['description'], $data['status'], $id]);
            $stmt = $pdo->prepare("SELECT * FROM subjects WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'subject' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM subjects WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

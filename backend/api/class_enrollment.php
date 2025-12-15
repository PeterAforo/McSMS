<?php
/**
 * Class Enrollment API
 * Handles student enrollment, removal, and promotion between classes
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? '';

        switch ($action) {
            case 'enroll':
                // Enroll students to a class
                $classId = $data['class_id'] ?? null;
                $studentIds = $data['student_ids'] ?? [];

                if (!$classId || empty($studentIds)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Class ID and student IDs are required']);
                    exit;
                }

                $enrolled = 0;
                foreach ($studentIds as $studentId) {
                    $stmt = $pdo->prepare("UPDATE students SET class_id = ? WHERE id = ?");
                    $stmt->execute([$classId, $studentId]);
                    $enrolled += $stmt->rowCount();
                }

                echo json_encode([
                    'success' => true,
                    'message' => "$enrolled student(s) enrolled successfully"
                ]);
                break;

            case 'remove':
                // Remove students from a class
                $classId = $data['class_id'] ?? null;
                $studentIds = $data['student_ids'] ?? [];

                if (!$classId || empty($studentIds)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Class ID and student IDs are required']);
                    exit;
                }

                $removed = 0;
                foreach ($studentIds as $studentId) {
                    $stmt = $pdo->prepare("UPDATE students SET class_id = NULL WHERE id = ? AND class_id = ?");
                    $stmt->execute([$studentId, $classId]);
                    $removed += $stmt->rowCount();
                }

                echo json_encode([
                    'success' => true,
                    'message' => "$removed student(s) removed from class"
                ]);
                break;

            case 'promote':
                // Promote students from one class to another
                $fromClassId = $data['from_class_id'] ?? null;
                $toClassId = $data['to_class_id'] ?? null;
                $studentIds = $data['student_ids'] ?? [];

                if (!$fromClassId || !$toClassId || empty($studentIds)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'From class, to class, and student IDs are required']);
                    exit;
                }

                $promoted = 0;
                foreach ($studentIds as $studentId) {
                    $stmt = $pdo->prepare("UPDATE students SET class_id = ? WHERE id = ? AND class_id = ?");
                    $stmt->execute([$toClassId, $studentId, $fromClassId]);
                    $promoted += $stmt->rowCount();
                }

                echo json_encode([
                    'success' => true,
                    'message' => "$promoted student(s) promoted successfully"
                ]);
                break;

            case 'bulk_promote':
                // Promote all students from one class to another
                $fromClassId = $data['from_class_id'] ?? null;
                $toClassId = $data['to_class_id'] ?? null;

                if (!$fromClassId || !$toClassId) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'From class and to class are required']);
                    exit;
                }

                $stmt = $pdo->prepare("UPDATE students SET class_id = ? WHERE class_id = ?");
                $stmt->execute([$toClassId, $fromClassId]);
                $promoted = $stmt->rowCount();

                echo json_encode([
                    'success' => true,
                    'message' => "$promoted student(s) promoted successfully"
                ]);
                break;

            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

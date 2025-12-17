<?php
/**
 * Teacher Subjects API
 * Get subjects taught by a specific teacher
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$teacher_id = $_GET['teacher_id'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    if ($method === 'GET') {
        if (!$teacher_id) {
            http_response_code(400);
            echo json_encode(['error' => 'teacher_id is required']);
            exit();
        }

        // Get all subjects taught by this teacher via class_subjects
        $stmt = $pdo->prepare("
            SELECT cs.id, cs.class_id, cs.subject_id, cs.teacher_id, cs.periods_per_week, cs.is_mandatory,
                   c.class_name, c.education_level,
                   s.subject_name, s.subject_code, s.category
            FROM class_subjects cs
            LEFT JOIN classes c ON cs.class_id = c.id
            LEFT JOIN subjects s ON cs.subject_id = s.id
            WHERE cs.teacher_id = ?
            ORDER BY c.class_name, s.subject_name
        ");
        $stmt->execute([$teacher_id]);
        $teacherSubjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'teacher_subjects' => $teacherSubjects,
            'count' => count($teacherSubjects)
        ]);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

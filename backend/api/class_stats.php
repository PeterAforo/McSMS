<?php
/**
 * Class Statistics API
 * Returns performance and attendance statistics for a class
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

    $classId = $_GET['class_id'] ?? null;

    if (!$classId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Class ID is required']);
        exit;
    }

    $stats = [
        'avgAttendance' => 0,
        'avgGrade' => 0,
        'totalStudents' => 0,
        'maleCount' => 0,
        'femaleCount' => 0
    ];

    // Get student count
    $stmt = $pdo->prepare("SELECT COUNT(*) as total, 
                           SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) as male,
                           SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as female
                           FROM students WHERE class_id = ?");
    $stmt->execute([$classId]);
    $counts = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['totalStudents'] = $counts['total'] ?? 0;
    $stats['maleCount'] = $counts['male'] ?? 0;
    $stats['femaleCount'] = $counts['female'] ?? 0;

    // Try to get average attendance (if attendance table exists)
    try {
        $stmt = $pdo->prepare("
            SELECT AVG(
                CASE WHEN a.status IN ('present', 'late') THEN 100 ELSE 0 END
            ) as avg_attendance
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE s.class_id = ?
            AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $stmt->execute([$classId]);
        $attendance = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['avgAttendance'] = round($attendance['avg_attendance'] ?? 0, 1);
    } catch (Exception $e) {
        // Table might not exist
        $stats['avgAttendance'] = 0;
    }

    // Try to get average grade (if grades/results table exists)
    try {
        $stmt = $pdo->prepare("
            SELECT AVG(
                (COALESCE(class_score, 0) + COALESCE(exam_score, 0)) / 2
            ) as avg_grade
            FROM results r
            JOIN students s ON r.student_id = s.id
            WHERE s.class_id = ?
        ");
        $stmt->execute([$classId]);
        $grades = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['avgGrade'] = round($grades['avg_grade'] ?? 0, 1);
    } catch (Exception $e) {
        // Table might not exist
        $stats['avgGrade'] = 0;
    }

    echo json_encode(['success' => true, 'stats' => $stats]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

<?php
/**
 * Debug script for grades API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$configPaths = [
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(__DIR__, 2) . '/config/database.php'
];
$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    die(json_encode(['error' => 'Config not found']));
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $studentId = $_GET['student_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;

    $debug = array();

    // 1. Check if student exists
    if ($studentId) {
        $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $debug['student'] = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 2. Check assessment_grades for this student
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM assessment_grades WHERE student_id = ?");
    $stmt->execute([$studentId]);
    $debug['assessment_grades_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 3. Get all assessment grades for this student
    $stmt = $pdo->prepare("
        SELECT ag.*, a.assessment_name, a.total_marks, a.term_id, s.subject_name
        FROM assessment_grades ag
        JOIN assessments a ON ag.assessment_id = a.id
        LEFT JOIN subjects s ON a.subject_id = s.id
        WHERE ag.student_id = ?
    ");
    $stmt->execute([$studentId]);
    $debug['assessment_grades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Check homework submissions
    $stmt = $pdo->prepare("
        SELECT hs.*, h.title, h.total_marks, h.term_id, s.subject_name
        FROM homework_submissions hs
        JOIN homework h ON hs.homework_id = h.id
        LEFT JOIN subjects s ON h.subject_id = s.id
        WHERE hs.student_id = ? AND hs.status = 'graded'
    ");
    $stmt->execute([$studentId]);
    $debug['homework_submissions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Check terms
    $stmt = $pdo->query("SELECT * FROM terms ORDER BY id DESC LIMIT 5");
    $debug['terms'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Check if term_id filter is causing issues
    if ($termId) {
        $stmt = $pdo->prepare("
            SELECT ag.*, a.assessment_name, a.term_id
            FROM assessment_grades ag
            JOIN assessments a ON ag.assessment_id = a.id
            WHERE ag.student_id = ? AND a.term_id = ?
        ");
        $stmt->execute([$studentId, $termId]);
        $debug['grades_for_term'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 7. Check all assessments
    $stmt = $pdo->query("SELECT * FROM assessments ORDER BY id DESC LIMIT 10");
    $debug['recent_assessments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($debug, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

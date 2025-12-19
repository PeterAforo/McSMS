<?php
/**
 * Debug script for grades API - v2
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

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

    $studentId = $_GET['student_id'] ?? 2;
    $termId = $_GET['term_id'] ?? 1;

    $debug = array(
        'student_id' => $studentId,
        'term_id' => $termId,
        'tables_checked' => array()
    );

    // Check exam_results table structure
    try {
        $stmt = $pdo->query("DESCRIBE exam_results");
        $debug['exam_results_structure'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        $debug['exam_results_error'] = $e->getMessage();
    }

    // Check exam_schedules table structure
    try {
        $stmt = $pdo->query("DESCRIBE exam_schedules");
        $debug['exam_schedules_structure'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        $debug['exam_schedules_error'] = $e->getMessage();
    }

    // Check grades table structure
    try {
        $stmt = $pdo->query("DESCRIBE grades");
        $debug['grades_structure'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        $debug['grades_error'] = $e->getMessage();
    }

    // Check results table structure
    try {
        $stmt = $pdo->query("DESCRIBE results");
        $debug['results_structure'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        $debug['results_error'] = $e->getMessage();
    }

    // Count records in each table
    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM exam_results");
        $debug['exam_results_count'] = $stmt->fetchColumn();
    } catch (Exception $e) {
        $debug['exam_results_count_error'] = $e->getMessage();
    }

    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM grades");
        $debug['grades_count'] = $stmt->fetchColumn();
    } catch (Exception $e) {
        $debug['grades_count_error'] = $e->getMessage();
    }

    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM results");
        $debug['results_count'] = $stmt->fetchColumn();
    } catch (Exception $e) {
        $debug['results_count_error'] = $e->getMessage();
    }

    // Get sample data from exam_results
    try {
        $stmt = $pdo->query("SELECT * FROM exam_results LIMIT 3");
        $debug['exam_results_sample'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['exam_results_sample_error'] = $e->getMessage();
    }

    // Get sample data from grades
    try {
        $stmt = $pdo->query("SELECT * FROM grades LIMIT 3");
        $debug['grades_sample'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['grades_sample_error'] = $e->getMessage();
    }

    // Get sample data from results
    try {
        $stmt = $pdo->query("SELECT * FROM results LIMIT 3");
        $debug['results_sample'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['results_sample_error'] = $e->getMessage();
    }

    // Check if student exists
    try {
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, class_id FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $debug['student'] = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['student_error'] = $e->getMessage();
    }

    // Check terms
    try {
        $stmt = $pdo->query("SELECT * FROM terms ORDER BY id DESC LIMIT 5");
        $debug['terms'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['terms_error'] = $e->getMessage();
    }

    echo json_encode($debug, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}

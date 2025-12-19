<?php
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

    $debug = array();

    // 1. Check assessments table structure
    try {
        $stmt = $pdo->query("DESCRIBE assessments");
        $debug['assessments_structure'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        $debug['assessments_error'] = $e->getMessage();
    }

    // 2. Get assessment with id=5 (from grades table)
    try {
        $stmt = $pdo->query("SELECT * FROM assessments WHERE id = 5");
        $debug['assessment_5'] = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['assessment_5_error'] = $e->getMessage();
    }

    // 3. Get all assessments
    try {
        $stmt = $pdo->query("SELECT * FROM assessments LIMIT 5");
        $debug['all_assessments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['all_assessments_error'] = $e->getMessage();
    }

    // 4. Try the exact query from grades.php
    try {
        $sql = "
            SELECT 
                g.id,
                g.student_id,
                g.marks_obtained as score,
                g.grade,
                g.remarks,
                a.assessment_date as exam_date,
                a.total_marks as max_score,
                a.assessment_type,
                a.assessment_name as exam_name,
                s.subject_name,
                s.subject_code,
                t.name as term_name,
                CASE WHEN a.total_marks > 0 THEN ROUND((g.marks_obtained / a.total_marks) * 100, 1) ELSE 0 END as percentage
            FROM grades g
            JOIN assessments a ON g.assessment_id = a.id
            LEFT JOIN subjects s ON a.subject_id = s.id
            LEFT JOIN terms t ON a.term_id = t.id
            WHERE g.student_id = ?
            ORDER BY a.assessment_date DESC, s.subject_name
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$studentId]);
        $debug['grades_query_result'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['grades_query_error'] = $e->getMessage();
    }

    // 5. Simple grades query without joins
    try {
        $stmt = $pdo->prepare("SELECT * FROM grades WHERE student_id = ?");
        $stmt->execute([$studentId]);
        $debug['simple_grades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['simple_grades_error'] = $e->getMessage();
    }

    echo json_encode($debug, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

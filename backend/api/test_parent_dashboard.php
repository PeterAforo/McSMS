<?php
/**
 * Debug script for parent dashboard API
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Load config
$configPaths = array(
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php'
);
$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    echo json_encode(array('error' => 'Config not found'));
    exit();
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
    );

    $parentId = isset($_GET['parent_id']) ? $_GET['parent_id'] : null;
    
    $result = array(
        'php_version' => phpversion(),
        'parent_id_provided' => $parentId,
        'debug_steps' => array()
    );

    // Step 1: Check if parent exists
    $stmt = $pdo->prepare("SELECT id, user_id FROM parents WHERE user_id = ? OR id = ?");
    $stmt->execute(array($parentId, $parentId));
    $parent = $stmt->fetch(PDO::FETCH_ASSOC);
    $result['debug_steps']['parent_lookup'] = $parent ? $parent : 'Not found';
    
    $actualParentId = $parent ? $parent['id'] : $parentId;
    $result['actual_parent_id'] = $actualParentId;

    // Step 2: Get children
    $stmt = $pdo->prepare("
        SELECT s.id as child_id, s.id as student_id, 
               CONCAT(s.first_name, ' ', s.last_name) as full_name,
               s.class_id, cl.class_name, s.photo
        FROM students s
        LEFT JOIN classes cl ON s.class_id = cl.id
        WHERE s.parent_id = ?
    ");
    $stmt->execute(array($actualParentId));
    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $result['debug_steps']['children'] = $children;
    $result['children_count'] = count($children);

    // Step 3: For each child, get stats
    $result['children_summary'] = array();
    
    foreach ($children as $child) {
        $studentId = $child['student_id'];
        $classId = $child['class_id'];
        
        $summary = array(
            'student_id' => $studentId,
            'student_name' => $child['full_name'],
            'class_id' => $classId,
            'class_name' => $child['class_name']
        );
        
        // Check assessment_grades table
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'assessment_grades'");
        $summary['assessment_grades_table_exists'] = $tableCheck->rowCount() > 0;
        
        // Get assessment grades count
        if ($summary['assessment_grades_table_exists']) {
            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM assessment_grades WHERE student_id = ?");
            $stmt->execute(array($studentId));
            $summary['assessment_grades_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
            
            // Get average score
            $stmt = $pdo->prepare("
                SELECT AVG(ROUND((ag.marks_obtained / a.total_marks) * 100, 1)) as avg_score
                FROM assessment_grades ag
                JOIN assessments a ON ag.assessment_id = a.id
                WHERE ag.student_id = ?
            ");
            $stmt->execute(array($studentId));
            $avgResult = $stmt->fetch(PDO::FETCH_ASSOC);
            $summary['average_score_from_assessments'] = $avgResult['avg_score'];
        }
        
        // Get homework grades
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as cnt, AVG(ROUND((hs.marks_obtained / h.total_marks) * 100, 1)) as avg_score
            FROM homework_submissions hs
            JOIN homework h ON hs.homework_id = h.id
            WHERE hs.student_id = ? AND hs.status = 'graded' AND hs.marks_obtained IS NOT NULL
        ");
        $stmt->execute(array($studentId));
        $hwResult = $stmt->fetch(PDO::FETCH_ASSOC);
        $summary['homework_grades_count'] = $hwResult['cnt'];
        $summary['average_score_from_homework'] = $hwResult['avg_score'];
        
        // Get subjects count
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT subject_id) as cnt FROM class_subjects WHERE class_id = ?");
        $stmt->execute(array($classId));
        $summary['subjects_from_class_subjects'] = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        
        // Check if class_subjects table has data
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM class_subjects");
        $summary['total_class_subjects_records'] = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        
        // Get total subjects
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM subjects WHERE status = 'active'");
        $summary['total_active_subjects'] = $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        
        // Get attendance
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                COUNT(*) as total
            FROM attendance
            WHERE student_id = ?
        ");
        $stmt->execute(array($studentId));
        $attResult = $stmt->fetch(PDO::FETCH_ASSOC);
        $summary['attendance_present'] = $attResult['present'];
        $summary['attendance_total'] = $attResult['total'];
        $summary['attendance_rate'] = $attResult['total'] > 0 ? round(($attResult['present'] / $attResult['total']) * 100, 1) : 0;
        
        $result['children_summary'][] = $summary;
    }

    // Step 4: Check what the actual API returns
    $result['debug_steps']['note'] = 'Compare this with what ParentDashboard.jsx expects';

    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(array(
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ));
}

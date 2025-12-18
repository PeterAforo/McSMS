<?php
/**
 * Debug script to test loading grades for assessment 5
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Try multiple config paths for compatibility
$configPaths = array(
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(__DIR__, 2) . '/config/database.php'
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
    
    $assessment_id = isset($_GET['assessment_id']) ? $_GET['assessment_id'] : 5;
    
    $result = array(
        'assessment_id' => $assessment_id
    );
    
    // Check if table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'assessment_grades'");
    $result['table_exists'] = $tableCheck->rowCount() > 0;
    
    if ($result['table_exists']) {
        // Get all grades for this assessment
        $stmt = $pdo->prepare("SELECT * FROM assessment_grades WHERE assessment_id = ?");
        $stmt->execute(array($assessment_id));
        $result['raw_grades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get grades with student info
        $stmt2 = $pdo->prepare("
            SELECT ag.*, s.first_name, s.last_name, s.student_id as student_code
            FROM assessment_grades ag
            JOIN students s ON ag.student_id = s.id
            WHERE ag.assessment_id = ?
        ");
        $stmt2->execute(array($assessment_id));
        $result['grades_with_students'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        
        // Count total grades
        $countStmt = $pdo->query("SELECT COUNT(*) as count FROM assessment_grades");
        $result['total_grades_in_table'] = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(array(
        'error' => $e->getMessage()
    ));
}

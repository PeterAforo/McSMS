<?php
/**
 * Debug script for grades API
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
    echo json_encode(array('error' => 'Config not found', 'paths_tried' => $configPaths));
    exit();
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
    );
    
    $result = array(
        'php_version' => phpversion(),
        'connection' => 'success',
        'database' => DB_NAME
    );
    
    // Check if assessment_grades table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'assessment_grades'");
    $result['assessment_grades_table_exists'] = $tableCheck->rowCount() > 0;
    
    // Check if assessments table exists
    $tableCheck2 = $pdo->query("SHOW TABLES LIKE 'assessments'");
    $result['assessments_table_exists'] = $tableCheck2->rowCount() > 0;
    
    // Try to create the table
    $pdo->exec("CREATE TABLE IF NOT EXISTS assessment_grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assessment_id INT NOT NULL,
        student_id INT NOT NULL,
        marks_obtained DECIMAL(10,2),
        grade VARCHAR(5),
        comment TEXT,
        graded_by INT,
        graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_assessment_student (assessment_id, student_id)
    )");
    $result['table_created'] = true;
    
    // Check table again
    $tableCheck3 = $pdo->query("SHOW TABLES LIKE 'assessment_grades'");
    $result['assessment_grades_table_exists_after_create'] = $tableCheck3->rowCount() > 0;
    
    // Try inserting a test grade
    $stmt = $pdo->prepare("
        INSERT INTO assessment_grades (assessment_id, student_id, marks_obtained, grade, comment, graded_by)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            marks_obtained = VALUES(marks_obtained),
            grade = VALUES(grade),
            comment = VALUES(comment),
            graded_by = VALUES(graded_by),
            graded_at = NOW()
    ");
    
    // Use test values
    $testAssessmentId = 1;
    $testStudentId = 1;
    $testMarks = 85;
    $testGrade = 'A';
    $testComment = 'Test comment';
    $testGradedBy = 1;
    
    $stmt->execute(array($testAssessmentId, $testStudentId, $testMarks, $testGrade, $testComment, $testGradedBy));
    $result['test_insert'] = 'success';
    $result['rows_affected'] = $stmt->rowCount();
    
    // Read back the grade
    $readStmt = $pdo->prepare("SELECT * FROM assessment_grades WHERE assessment_id = ? AND student_id = ?");
    $readStmt->execute(array($testAssessmentId, $testStudentId));
    $result['read_back'] = $readStmt->fetch(PDO::FETCH_ASSOC);
    
    // Count total grades
    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM assessment_grades");
    $result['total_grades_in_table'] = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(array(
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ));
}

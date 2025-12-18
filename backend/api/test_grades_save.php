<?php
/**
 * Debug script to test saving grades directly
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
    
    // Test data - save grades for assessment 5
    $assessment_id = 5;
    $graded_by = 1;
    
    // Get students from class (assuming assessment 5 is for class 1)
    $stmt = $pdo->prepare("SELECT class_id FROM assessments WHERE id = ?");
    $stmt->execute(array($assessment_id));
    $assessment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$assessment) {
        echo json_encode(array('error' => 'Assessment not found', 'assessment_id' => $assessment_id));
        exit();
    }
    
    $class_id = $assessment['class_id'];
    
    // Get first 3 students from this class
    $stmt = $pdo->prepare("SELECT id, first_name, last_name FROM students WHERE class_id = ? LIMIT 3");
    $stmt->execute(array($class_id));
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = array(
        'assessment_id' => $assessment_id,
        'class_id' => $class_id,
        'students_found' => count($students),
        'students' => $students
    );
    
    // Create table if not exists
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
    
    // Save test grades
    $savedCount = 0;
    foreach ($students as $index => $student) {
        $marks = 70 + ($index * 10); // 70, 80, 90
        $grade = $marks >= 80 ? 'A' : ($marks >= 70 ? 'B' : 'C');
        
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
        $stmt->execute(array(
            $assessment_id,
            $student['id'],
            $marks,
            $grade,
            'Test grade from debug script',
            $graded_by
        ));
        $savedCount++;
    }
    
    $result['saved_count'] = $savedCount;
    
    // Verify by reading back
    $stmt = $pdo->prepare("SELECT * FROM assessment_grades WHERE assessment_id = ?");
    $stmt->execute(array($assessment_id));
    $result['grades_after_save'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Total in table
    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM assessment_grades");
    $result['total_grades_in_table'] = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(array(
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ));
}

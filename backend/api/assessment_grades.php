<?php
/**
 * Assessment Grades API
 * Standalone endpoint for saving and loading assessment grades
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
    echo json_encode(array('success' => false, 'error' => 'Config not found'));
    exit();
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $assessment_id = isset($_GET['assessment_id']) ? $_GET['assessment_id'] : null;
    $action = isset($_GET['action']) ? $_GET['action'] : null;

    // Ensure table exists
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

    switch ($method) {
        case 'GET':
            if ($assessment_id) {
                $stmt = $pdo->prepare("
                    SELECT ag.*, s.first_name, s.last_name, s.student_id as student_code
                    FROM assessment_grades ag
                    JOIN students s ON ag.student_id = s.id
                    WHERE ag.assessment_id = ?
                ");
                $stmt->execute(array($assessment_id));
                echo json_encode(array('success' => true, 'grades' => $stmt->fetchAll(PDO::FETCH_ASSOC)));
            } else {
                echo json_encode(array('success' => true, 'grades' => array()));
            }
            break;

        case 'POST':
            $rawInput = file_get_contents('php://input');
            $data = json_decode($rawInput, true);
            
            $assessment_id = isset($data['assessment_id']) ? $data['assessment_id'] : null;
            $grades = isset($data['grades']) ? $data['grades'] : array();
            $graded_by = isset($data['graded_by']) ? $data['graded_by'] : 1;

            if (!$assessment_id || empty($grades)) {
                echo json_encode(array(
                    'success' => false, 
                    'error' => 'Assessment ID and grades required',
                    'received_assessment_id' => $assessment_id,
                    'received_grades_count' => count($grades)
                ));
                break;
            }

            $savedCount = 0;
            $errors = array();
            
            foreach ($grades as $grade) {
                $studentId = isset($grade['student_id']) ? $grade['student_id'] : null;
                $marksObtained = isset($grade['marks_obtained']) ? $grade['marks_obtained'] : null;
                $gradeValue = isset($grade['grade']) ? $grade['grade'] : null;
                $comment = isset($grade['comment']) ? $grade['comment'] : '';
                
                if ($studentId && $marksObtained !== null && $marksObtained !== '') {
                    try {
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
                            $studentId,
                            $marksObtained,
                            $gradeValue,
                            $comment,
                            $graded_by
                        ));
                        $savedCount++;
                    } catch (Exception $e) {
                        $errors[] = "Student $studentId: " . $e->getMessage();
                    }
                }
            }
            
            echo json_encode(array(
                'success' => true, 
                'message' => 'Grades saved successfully', 
                'count' => $savedCount,
                'assessment_id' => $assessment_id,
                'errors' => $errors
            ));
            break;

        default:
            echo json_encode(array('success' => false, 'error' => 'Method not allowed'));
    }

} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}

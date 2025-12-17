<?php
/**
 * Homework Submissions API
 * Handles student homework submissions and teacher grading
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display, but log

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Try multiple config paths for compatibility (PHP 5.6 compatible)
$configPaths = array(
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(dirname(__DIR__)) . '/config/database.php'
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
    echo json_encode(['success' => false, 'error' => 'Database config not found']);
    exit();
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
    );
    
    // Ensure required columns exist
    ensureTableStructure($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    switch ($method) {
        case 'GET':
            if ($action === 'student') {
                getStudentSubmissions($pdo);
            } elseif ($action === 'homework') {
                getHomeworkSubmissions($pdo);
            } elseif ($action === 'check') {
                checkSubmission($pdo);
            } else {
                getSubmissions($pdo);
            }
            break;
            
        case 'POST':
            if ($action === 'submit') {
                submitHomework($pdo);
            } elseif ($action === 'grade') {
                gradeSubmission($pdo);
            } elseif ($action === 'bulk_grade') {
                bulkGradeSubmissions($pdo);
            } else {
                submitHomework($pdo);
            }
            break;
            
        case 'PUT':
            updateSubmission($pdo);
            break;
            
        case 'DELETE':
            deleteSubmission($pdo);
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function ensureTableStructure($pdo) {
    // Check and add missing columns to homework_submissions
    try {
        $columns = $pdo->query("SHOW COLUMNS FROM homework_submissions")->fetchAll(PDO::FETCH_COLUMN);
        
        if (!in_array('status', $columns)) {
            $pdo->exec("ALTER TABLE homework_submissions ADD COLUMN status VARCHAR(20) DEFAULT 'submitted'");
        }
        if (!in_array('score', $columns)) {
            $pdo->exec("ALTER TABLE homework_submissions ADD COLUMN score DECIMAL(5,2) DEFAULT NULL");
        }
        if (!in_array('feedback', $columns)) {
            $pdo->exec("ALTER TABLE homework_submissions ADD COLUMN feedback TEXT DEFAULT NULL");
        }
        if (!in_array('graded_at', $columns)) {
            $pdo->exec("ALTER TABLE homework_submissions ADD COLUMN graded_at TIMESTAMP NULL DEFAULT NULL");
        }
        if (!in_array('graded_by', $columns)) {
            $pdo->exec("ALTER TABLE homework_submissions ADD COLUMN graded_by INT DEFAULT NULL");
        }
        if (!in_array('submission_text', $columns)) {
            $pdo->exec("ALTER TABLE homework_submissions ADD COLUMN submission_text TEXT DEFAULT NULL");
        }
    } catch (Exception $e) {
        // Table might not exist, ignore
    }
    
    // Check and add missing columns to homework
    try {
        $columns = $pdo->query("SHOW COLUMNS FROM homework")->fetchAll(PDO::FETCH_COLUMN);
        
        if (!in_array('total_marks', $columns)) {
            $pdo->exec("ALTER TABLE homework ADD COLUMN total_marks DECIMAL(5,2) DEFAULT 100");
        }
        if (!in_array('status', $columns)) {
            $pdo->exec("ALTER TABLE homework ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
        }
        if (!in_array('term_id', $columns)) {
            $pdo->exec("ALTER TABLE homework ADD COLUMN term_id INT DEFAULT NULL");
        }
    } catch (Exception $e) {
        // Table might not exist, ignore
    }
}

function submitHomework($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $homeworkId = $data['homework_id'] ?? $_POST['homework_id'] ?? null;
        $studentId = $data['student_id'] ?? $_POST['student_id'] ?? null;
        $submissionText = $data['submission_text'] ?? $_POST['submission_text'] ?? null;
        $file = $data['file'] ?? $_POST['file'] ?? null;
        
        if (!$homeworkId || !$studentId) {
            echo json_encode(['success' => false, 'error' => 'Homework ID and Student ID are required']);
            return;
        }
        
        // Check if homework exists and get due date
        $stmt = $pdo->prepare("SELECT * FROM homework WHERE id = ?");
        $stmt->execute([$homeworkId]);
        $homework = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$homework) {
            echo json_encode(['success' => false, 'error' => 'Homework not found']);
            return;
        }
        
        // Check if already submitted
        $stmt = $pdo->prepare("SELECT id FROM homework_submissions WHERE homework_id = ? AND student_id = ?");
        $stmt->execute([$homeworkId, $studentId]);
        $existing = $stmt->fetch();
        
        // Determine if late
        $isLate = strtotime($homework['due_date']) < time();
        $status = $isLate ? 'late' : 'submitted';
        
        // Check which columns exist in homework_submissions
        $columns = $pdo->query("SHOW COLUMNS FROM homework_submissions")->fetchAll(PDO::FETCH_COLUMN);
        $hasSubmissionText = in_array('submission_text', $columns);
        
        if ($existing) {
            // Update existing submission
            if ($hasSubmissionText) {
                $stmt = $pdo->prepare("
                    UPDATE homework_submissions 
                    SET submission_text = ?, file = ?, status = ?, submitted_at = NOW()
                    WHERE homework_id = ? AND student_id = ?
                ");
                $stmt->execute([$submissionText, $file, $status, $homeworkId, $studentId]);
            } else {
                $stmt = $pdo->prepare("
                    UPDATE homework_submissions 
                    SET file = ?, status = ?, submitted_at = NOW()
                    WHERE homework_id = ? AND student_id = ?
                ");
                $stmt->execute([$submissionText, $status, $homeworkId, $studentId]); // Use file column for text
            }
            $submissionId = $existing['id'];
        } else {
            // Create new submission
            if ($hasSubmissionText) {
                $stmt = $pdo->prepare("
                    INSERT INTO homework_submissions (homework_id, student_id, submission_text, file, status, submitted_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([$homeworkId, $studentId, $submissionText, $file, $status]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO homework_submissions (homework_id, student_id, file, status, submitted_at)
                    VALUES (?, ?, ?, ?, NOW())
                ");
                $stmt->execute([$homeworkId, $studentId, $submissionText, $status]); // Use file column for text
            }
            $submissionId = $pdo->lastInsertId();
        }
        
        echo json_encode([
            'success' => true,
            'message' => $isLate ? 'Homework submitted (late)' : 'Homework submitted successfully',
            'submission_id' => $submissionId,
            'is_late' => $isLate
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

function gradeSubmission($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $submissionId = $data['submission_id'] ?? $_GET['id'] ?? null;
    $score = $data['score'] ?? $data['marks_obtained'] ?? null;
    $feedback = $data['feedback'] ?? '';
    $gradedBy = $data['graded_by'] ?? null;
    
    if (!$submissionId) {
        echo json_encode(['success' => false, 'error' => 'Submission ID is required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        UPDATE homework_submissions 
        SET score = ?, feedback = ?, status = 'graded', graded_at = NOW(), graded_by = ?
        WHERE id = ?
    ");
    $stmt->execute([$score, $feedback, $gradedBy, $submissionId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Submission graded successfully'
    ]);
}

function bulkGradeSubmissions($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $grades = $data['grades'] ?? [];
    $gradedBy = $data['graded_by'] ?? null;
    
    if (empty($grades)) {
        echo json_encode(['success' => false, 'error' => 'No grades provided']);
        return;
    }
    
    $stmt = $pdo->prepare("
        UPDATE homework_submissions 
        SET score = ?, feedback = ?, status = 'graded', graded_at = NOW(), graded_by = ?
        WHERE id = ?
    ");
    
    $count = 0;
    foreach ($grades as $grade) {
        $stmt->execute([
            $grade['score'] ?? $grade['marks_obtained'] ?? null,
            $grade['feedback'] ?? '',
            $gradedBy,
            $grade['submission_id'] ?? $grade['id']
        ]);
        $count++;
    }
    
    echo json_encode([
        'success' => true,
        'message' => "$count submissions graded successfully",
        'count' => $count
    ]);
}

function getSubmissions($pdo) {
    $homeworkId = $_GET['homework_id'] ?? null;
    
    $sql = "
        SELECT hs.*, 
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               s.student_id as admission_no,
               h.title as homework_title,
               h.due_date,
               h.total_marks
        FROM homework_submissions hs
        JOIN students s ON hs.student_id = s.id
        JOIN homework h ON hs.homework_id = h.id
    ";
    
    $params = [];
    if ($homeworkId) {
        $sql .= " WHERE hs.homework_id = ?";
        $params[] = $homeworkId;
    }
    
    $sql .= " ORDER BY hs.submitted_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'submissions' => $submissions
    ]);
}

function getStudentSubmissions($pdo) {
    $studentId = $_GET['student_id'] ?? null;
    
    if (!$studentId) {
        echo json_encode(['success' => false, 'error' => 'Student ID required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT hs.*, 
               h.title as homework_title,
               h.description as homework_description,
               h.due_date,
               h.total_marks,
               sub.subject_name
        FROM homework_submissions hs
        JOIN homework h ON hs.homework_id = h.id
        LEFT JOIN subjects sub ON h.subject_id = sub.id
        WHERE hs.student_id = ?
        ORDER BY hs.submitted_at DESC
    ");
    $stmt->execute([$studentId]);
    $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'submissions' => $submissions
    ]);
}

function getHomeworkSubmissions($pdo) {
    $homeworkId = $_GET['homework_id'] ?? null;
    
    if (!$homeworkId) {
        echo json_encode(['success' => false, 'error' => 'Homework ID required']);
        return;
    }
    
    // Get homework details
    $stmt = $pdo->prepare("
        SELECT h.*, sub.subject_name, c.class_name
        FROM homework h
        LEFT JOIN subjects sub ON h.subject_id = sub.id
        LEFT JOIN classes c ON h.class_id = c.id
        WHERE h.id = ?
    ");
    $stmt->execute([$homeworkId]);
    $homework = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$homework) {
        echo json_encode(['success' => false, 'error' => 'Homework not found']);
        return;
    }
    
    // Get all students in the class
    $stmt = $pdo->prepare("
        SELECT s.id, s.student_id as admission_no, 
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               hs.id as submission_id, hs.status, hs.score, hs.feedback,
               hs.submitted_at, hs.submission_text, hs.file
        FROM students s
        LEFT JOIN homework_submissions hs ON s.id = hs.student_id AND hs.homework_id = ?
        WHERE s.class_id = ?
        ORDER BY s.first_name
    ");
    $stmt->execute([$homeworkId, $homework['class_id']]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate stats
    $totalStudents = count($students);
    $submitted = count(array_filter($students, fn($s) => $s['submission_id']));
    $graded = count(array_filter($students, fn($s) => $s['status'] === 'graded'));
    $pending = $totalStudents - $submitted;
    
    echo json_encode([
        'success' => true,
        'homework' => $homework,
        'students' => $students,
        'stats' => [
            'total_students' => $totalStudents,
            'submitted' => $submitted,
            'graded' => $graded,
            'pending' => $pending
        ]
    ]);
}

function checkSubmission($pdo) {
    $homeworkId = $_GET['homework_id'] ?? null;
    $studentId = $_GET['student_id'] ?? null;
    
    if (!$homeworkId || !$studentId) {
        echo json_encode(['success' => false, 'error' => 'Homework ID and Student ID required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT hs.*, h.due_date, h.total_marks
        FROM homework_submissions hs
        JOIN homework h ON hs.homework_id = h.id
        WHERE hs.homework_id = ? AND hs.student_id = ?
    ");
    $stmt->execute([$homeworkId, $studentId]);
    $submission = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'submitted' => $submission ? true : false,
        'submission' => $submission
    ]);
}

function updateSubmission($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'] ?? $data['id'] ?? null;
    
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'Submission ID required']);
        return;
    }
    
    $submissionText = $data['submission_text'] ?? null;
    $file = $data['file'] ?? null;
    
    $stmt = $pdo->prepare("
        UPDATE homework_submissions 
        SET submission_text = COALESCE(?, submission_text), 
            file = COALESCE(?, file),
            submitted_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$submissionText, $file, $id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Submission updated'
    ]);
}

function deleteSubmission($pdo) {
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'Submission ID required']);
        return;
    }
    
    $stmt = $pdo->prepare("DELETE FROM homework_submissions WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Submission deleted'
    ]);
}

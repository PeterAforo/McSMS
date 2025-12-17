<?php
/**
 * Homework Management API
 * Handles all homework and assignment operations
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Try multiple config paths for compatibility
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
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Config file not found']);
    exit();
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    switch ($method) {
        case 'GET':
            if ($action === 'submissions') {
                getSubmissions($pdo);
            } elseif ($action === 'student_homework') {
                getStudentHomework($pdo);
            } elseif ($action === 'stats') {
                getHomeworkStats($pdo);
            } elseif ($action === 'pending') {
                getPendingHomework($pdo);
            } else {
                getHomework($pdo);
            }
            break;

        case 'POST':
            if ($action === 'submit') {
                submitHomework($pdo);
            } elseif ($action === 'grade') {
                gradeSubmission($pdo);
            } else {
                createHomework($pdo);
            }
            break;

        case 'PUT':
            updateHomework($pdo);
            break;

        case 'DELETE':
            deleteHomework($pdo);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function getHomework($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $subjectId = $_GET['subject_id'] ?? null;
    $teacherId = $_GET['teacher_id'] ?? null;
    $status = $_GET['status'] ?? null;

    $sql = "
        SELECT 
            h.*,
            c.name as class_name,
            sub.name as subject_name,
            sub.code as subject_code,
            u.first_name as teacher_first_name,
            u.last_name as teacher_last_name,
            (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id) as total_submissions,
            (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id AND status = 'submitted') as submitted_count,
            (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id AND status = 'graded') as graded_count
        FROM homework h
        LEFT JOIN classes c ON h.class_id = c.id
        LEFT JOIN subjects sub ON h.subject_id = sub.id
        LEFT JOIN teachers t ON h.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
    ";

    $params = [];

    if ($classId) {
        $sql .= " AND h.class_id = ?";
        $params[] = $classId;
    }

    if ($subjectId) {
        $sql .= " AND h.subject_id = ?";
        $params[] = $subjectId;
    }

    if ($teacherId) {
        $sql .= " AND h.teacher_id = ?";
        $params[] = $teacherId;
    }

    if ($status) {
        $sql .= " AND h.status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY h.due_date DESC, h.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $homework = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'homework' => $homework
    ]);
}

function getSubmissions($pdo) {
    $homeworkId = $_GET['homework_id'] ?? null;
    $studentId = $_GET['student_id'] ?? null;
    $status = $_GET['status'] ?? null;

    if (!$homeworkId && !$studentId) {
        throw new Exception('Either homework_id or student_id is required');
    }

    $sql = "
        SELECT 
            hs.*,
            s.first_name,
            s.last_name,
            s.student_id as student_number,
            h.title as homework_title,
            h.due_date,
            h.max_score,
            sub.name as subject_name,
            c.name as class_name
        FROM homework_submissions hs
        LEFT JOIN students s ON hs.student_id = s.id
        LEFT JOIN homework h ON hs.homework_id = h.id
        LEFT JOIN subjects sub ON h.subject_id = sub.id
        LEFT JOIN classes c ON h.class_id = c.id
        WHERE 1=1
    ";

    $params = [];

    if ($homeworkId) {
        $sql .= " AND hs.homework_id = ?";
        $params[] = $homeworkId;
    }

    if ($studentId) {
        $sql .= " AND hs.student_id = ?";
        $params[] = $studentId;
    }

    if ($status) {
        $sql .= " AND hs.status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY hs.submitted_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if late
    foreach ($submissions as &$submission) {
        if ($submission['submitted_at'] && $submission['due_date']) {
            $submission['is_late'] = strtotime($submission['submitted_at']) > strtotime($submission['due_date']);
        } else {
            $submission['is_late'] = false;
        }
    }

    echo json_encode([
        'success' => true,
        'submissions' => $submissions
    ]);
}

function getStudentHomework($pdo) {
    $studentId = $_GET['student_id'] ?? null;
    $status = $_GET['status'] ?? null;

    if (!$studentId) {
        throw new Exception('Student ID is required');
    }

    // Get student's class
    $classSql = "SELECT class_id FROM students WHERE id = ?";
    $classStmt = $pdo->prepare($classSql);
    $classStmt->execute([$studentId]);
    $student = $classStmt->fetch();

    if (!$student) {
        throw new Exception('Student not found');
    }

    // If student has no class assigned, return empty homework list
    if (!$student['class_id']) {
        echo json_encode([
            'success' => true,
            'homework' => [],
            'message' => 'Student is not assigned to any class yet'
        ]);
        return;
    }

    // Get all homework for student's class
    $sql = "
        SELECT 
            h.*,
            sub.subject_name,
            sub.subject_code,
            u.first_name as teacher_first_name,
            u.last_name as teacher_last_name,
            hs.id as submission_id,
            hs.status as submission_status,
            hs.submitted_at,
            hs.score as submission_score,
            hs.feedback,
            hs.file_path as submission_file
        FROM homework h
        LEFT JOIN subjects sub ON h.subject_id = sub.id
        LEFT JOIN teachers t ON h.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = ?
        WHERE h.class_id = ?
    ";

    $params = [$studentId, $student['class_id']];

    if ($status === 'pending') {
        $sql .= " AND (hs.id IS NULL OR hs.status = 'draft')";
    } elseif ($status === 'submitted') {
        $sql .= " AND hs.status = 'submitted'";
    } elseif ($status === 'graded') {
        $sql .= " AND hs.status = 'graded'";
    }

    $sql .= " ORDER BY h.due_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $homework = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if overdue
    $currentDate = date('Y-m-d H:i:s');
    foreach ($homework as &$hw) {
        $hw['is_overdue'] = !$hw['submission_id'] && $hw['due_date'] < $currentDate;
        $hw['is_late'] = $hw['submitted_at'] && $hw['submitted_at'] > $hw['due_date'];
    }

    echo json_encode([
        'success' => true,
        'homework' => $homework
    ]);
}

function getPendingHomework($pdo) {
    $teacherId = $_GET['teacher_id'] ?? null;

    if (!$teacherId) {
        throw new Exception('Teacher ID is required');
    }

    $sql = "
        SELECT 
            h.*,
            c.name as class_name,
            sub.name as subject_name,
            (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id AND status = 'submitted') as pending_count
        FROM homework h
        LEFT JOIN classes c ON h.class_id = c.id
        LEFT JOIN subjects sub ON h.subject_id = sub.id
        WHERE h.teacher_id = ?
        HAVING pending_count > 0
        ORDER BY h.due_date ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$teacherId]);
    $homework = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'pending_homework' => $homework
    ]);
}

function getHomeworkStats($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $teacherId = $_GET['teacher_id'] ?? null;

    $sql = "
        SELECT 
            COUNT(*) as total_homework,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_homework,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_homework,
            SUM(CASE WHEN due_date < NOW() AND status = 'active' THEN 1 ELSE 0 END) as overdue_homework
        FROM homework
        WHERE 1=1
    ";

    $params = [];

    if ($classId) {
        $sql .= " AND class_id = ?";
        $params[] = $classId;
    }

    if ($teacherId) {
        $sql .= " AND teacher_id = ?";
        $params[] = $teacherId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get submission stats
    $submissionSql = "
        SELECT 
            COUNT(*) as total_submissions,
            SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending_grading,
            SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded_submissions,
            AVG(CASE WHEN status = 'graded' THEN score ELSE NULL END) as average_score
        FROM homework_submissions hs
        JOIN homework h ON hs.homework_id = h.id
        WHERE 1=1
    ";

    if ($classId) {
        $submissionSql .= " AND h.class_id = ?";
    }

    if ($teacherId) {
        $submissionSql .= " AND h.teacher_id = ?";
    }

    $submissionStmt = $pdo->prepare($submissionSql);
    $submissionStmt->execute($params);
    $submissionStats = $submissionStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'stats' => array_merge($stats, $submissionStats)
    ]);
}

function createHomework($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['title', 'class_id', 'subject_id', 'teacher_id', 'due_date'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("$field is required");
        }
    }

    $sql = "
        INSERT INTO homework (
            title, description, class_id, subject_id, teacher_id,
            due_date, max_score, instructions, attachment_path, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['title'],
        $data['description'] ?? null,
        $data['class_id'],
        $data['subject_id'],
        $data['teacher_id'],
        $data['due_date'],
        $data['max_score'] ?? 100,
        $data['instructions'] ?? null,
        $data['attachment_path'] ?? null,
        $data['status'] ?? 'active'
    ]);

    $homeworkId = $pdo->lastInsertId();

    // Create submission records for all students in the class
    $studentsSql = "SELECT id FROM students WHERE class_id = ? AND status = 'active'";
    $studentsStmt = $pdo->prepare($studentsSql);
    $studentsStmt->execute([$data['class_id']]);
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);

    $submissionSql = "
        INSERT INTO homework_submissions (homework_id, student_id, status)
        VALUES (?, ?, 'pending')
    ";
    $submissionStmt = $pdo->prepare($submissionSql);

    foreach ($students as $student) {
        $submissionStmt->execute([$homeworkId, $student['id']]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Homework created successfully',
        'id' => $homeworkId,
        'students_count' => count($students)
    ]);
}

function submitHomework($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['homework_id', 'student_id'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("$field is required");
        }
    }

    // Check if submission exists
    $checkSql = "
        SELECT id FROM homework_submissions 
        WHERE homework_id = ? AND student_id = ?
    ";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$data['homework_id'], $data['student_id']]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        // Update existing submission
        $sql = "
            UPDATE homework_submissions 
            SET content = ?, file_path = ?, status = 'submitted', submitted_at = NOW()
            WHERE id = ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['content'] ?? null,
            $data['file_path'] ?? null,
            $existing['id']
        ]);

        $message = 'Homework submitted successfully';
    } else {
        // Create new submission
        $sql = "
            INSERT INTO homework_submissions (
                homework_id, student_id, content, file_path, status, submitted_at
            ) VALUES (?, ?, ?, ?, 'submitted', NOW())
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['homework_id'],
            $data['student_id'],
            $data['content'] ?? null,
            $data['file_path'] ?? null
        ]);

        $message = 'Homework submitted successfully';
    }

    echo json_encode([
        'success' => true,
        'message' => $message
    ]);
}

function gradeSubmission($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['submission_id', 'score'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("$field is required");
        }
    }

    $sql = "
        UPDATE homework_submissions 
        SET score = ?, feedback = ?, status = 'graded', graded_at = NOW(), graded_by = ?
        WHERE id = ?
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['score'],
        $data['feedback'] ?? null,
        $data['graded_by'] ?? null,
        $data['submission_id']
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Submission graded successfully'
    ]);
}

function updateHomework($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'] ?? $data['id'] ?? null;

    if (!$id) {
        throw new Exception('Homework ID is required');
    }

    $fields = [];
    $params = [];

    $allowedFields = ['title', 'description', 'due_date', 'max_score', 'instructions', 'attachment_path', 'status'];
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $fields[] = "$field = ?";
            $params[] = $data[$field];
        }
    }

    if (empty($fields)) {
        throw new Exception('No fields to update');
    }

    $params[] = $id;
    $sql = "UPDATE homework SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'message' => 'Homework updated successfully'
    ]);
}

function deleteHomework($pdo) {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        throw new Exception('Homework ID is required');
    }

    // Delete submissions first
    $deleteSubs = $pdo->prepare("DELETE FROM homework_submissions WHERE homework_id = ?");
    $deleteSubs->execute([$id]);

    // Delete homework
    $stmt = $pdo->prepare("DELETE FROM homework WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode([
        'success' => true,
        'message' => 'Homework deleted successfully'
    ]);
}
?>

<?php
/**
 * Grades API
 * Handles student grades and results
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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
    $studentId = $_GET['student_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;
    $classId = $_GET['class_id'] ?? null;

    switch ($method) {
        case 'GET':
            getGrades($pdo, $studentId, $termId, $classId);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function getGrades($pdo, $studentId, $termId, $classId) {
    // If no student_id provided, return empty
    if (!$studentId) {
        echo json_encode([
            'success' => true,
            'grades' => [],
            'summary' => null,
            'message' => 'Student ID is required'
        ]);
        return;
    }

    // Check if exam_results table exists
    try {
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'exam_results'");
        if ($tableCheck->rowCount() === 0) {
            echo json_encode([
                'success' => true,
                'grades' => [],
                'summary' => null,
                'message' => 'Grades feature not yet configured'
            ]);
            return;
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => true,
            'grades' => [],
            'summary' => null,
            'message' => 'Grades feature not available'
        ]);
        return;
    }

    // Get student info
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, class_id FROM students WHERE id = ?");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode([
            'success' => true,
            'grades' => [],
            'summary' => null,
            'message' => 'Student not found'
        ]);
        return;
    }

    try {
        // Try to get grades from exam_results
        $sql = "
            SELECT 
                er.id,
                er.student_id,
                er.marks_obtained as score,
                er.percentage,
                er.grade,
                er.remarks,
                es.exam_name,
                es.exam_date,
                es.total_marks as max_score,
                s.subject_name,
                s.subject_code,
                t.name as term_name
            FROM exam_results er
            LEFT JOIN exam_schedules es ON er.exam_schedule_id = es.id
            LEFT JOIN subjects s ON es.subject_id = s.id
            LEFT JOIN terms t ON es.term_id = t.id
            WHERE er.student_id = ?
        ";
        
        $params = [$studentId];
        
        if ($termId) {
            $sql .= " AND es.term_id = ?";
            $params[] = $termId;
        }
        
        $sql .= " ORDER BY es.exam_date DESC, s.subject_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate summary
        $summary = null;
        if (count($grades) > 0) {
            $totalScore = 0;
            $totalMax = 0;
            foreach ($grades as $grade) {
                $totalScore += floatval($grade['score'] ?? 0);
                $totalMax += floatval($grade['max_score'] ?? 100);
            }
            $summary = [
                'total_subjects' => count($grades),
                'average_score' => $totalMax > 0 ? round(($totalScore / $totalMax) * 100, 2) : 0,
                'total_marks' => $totalScore,
                'max_marks' => $totalMax
            ];
        }

        echo json_encode([
            'success' => true,
            'grades' => $grades,
            'summary' => $summary,
            'student' => $student
        ]);

    } catch (Exception $e) {
        // Return empty on any SQL error
        echo json_encode([
            'success' => true,
            'grades' => [],
            'summary' => null,
            'message' => 'No grades data available'
        ]);
    }
}

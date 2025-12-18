<?php
/**
 * Homework Grades Integration API
 * Calculates homework contribution to term scores
 * 
 * Grading Formula:
 * - Homework contributes to CA (Continuous Assessment) score
 * - CA Score = Homework Average (weighted)
 * - Final Score = CA (30%) + Exam (70%)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Try multiple config paths for compatibility
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
    echo json_encode(array('success' => false, 'error' => 'Database config not found'));
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
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    switch ($action) {
        case 'student_homework_summary':
            getStudentHomeworkSummary($pdo);
            break;
        case 'class_homework_summary':
            getClassHomeworkSummary($pdo);
            break;
        case 'calculate_ca':
            calculateCAScore($pdo);
            break;
        case 'term_report':
            getTermReport($pdo);
            break;
        default:
            echo json_encode(array('success' => true, 'message' => 'Homework Grades API', 'actions' => array(
                'student_homework_summary' => 'Get homework summary for a student',
                'class_homework_summary' => 'Get homework summary for a class',
                'calculate_ca' => 'Calculate CA score from homework',
                'term_report' => 'Get full term report with homework contribution'
            )));
    }

} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}

/**
 * Get homework summary for a specific student
 * Shows all homework scores by subject for a term
 */
function getStudentHomeworkSummary($pdo) {
    $studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;
    $termId = isset($_GET['term_id']) ? $_GET['term_id'] : null;

    if (!$studentId) {
        echo json_encode(array('success' => false, 'error' => 'Student ID required'));
        return;
    }

    // Get student info
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, class_id FROM students WHERE id = ?");
    $stmt->execute(array($studentId));
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(array('success' => false, 'error' => 'Student not found'));
        return;
    }

    // Get homework submissions with scores grouped by subject
    $sql = "
        SELECT 
            s.id as subject_id,
            s.subject_name,
            COUNT(h.id) as total_homework,
            COUNT(hs.id) as submitted_count,
            SUM(CASE WHEN hs.status = 'graded' THEN 1 ELSE 0 END) as graded_count,
            SUM(COALESCE(hs.marks_obtained, hs.score, 0)) as total_marks_obtained,
            SUM(COALESCE(h.total_marks, 100)) as total_possible_marks,
            ROUND(
                (SUM(COALESCE(hs.marks_obtained, hs.score, 0)) / NULLIF(SUM(COALESCE(h.total_marks, 100)), 0)) * 100, 
                2
            ) as average_percentage
        FROM homework h
        LEFT JOIN subjects s ON h.subject_id = s.id
        LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = ?
        WHERE h.class_id = ?
    ";
    
    $params = array($studentId, $student['class_id']);
    
    if ($termId) {
        $sql .= " AND h.term_id = ?";
        $params[] = $termId;
    }
    
    $sql .= " GROUP BY s.id, s.subject_name ORDER BY s.subject_name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $subjectSummaries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate overall homework average
    $totalObtained = 0;
    $totalPossible = 0;
    foreach ($subjectSummaries as $subject) {
        $totalObtained += floatval($subject['total_marks_obtained']);
        $totalPossible += floatval($subject['total_possible_marks']);
    }
    
    $overallAverage = $totalPossible > 0 ? round(($totalObtained / $totalPossible) * 100, 2) : 0;

    echo json_encode(array(
        'success' => true,
        'student' => $student,
        'subjects' => $subjectSummaries,
        'overall' => array(
            'total_marks_obtained' => $totalObtained,
            'total_possible_marks' => $totalPossible,
            'average_percentage' => $overallAverage,
            'ca_contribution' => round($overallAverage * 0.3, 2) // 30% of CA
        )
    ));
}

/**
 * Get homework summary for an entire class
 */
function getClassHomeworkSummary($pdo) {
    $classId = isset($_GET['class_id']) ? $_GET['class_id'] : null;
    $termId = isset($_GET['term_id']) ? $_GET['term_id'] : null;
    $subjectId = isset($_GET['subject_id']) ? $_GET['subject_id'] : null;

    if (!$classId) {
        echo json_encode(array('success' => false, 'error' => 'Class ID required'));
        return;
    }

    // Get all students in class with their homework averages
    $sql = "
        SELECT 
            st.id as student_id,
            CONCAT(st.first_name, ' ', st.last_name) as student_name,
            st.student_id as admission_no,
            COUNT(DISTINCT h.id) as total_homework,
            COUNT(DISTINCT hs.id) as submitted_count,
            SUM(CASE WHEN hs.status = 'graded' THEN 1 ELSE 0 END) as graded_count,
            SUM(COALESCE(hs.marks_obtained, hs.score, 0)) as total_marks_obtained,
            SUM(COALESCE(h.total_marks, 100)) as total_possible_marks,
            ROUND(
                (SUM(COALESCE(hs.marks_obtained, hs.score, 0)) / NULLIF(SUM(COALESCE(h.total_marks, 100)), 0)) * 100, 
                2
            ) as homework_average
        FROM students st
        LEFT JOIN homework h ON h.class_id = st.class_id
        LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = st.id
        WHERE st.class_id = ?
    ";
    
    $params = array($classId);
    
    if ($termId) {
        $sql .= " AND (h.term_id = ? OR h.term_id IS NULL)";
        $params[] = $termId;
    }
    
    if ($subjectId) {
        $sql .= " AND h.subject_id = ?";
        $params[] = $subjectId;
    }
    
    $sql .= " GROUP BY st.id, st.first_name, st.last_name, st.student_id ORDER BY st.first_name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Add CA contribution to each student
    foreach ($students as &$student) {
        $student['ca_contribution'] = round(floatval($student['homework_average']) * 0.3, 2);
    }

    echo json_encode(array(
        'success' => true,
        'class_id' => $classId,
        'students' => $students,
        'total_students' => count($students)
    ));
}

/**
 * Calculate CA score from homework for a student/subject/term
 */
function calculateCAScore($pdo) {
    $studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;
    $subjectId = isset($_GET['subject_id']) ? $_GET['subject_id'] : null;
    $termId = isset($_GET['term_id']) ? $_GET['term_id'] : null;

    if (!$studentId || !$subjectId) {
        echo json_encode(array('success' => false, 'error' => 'Student ID and Subject ID required'));
        return;
    }

    // Get student's class
    $stmt = $pdo->prepare("SELECT class_id FROM students WHERE id = ?");
    $stmt->execute(array($studentId));
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(array('success' => false, 'error' => 'Student not found'));
        return;
    }

    // Calculate homework average for this subject
    $sql = "
        SELECT 
            COUNT(h.id) as total_homework,
            COUNT(hs.id) as submitted_count,
            SUM(CASE WHEN hs.status = 'graded' THEN 1 ELSE 0 END) as graded_count,
            SUM(COALESCE(hs.marks_obtained, hs.score, 0)) as total_marks_obtained,
            SUM(COALESCE(h.total_marks, 100)) as total_possible_marks
        FROM homework h
        LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = ?
        WHERE h.class_id = ? AND h.subject_id = ?
    ";
    
    $params = array($studentId, $student['class_id'], $subjectId);
    
    if ($termId) {
        $sql .= " AND h.term_id = ?";
        $params[] = $termId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    $homeworkAverage = 0;
    if ($result && floatval($result['total_possible_marks']) > 0) {
        $homeworkAverage = round(
            (floatval($result['total_marks_obtained']) / floatval($result['total_possible_marks'])) * 100, 
            2
        );
    }

    // CA is 30% of total, homework contributes to CA
    // If CA max is 30 marks, homework average percentage is scaled to 30
    $caScore = round($homeworkAverage * 0.3, 2); // 30% weight

    echo json_encode(array(
        'success' => true,
        'student_id' => $studentId,
        'subject_id' => $subjectId,
        'term_id' => $termId,
        'homework_stats' => $result,
        'homework_average' => $homeworkAverage,
        'ca_score' => $caScore,
        'ca_max' => 30,
        'note' => 'CA score is calculated as 30% of homework average'
    ));
}

/**
 * Get full term report with homework contribution
 */
function getTermReport($pdo) {
    $studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;
    $termId = isset($_GET['term_id']) ? $_GET['term_id'] : null;

    if (!$studentId) {
        echo json_encode(array('success' => false, 'error' => 'Student ID required'));
        return;
    }

    // Get student info
    $stmt = $pdo->prepare("
        SELECT s.*, c.class_name 
        FROM students s 
        LEFT JOIN classes c ON s.class_id = c.id 
        WHERE s.id = ?
    ");
    $stmt->execute(array($studentId));
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(array('success' => false, 'error' => 'Student not found'));
        return;
    }

    // Get all subjects for the class
    $stmt = $pdo->prepare("
        SELECT DISTINCT s.id, s.subject_name
        FROM subjects s
        JOIN homework h ON h.subject_id = s.id
        WHERE h.class_id = ?
        ORDER BY s.subject_name
    ");
    $stmt->execute(array($student['class_id']));
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $report = array();
    $totalCA = 0;
    $totalExam = 0;
    $totalFinal = 0;
    $subjectCount = 0;

    foreach ($subjects as $subject) {
        // Get homework average for this subject
        $sql = "
            SELECT 
                COUNT(h.id) as total_homework,
                COUNT(hs.id) as submitted_count,
                SUM(COALESCE(hs.marks_obtained, hs.score, 0)) as marks_obtained,
                SUM(COALESCE(h.total_marks, 100)) as total_marks
            FROM homework h
            LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = ?
            WHERE h.class_id = ? AND h.subject_id = ?
        ";
        $params = array($studentId, $student['class_id'], $subject['id']);
        
        if ($termId) {
            $sql .= " AND h.term_id = ?";
            $params[] = $termId;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $hwResult = $stmt->fetch(PDO::FETCH_ASSOC);

        $homeworkAverage = 0;
        if ($hwResult && floatval($hwResult['total_marks']) > 0) {
            $homeworkAverage = round(
                (floatval($hwResult['marks_obtained']) / floatval($hwResult['total_marks'])) * 100, 
                2
            );
        }

        // CA Score (30% weight from homework)
        $caScore = round($homeworkAverage * 0.3, 2);

        // Try to get exam score if available
        $examScore = 0;
        try {
            $stmt = $pdo->prepare("
                SELECT er.marks_obtained, es.max_marks
                FROM exam_results er
                JOIN exam_schedules es ON er.exam_schedule_id = es.id
                WHERE er.student_id = ? AND es.subject_id = ?
                ORDER BY es.exam_date DESC LIMIT 1
            ");
            $stmt->execute(array($studentId, $subject['id']));
            $examResult = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($examResult && floatval($examResult['max_marks']) > 0) {
                $examScore = round(
                    (floatval($examResult['marks_obtained']) / floatval($examResult['max_marks'])) * 70, 
                    2
                );
            }
        } catch (Exception $e) {
            // Exam results table might not exist
        }

        $finalScore = $caScore + $examScore;
        $grade = calculateGrade($finalScore);

        $report[] = array(
            'subject_id' => $subject['id'],
            'subject_name' => $subject['subject_name'],
            'homework_count' => intval($hwResult['total_homework']),
            'homework_submitted' => intval($hwResult['submitted_count']),
            'homework_average' => $homeworkAverage,
            'ca_score' => $caScore,
            'ca_max' => 30,
            'exam_score' => $examScore,
            'exam_max' => 70,
            'final_score' => $finalScore,
            'final_max' => 100,
            'grade' => $grade
        );

        $totalCA += $caScore;
        $totalExam += $examScore;
        $totalFinal += $finalScore;
        $subjectCount++;
    }

    $averageCA = $subjectCount > 0 ? round($totalCA / $subjectCount, 2) : 0;
    $averageExam = $subjectCount > 0 ? round($totalExam / $subjectCount, 2) : 0;
    $averageFinal = $subjectCount > 0 ? round($totalFinal / $subjectCount, 2) : 0;

    echo json_encode(array(
        'success' => true,
        'student' => array(
            'id' => $student['id'],
            'name' => $student['first_name'] . ' ' . $student['last_name'],
            'admission_no' => $student['student_id'],
            'class' => $student['class_name']
        ),
        'term_id' => $termId,
        'subjects' => $report,
        'summary' => array(
            'total_subjects' => $subjectCount,
            'average_ca' => $averageCA,
            'average_exam' => $averageExam,
            'average_final' => $averageFinal,
            'overall_grade' => calculateGrade($averageFinal)
        ),
        'grading_note' => 'CA (30%) from homework + Exam (70%) = Final Score'
    ));
}

function calculateGrade($score) {
    if ($score >= 90) return 'A+';
    if ($score >= 80) return 'A';
    if ($score >= 70) return 'B+';
    if ($score >= 60) return 'B';
    if ($score >= 50) return 'C';
    if ($score >= 40) return 'D';
    return 'F';
}

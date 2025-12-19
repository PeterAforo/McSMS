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
        echo json_encode(array(
            'success' => true,
            'grades' => array(),
            'summary' => null,
            'message' => 'Student ID is required'
        ));
        return;
    }

    // Get student info
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, class_id FROM students WHERE id = ?");
    $stmt->execute(array($studentId));
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(array(
            'success' => true,
            'grades' => array(),
            'summary' => null,
            'message' => 'Student not found'
        ));
        return;
    }

    $grades = array();
    
    // Try multiple grade tables in order of preference
    
    // 1. Try exam_results table (most common)
    try {
        $sql = "
            SELECT 
                er.id,
                er.student_id,
                er.marks_obtained as score,
                er.grade,
                er.remarks,
                es.exam_name,
                es.exam_date,
                es.total_marks as max_score,
                'Exam' as assessment_type,
                s.subject_name,
                s.subject_code,
                t.name as term_name,
                ROUND((er.marks_obtained / es.total_marks) * 100, 1) as percentage
            FROM exam_results er
            JOIN exam_schedules es ON er.exam_schedule_id = es.id
            LEFT JOIN subjects s ON es.subject_id = s.id
            LEFT JOIN terms t ON es.term_id = t.id
            WHERE er.student_id = ?
        ";
        
        $params = array($studentId);
        
        if ($termId) {
            $sql .= " AND es.term_id = ?";
            $params[] = $termId;
        }
        
        $sql .= " ORDER BY es.exam_date DESC, s.subject_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        // exam_results table might not exist or have different structure
    }
    
    // 2. Try grades table if no results yet (joins with assessments table)
    if (empty($grades)) {
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
            ";
            
            $params = array($studentId);
            
            if ($termId) {
                $sql .= " AND a.term_id = ?";
                $params[] = $termId;
            }
            
            $sql .= " ORDER BY a.assessment_date DESC, s.subject_name";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // grades table might not exist or have different structure
        }
    }
    
    // 3. Try results table if still no results
    if (empty($grades)) {
        try {
            $sql = "
                SELECT 
                    r.id,
                    r.student_id,
                    r.marks as score,
                    r.grade,
                    r.remarks,
                    r.created_at as exam_date,
                    r.total_marks as max_score,
                    'Result' as assessment_type,
                    s.subject_name,
                    s.subject_code,
                    t.name as term_name,
                    CASE WHEN r.total_marks > 0 THEN ROUND((r.marks / r.total_marks) * 100, 1) ELSE 0 END as percentage
                FROM results r
                LEFT JOIN subjects s ON r.subject_id = s.id
                LEFT JOIN terms t ON r.term_id = t.id
                WHERE r.student_id = ?
            ";
            
            $params = array($studentId);
            
            if ($termId) {
                $sql .= " AND r.term_id = ?";
                $params[] = $termId;
            }
            
            $sql .= " ORDER BY r.created_at DESC, s.subject_name";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // results table might not exist or have different structure
        }
    }
    
    // 4. Try assessment_grades table (newer schema)
    if (empty($grades)) {
        try {
            $sql = "
                SELECT 
                    ag.id,
                    ag.student_id,
                    ag.marks_obtained as score,
                    ag.grade,
                    ag.comment as remarks,
                    a.assessment_name as exam_name,
                    a.assessment_date as exam_date,
                    a.total_marks as max_score,
                    a.assessment_type,
                    s.subject_name,
                    s.subject_code,
                    t.name as term_name,
                    ROUND((ag.marks_obtained / a.total_marks) * 100, 1) as percentage
                FROM assessment_grades ag
                JOIN assessments a ON ag.assessment_id = a.id
                LEFT JOIN subjects s ON a.subject_id = s.id
                LEFT JOIN terms t ON a.term_id = t.id
                WHERE ag.student_id = ?
            ";
            
            $params = array($studentId);
            
            if ($termId) {
                $sql .= " AND a.term_id = ?";
                $params[] = $termId;
            }
            
            $sql .= " ORDER BY a.assessment_date DESC, s.subject_name";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // assessment_grades table might not exist
        }
    }

    // Also get graded homework submissions
    try {
        $hwSql = "
            SELECT 
                hs.id,
                hs.student_id,
                hs.marks_obtained as score,
                hs.grade,
                hs.feedback as remarks,
                h.title as exam_name,
                h.due_date as exam_date,
                h.total_marks as max_score,
                'Homework' as assessment_type,
                s.subject_name,
                s.subject_code,
                t.name as term_name,
                ROUND((hs.marks_obtained / h.total_marks) * 100, 1) as percentage
            FROM homework_submissions hs
            JOIN homework h ON hs.homework_id = h.id
            LEFT JOIN subjects s ON h.subject_id = s.id
            LEFT JOIN terms t ON h.term_id = t.id
            WHERE hs.student_id = ? AND hs.status = 'graded' AND hs.marks_obtained IS NOT NULL
        ";
        
        $hwParams = array($studentId);
        
        if ($termId) {
            $hwSql .= " AND h.term_id = ?";
            $hwParams[] = $termId;
        }
        
        $hwSql .= " ORDER BY h.due_date DESC";
        
        $stmt = $pdo->prepare($hwSql);
        $stmt->execute($hwParams);
        $hwGrades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Merge homework grades with assessment grades
        $grades = array_merge($grades, $hwGrades);
    } catch (Exception $e) {
        // homework tables might not exist, continue
    }

    // Group grades by subject for summary
    $subjectGrades = array();
    foreach ($grades as $grade) {
        $subjectName = isset($grade['subject_name']) ? $grade['subject_name'] : 'General';
        if (!isset($subjectGrades[$subjectName])) {
            $subjectGrades[$subjectName] = array(
                'subject_name' => $subjectName,
                'subject_code' => isset($grade['subject_code']) ? $grade['subject_code'] : '',
                'total_score' => 0,
                'total_max' => 0,
                'count' => 0,
                'assessments' => array()
            );
        }
        $subjectGrades[$subjectName]['total_score'] += floatval($grade['score']);
        $subjectGrades[$subjectName]['total_max'] += floatval($grade['max_score']);
        $subjectGrades[$subjectName]['count']++;
        $subjectGrades[$subjectName]['assessments'][] = $grade;
    }

    // Calculate subject averages
    $subjectResults = array();
    foreach ($subjectGrades as $subject => $data) {
        $percentage = $data['total_max'] > 0 ? round(($data['total_score'] / $data['total_max']) * 100, 1) : 0;
        $percentage = min($percentage, 100); // Cap at 100%
        
        // Calculate grade
        $grade = 'F';
        if ($percentage >= 90) $grade = 'A+';
        else if ($percentage >= 80) $grade = 'A';
        else if ($percentage >= 70) $grade = 'B';
        else if ($percentage >= 60) $grade = 'C';
        else if ($percentage >= 50) $grade = 'D';
        
        $subjectResults[] = array(
            'subject_name' => $data['subject_name'],
            'subject_code' => $data['subject_code'],
            'total' => $percentage,
            'grade' => $grade,
            'score' => $data['total_score'],
            'max_score' => $data['total_max'],
            'assessment_count' => $data['count'],
            'assessments' => $data['assessments']
        );
    }

    // Calculate overall summary
    $summary = null;
    if (count($grades) > 0) {
        $totalScore = 0;
        $totalMax = 0;
        foreach ($grades as $grade) {
            $totalScore += floatval($grade['score']);
            $totalMax += floatval($grade['max_score']);
        }
        $avgPercentage = $totalMax > 0 ? min(round(($totalScore / $totalMax) * 100, 2), 100) : 0;
        
        $summary = array(
            'total_subjects' => count($subjectResults),
            'average_score' => $avgPercentage,
            'total_marks' => $totalScore,
            'max_marks' => $totalMax
        );
    }

    echo json_encode(array(
        'success' => true,
        'grades' => $subjectResults,
        'all_assessments' => $grades,
        'summary' => $summary,
        'student' => $student
    ));
}

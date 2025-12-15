<?php
/**
 * Grading Management API
 * Handles all grading and assessment operations
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

require_once __DIR__ . '/../../config/database.php';

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
            if ($action === 'report_card') {
                getReportCard($pdo);
            } elseif ($action === 'class_grades') {
                getClassGrades($pdo);
            } elseif ($action === 'student_grades') {
                getStudentGrades($pdo);
            } elseif ($action === 'stats') {
                getAssessmentStats($pdo);
            } elseif ($action === 'grade_sheet') {
                getGradeSheet($pdo);
            } elseif ($action === 'rankings') {
                getClassRankings($pdo);
            } elseif ($action === 'student_report') {
                getStudentReport($pdo);
            } else {
                getGrades($pdo);
            }
            break;

        case 'POST':
            if ($action === 'bulk') {
                bulkGradeEntry($pdo);
            } else {
                createGrade($pdo);
            }
            break;

        case 'PUT':
            updateGrade($pdo);
            break;

        case 'DELETE':
            deleteGrade($pdo);
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

function getGrades($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $subjectId = $_GET['subject_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;
    $studentId = $_GET['student_id'] ?? null;
    $examId = $_GET['exam_id'] ?? null;

    $sql = "
        SELECT 
            g.*,
            s.first_name,
            s.last_name,
            s.student_id as student_number,
            sub.name as subject_name,
            sub.code as subject_code,
            c.name as class_name,
            e.exam_name,
            e.exam_type,
            t.term_name,
            u.name as graded_by_name
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        LEFT JOIN subjects sub ON g.subject_id = sub.id
        LEFT JOIN classes c ON g.class_id = c.id
        LEFT JOIN exams e ON g.exam_id = e.id
        LEFT JOIN terms t ON g.term_id = t.id
        LEFT JOIN users u ON g.graded_by = u.id
        WHERE 1=1
    ";

    $params = [];

    if ($classId) {
        $sql .= " AND g.class_id = ?";
        $params[] = $classId;
    }

    if ($subjectId) {
        $sql .= " AND g.subject_id = ?";
        $params[] = $subjectId;
    }

    if ($termId) {
        $sql .= " AND g.term_id = ?";
        $params[] = $termId;
    }

    if ($studentId) {
        $sql .= " AND g.student_id = ?";
        $params[] = $studentId;
    }

    if ($examId) {
        $sql .= " AND g.exam_id = ?";
        $params[] = $examId;
    }

    $sql .= " ORDER BY s.first_name, sub.name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate letter grades and remarks
    foreach ($grades as &$grade) {
        $grade['letter_grade'] = calculateLetterGrade($grade['score']);
        $grade['remark'] = calculateRemark($grade['score']);
    }

    echo json_encode([
        'success' => true,
        'grades' => $grades
    ]);
}

function getClassGrades($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $subjectId = $_GET['subject_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;
    $examId = $_GET['exam_id'] ?? null;

    if (!$classId) {
        throw new Exception('Class ID is required');
    }

    // Get all students in the class
    $studentsSql = "
        SELECT id, first_name, last_name, student_id
        FROM students
        WHERE class_id = ? AND status = 'active'
        ORDER BY first_name, last_name
    ";
    $studentsStmt = $pdo->prepare($studentsSql);
    $studentsStmt->execute([$classId]);
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get grades for each student
    foreach ($students as &$student) {
        $gradesSql = "
            SELECT 
                g.*,
                sub.name as subject_name,
                sub.code as subject_code,
                e.exam_name,
                e.max_score
            FROM grades g
            LEFT JOIN subjects sub ON g.subject_id = sub.id
            LEFT JOIN exams e ON g.exam_id = e.id
            WHERE g.student_id = ? AND g.class_id = ?
        ";

        $params = [$student['id'], $classId];

        if ($subjectId) {
            $gradesSql .= " AND g.subject_id = ?";
            $params[] = $subjectId;
        }

        if ($termId) {
            $gradesSql .= " AND g.term_id = ?";
            $params[] = $termId;
        }

        if ($examId) {
            $gradesSql .= " AND g.exam_id = ?";
            $params[] = $examId;
        }

        $gradesStmt = $pdo->prepare($gradesSql);
        $gradesStmt->execute($params);
        $grades = $gradesStmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate letter grades
        foreach ($grades as &$grade) {
            $grade['letter_grade'] = calculateLetterGrade($grade['score']);
            $grade['remark'] = calculateRemark($grade['score']);
        }

        $student['grades'] = $grades;
        
        // Calculate average
        if (!empty($grades)) {
            $totalScore = array_sum(array_column($grades, 'score'));
            $student['average'] = round($totalScore / count($grades), 2);
            $student['letter_grade'] = calculateLetterGrade($student['average']);
        } else {
            $student['average'] = 0;
            $student['letter_grade'] = 'N/A';
        }
    }

    echo json_encode([
        'success' => true,
        'students' => $students
    ]);
}

function getStudentGrades($pdo) {
    $studentId = $_GET['student_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;

    if (!$studentId) {
        throw new Exception('Student ID is required');
    }

    $sql = "
        SELECT 
            g.*,
            sub.name as subject_name,
            sub.code as subject_code,
            c.name as class_name,
            e.exam_name,
            e.exam_type,
            e.max_score,
            t.term_name
        FROM grades g
        LEFT JOIN subjects sub ON g.subject_id = sub.id
        LEFT JOIN classes c ON g.class_id = c.id
        LEFT JOIN exams e ON g.exam_id = e.id
        LEFT JOIN terms t ON g.term_id = t.id
        WHERE g.student_id = ?
    ";

    $params = [$studentId];

    if ($termId) {
        $sql .= " AND g.term_id = ?";
        $params[] = $termId;
    }

    $sql .= " ORDER BY t.start_date DESC, sub.name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate letter grades and stats
    foreach ($grades as &$grade) {
        $grade['letter_grade'] = calculateLetterGrade($grade['score']);
        $grade['remark'] = calculateRemark($grade['score']);
    }

    // Calculate overall statistics
    $stats = [
        'total_subjects' => count($grades),
        'average_score' => 0,
        'highest_score' => 0,
        'lowest_score' => 0,
        'letter_grade' => 'N/A'
    ];

    if (!empty($grades)) {
        $scores = array_column($grades, 'score');
        $stats['average_score'] = round(array_sum($scores) / count($scores), 2);
        $stats['highest_score'] = max($scores);
        $stats['lowest_score'] = min($scores);
        $stats['letter_grade'] = calculateLetterGrade($stats['average_score']);
    }

    echo json_encode([
        'success' => true,
        'grades' => $grades,
        'stats' => $stats
    ]);
}

function getReportCard($pdo) {
    $studentId = $_GET['student_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;

    if (!$studentId || !$termId) {
        throw new Exception('Student ID and Term ID are required');
    }

    // Get student info
    $studentSql = "
        SELECT 
            s.*,
            c.name as class_name,
            p.name as parent_name,
            p.email as parent_email
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN users p ON s.parent_id = p.id
        WHERE s.id = ?
    ";
    $studentStmt = $pdo->prepare($studentSql);
    $studentStmt->execute([$studentId]);
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        throw new Exception('Student not found');
    }

    // Get term info
    $termSql = "SELECT * FROM terms WHERE id = ?";
    $termStmt = $pdo->prepare($termSql);
    $termStmt->execute([$termId]);
    $term = $termStmt->fetch(PDO::FETCH_ASSOC);

    // Get all grades for the term
    $gradesSql = "
        SELECT 
            g.*,
            sub.name as subject_name,
            sub.code as subject_code,
            e.exam_name,
            e.exam_type,
            e.max_score
        FROM grades g
        LEFT JOIN subjects sub ON g.subject_id = sub.id
        LEFT JOIN exams e ON g.exam_id = e.id
        WHERE g.student_id = ? AND g.term_id = ?
        ORDER BY sub.name
    ";
    $gradesStmt = $pdo->prepare($gradesSql);
    $gradesStmt->execute([$studentId, $termId]);
    $grades = $gradesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate letter grades and remarks
    foreach ($grades as &$grade) {
        $grade['letter_grade'] = calculateLetterGrade($grade['score']);
        $grade['remark'] = calculateRemark($grade['score']);
    }

    // Calculate overall performance
    $totalScore = 0;
    $subjectCount = 0;
    $subjectGrades = [];

    foreach ($grades as $grade) {
        if (!isset($subjectGrades[$grade['subject_id']])) {
            $subjectGrades[$grade['subject_id']] = [
                'subject_name' => $grade['subject_name'],
                'subject_code' => $grade['subject_code'],
                'scores' => []
            ];
        }
        $subjectGrades[$grade['subject_id']]['scores'][] = $grade['score'];
    }

    // Calculate average per subject
    $reportGrades = [];
    foreach ($subjectGrades as $subjectId => $data) {
        $avgScore = array_sum($data['scores']) / count($data['scores']);
        $reportGrades[] = [
            'subject_name' => $data['subject_name'],
            'subject_code' => $data['subject_code'],
            'score' => round($avgScore, 2),
            'letter_grade' => calculateLetterGrade($avgScore),
            'remark' => calculateRemark($avgScore)
        ];
        $totalScore += $avgScore;
        $subjectCount++;
    }

    $overallAverage = $subjectCount > 0 ? round($totalScore / $subjectCount, 2) : 0;

    // Get attendance
    $attendanceSql = "
        SELECT 
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days
        FROM attendance
        WHERE student_id = ? AND term_id = ?
    ";
    $attendanceStmt = $pdo->prepare($attendanceSql);
    $attendanceStmt->execute([$studentId, $termId]);
    $attendance = $attendanceStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'report_card' => [
            'student' => $student,
            'term' => $term,
            'grades' => $reportGrades,
            'overall_average' => $overallAverage,
            'overall_grade' => calculateLetterGrade($overallAverage),
            'overall_remark' => calculateRemark($overallAverage),
            'attendance' => $attendance,
            'generated_date' => date('Y-m-d H:i:s')
        ]
    ]);
}

function getGradeSheet($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $subjectId = $_GET['subject_id'] ?? null;
    $examId = $_GET['exam_id'] ?? null;

    if (!$classId || !$subjectId || !$examId) {
        throw new Exception('Class ID, Subject ID, and Exam ID are required');
    }

    // Get all students in the class
    $studentsSql = "
        SELECT id, first_name, last_name, student_id
        FROM students
        WHERE class_id = ? AND status = 'active'
        ORDER BY first_name, last_name
    ";
    $studentsStmt = $pdo->prepare($studentsSql);
    $studentsStmt->execute([$classId]);
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get exam info
    $examSql = "SELECT * FROM exams WHERE id = ?";
    $examStmt = $pdo->prepare($examSql);
    $examStmt->execute([$examId]);
    $exam = $examStmt->fetch(PDO::FETCH_ASSOC);

    // Get grades for each student
    foreach ($students as &$student) {
        $gradeSql = "
            SELECT * FROM grades
            WHERE student_id = ? AND subject_id = ? AND exam_id = ?
        ";
        $gradeStmt = $pdo->prepare($gradeSql);
        $gradeStmt->execute([$student['id'], $subjectId, $examId]);
        $grade = $gradeStmt->fetch(PDO::FETCH_ASSOC);

        $student['grade'] = $grade ?: null;
        $student['score'] = $grade ? $grade['score'] : null;
        $student['letter_grade'] = $grade ? calculateLetterGrade($grade['score']) : 'N/A';
    }

    echo json_encode([
        'success' => true,
        'exam' => $exam,
        'students' => $students
    ]);
}

function getGradingStats($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;

    $sql = "
        SELECT 
            COUNT(*) as total_grades,
            AVG(score) as average_score,
            MAX(score) as highest_score,
            MIN(score) as lowest_score,
            SUM(CASE WHEN score >= 80 THEN 1 ELSE 0 END) as a_grades,
            SUM(CASE WHEN score >= 70 AND score < 80 THEN 1 ELSE 0 END) as b_grades,
            SUM(CASE WHEN score >= 60 AND score < 70 THEN 1 ELSE 0 END) as c_grades,
            SUM(CASE WHEN score >= 50 AND score < 60 THEN 1 ELSE 0 END) as d_grades,
            SUM(CASE WHEN score < 50 THEN 1 ELSE 0 END) as f_grades
        FROM grades
        WHERE 1=1
    ";

    $params = [];

    if ($classId) {
        $sql .= " AND class_id = ?";
        $params[] = $classId;
    }

    if ($termId) {
        $sql .= " AND term_id = ?";
        $params[] = $termId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
}

function createGrade($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['student_id', 'class_id', 'subject_id', 'exam_id', 'score'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("$field is required");
        }
    }

    // Check if grade already exists
    $checkSql = "
        SELECT id FROM grades 
        WHERE student_id = ? AND subject_id = ? AND exam_id = ?
    ";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$data['student_id'], $data['subject_id'], $data['exam_id']]);
    
    if ($checkStmt->fetch()) {
        throw new Exception('Grade already exists for this student, subject, and exam');
    }

    $sql = "
        INSERT INTO grades (
            student_id, class_id, subject_id, exam_id, term_id,
            score, remarks, graded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['student_id'],
        $data['class_id'],
        $data['subject_id'],
        $data['exam_id'],
        $data['term_id'] ?? null,
        $data['score'],
        $data['remarks'] ?? null,
        $data['graded_by'] ?? null
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Grade added successfully',
        'id' => $pdo->lastInsertId(),
        'letter_grade' => calculateLetterGrade($data['score'])
    ]);
}

function bulkGradeEntry($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['grades']) || !is_array($data['grades'])) {
        throw new Exception('Grades array is required');
    }

    $pdo->beginTransaction();

    try {
        $added = 0;
        foreach ($data['grades'] as $grade) {
            $sql = "
                INSERT INTO grades (
                    student_id, class_id, subject_id, exam_id, term_id,
                    score, remarks, graded_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    score = VALUES(score),
                    remarks = VALUES(remarks),
                    graded_by = VALUES(graded_by)
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $grade['student_id'],
                $grade['class_id'],
                $grade['subject_id'],
                $grade['exam_id'],
                $grade['term_id'] ?? null,
                $grade['score'],
                $grade['remarks'] ?? null,
                $grade['graded_by'] ?? null
            ]);

            $added++;
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => "Grades entered for $added students",
            'count' => $added
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function updateGrade($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'] ?? $data['id'] ?? null;

    if (!$id) {
        throw new Exception('Grade ID is required');
    }

    $fields = [];
    $params = [];

    $allowedFields = ['score', 'remarks', 'graded_by'];
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
    $sql = "UPDATE grades SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'message' => 'Grade updated successfully'
    ]);
}

function deleteGrade($pdo) {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        throw new Exception('Grade ID is required');
    }

    $stmt = $pdo->prepare("DELETE FROM grades WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode([
        'success' => true,
        'message' => 'Grade deleted successfully'
    ]);
}

function getAssessmentStats($pdo) {
    $assessmentId = $_GET['assessment_id'] ?? null;
    
    if (!$assessmentId) {
        echo json_encode(['success' => true, 'stats' => null]);
        return;
    }
    
    // Get assessment info for total students
    $assessmentSql = "SELECT a.*, c.class_name FROM assessments a LEFT JOIN classes c ON a.class_id = c.id WHERE a.id = ?";
    $assessmentStmt = $pdo->prepare($assessmentSql);
    $assessmentStmt->execute([$assessmentId]);
    $assessment = $assessmentStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$assessment) {
        echo json_encode(['success' => true, 'stats' => null]);
        return;
    }
    
    // Count total students in class
    $totalSql = "SELECT COUNT(*) as total FROM students WHERE class_id = ? AND status = 'active'";
    $totalStmt = $pdo->prepare($totalSql);
    $totalStmt->execute([$assessment['class_id']]);
    $totalResult = $totalStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get grade statistics
    $sql = "
        SELECT 
            COUNT(*) as graded,
            AVG(marks_obtained) as average,
            MAX(marks_obtained) as highest,
            MIN(marks_obtained) as lowest
        FROM grades
        WHERE assessment_id = ? AND marks_obtained IS NOT NULL
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$assessmentId]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['total'] = $totalResult['total'];
    
    // Get grade distribution
    $distSql = "
        SELECT grade, COUNT(*) as count
        FROM grades
        WHERE assessment_id = ? AND grade IS NOT NULL AND grade != ''
        GROUP BY grade
        ORDER BY grade
    ";
    $distStmt = $pdo->prepare($distSql);
    $distStmt->execute([$assessmentId]);
    $distribution = [];
    while ($row = $distStmt->fetch(PDO::FETCH_ASSOC)) {
        $distribution[$row['grade']] = (int)$row['count'];
    }
    
    $stats['distribution'] = $distribution;
    
    echo json_encode(['success' => true, 'stats' => $stats]);
}

function getClassRankings($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;
    
    if (!$classId) {
        echo json_encode(['success' => true, 'rankings' => []]);
        return;
    }
    
    // Get students in class with their grades
    $sql = "
        SELECT 
            s.id,
            s.first_name,
            s.last_name,
            s.student_id,
            COUNT(g.id) as total_assessments,
            AVG((g.marks_obtained / a.total_marks) * 100) as average
        FROM students s
        LEFT JOIN grades g ON s.id = g.student_id
        LEFT JOIN assessments a ON g.assessment_id = a.id
        WHERE s.class_id = ? AND s.status = 'active'
    ";
    
    $params = [$classId];
    
    if ($termId) {
        $sql .= " AND (a.term_id = ? OR a.term_id IS NULL)";
        $params[] = $termId;
    }
    
    $sql .= " GROUP BY s.id ORDER BY average DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rankings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate GPA for each student
    foreach ($rankings as &$student) {
        $student['average'] = $student['average'] ? round($student['average'], 1) : 0;
        $student['gpa'] = calculateGPA($student['average']);
    }
    
    echo json_encode(['success' => true, 'rankings' => $rankings]);
}

function getStudentReport($pdo) {
    $studentId = $_GET['student_id'] ?? null;
    $classId = $_GET['class_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;
    
    if (!$studentId) {
        echo json_encode(['success' => true, 'report' => null, 'student' => null]);
        return;
    }
    
    // Get student info
    $studentSql = "SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = ?";
    $studentStmt = $pdo->prepare($studentSql);
    $studentStmt->execute([$studentId]);
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get grades
    $sql = "
        SELECT 
            g.id,
            g.marks_obtained,
            g.grade,
            g.remarks,
            a.assessment_name,
            a.total_marks,
            a.assessment_type,
            sub.subject_name
        FROM grades g
        JOIN assessments a ON g.assessment_id = a.id
        JOIN subjects sub ON a.subject_id = sub.id
        WHERE g.student_id = ?
    ";
    
    $params = [$studentId];
    
    if ($classId) {
        $sql .= " AND a.class_id = ?";
        $params[] = $classId;
    }
    
    if ($termId) {
        $sql .= " AND a.term_id = ?";
        $params[] = $termId;
    }
    
    $sql .= " ORDER BY sub.subject_name, a.assessment_date";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate statistics
    $totalPercent = 0;
    $count = 0;
    foreach ($grades as $g) {
        if ($g['marks_obtained'] && $g['total_marks']) {
            $totalPercent += ($g['marks_obtained'] / $g['total_marks']) * 100;
            $count++;
        }
    }
    
    $average = $count > 0 ? $totalPercent / $count : 0;
    $gpa = calculateGPA($average);
    
    // Get rank
    $rank = 1;
    if ($classId) {
        $rankSql = "
            SELECT COUNT(*) + 1 as rank
            FROM (
                SELECT s.id, AVG((g.marks_obtained / a.total_marks) * 100) as avg
                FROM students s
                JOIN grades g ON s.id = g.student_id
                JOIN assessments a ON g.assessment_id = a.id
                WHERE s.class_id = ? AND s.status = 'active'
                " . ($termId ? "AND a.term_id = ?" : "") . "
                GROUP BY s.id
                HAVING avg > ?
            ) ranked
        ";
        $rankParams = [$classId];
        if ($termId) $rankParams[] = $termId;
        $rankParams[] = $average;
        
        $rankStmt = $pdo->prepare($rankSql);
        $rankStmt->execute($rankParams);
        $rankResult = $rankStmt->fetch(PDO::FETCH_ASSOC);
        $rank = $rankResult['rank'] ?? 1;
    }
    
    echo json_encode([
        'success' => true,
        'student' => $student,
        'report' => [
            'grades' => $grades,
            'average' => round($average, 1),
            'gpa' => $gpa,
            'rank' => $rank
        ]
    ]);
}

// Helper functions
function calculateLetterGrade($score) {
    if ($score >= 90) return 'A+';
    if ($score >= 80) return 'A';
    if ($score >= 75) return 'B+';
    if ($score >= 70) return 'B';
    if ($score >= 65) return 'C+';
    if ($score >= 60) return 'C';
    if ($score >= 50) return 'D';
    return 'F';
}

function calculateRemark($score) {
    if ($score >= 80) return 'Excellent';
    if ($score >= 70) return 'Very Good';
    if ($score >= 60) return 'Good';
    if ($score >= 50) return 'Pass';
    return 'Fail';
}

function calculateGPA($percentage) {
    if ($percentage >= 90) return 4.0;
    if ($percentage >= 80) return 3.7;
    if ($percentage >= 75) return 3.3;
    if ($percentage >= 70) return 3.0;
    if ($percentage >= 65) return 2.7;
    if ($percentage >= 60) return 2.3;
    if ($percentage >= 50) return 1.0;
    return 0.0;
}
?>

<?php
/**
 * Exam Management API
 * Complete exam scheduling, seating, results management
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
    $resource = $_GET['resource'] ?? '';
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;

    // ============================================
    // EXAMS
    // ============================================
    if ($resource === 'exams') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("
                        SELECT e.*, et.exam_type_name, at.term_name, u.name as created_by_name,
                        (SELECT COUNT(*) FROM exam_schedules WHERE exam_id = e.id) as schedule_count
                        FROM exams e
                        LEFT JOIN exam_types et ON e.exam_type_id = et.id
                        LEFT JOIN academic_terms at ON e.term_id = at.id
                        LEFT JOIN users u ON e.created_by = u.id
                        WHERE e.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'exam' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } else {
                    $where = [];
                    $params = [];
                    
                    if (!empty($_GET['term_id'])) {
                        $where[] = "e.term_id = ?";
                        $params[] = $_GET['term_id'];
                    }
                    if (!empty($_GET['status'])) {
                        $where[] = "e.status = ?";
                        $params[] = $_GET['status'];
                    }
                    
                    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
                    
                    $stmt = $pdo->prepare("
                        SELECT e.*, et.exam_type_name, at.term_name,
                        (SELECT COUNT(*) FROM exam_schedules WHERE exam_id = e.id) as schedule_count
                        FROM exams e
                        LEFT JOIN exam_types et ON e.exam_type_id = et.id
                        LEFT JOIN academic_terms at ON e.term_id = at.id
                        $whereClause
                        ORDER BY e.start_date DESC
                    ");
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'exams' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO exams (exam_name, exam_type_id, academic_year, term_id, start_date, end_date, status, instructions, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['exam_name'],
                    $data['exam_type_id'] ?? null,
                    $data['academic_year'] ?? date('Y'),
                    $data['term_id'] ?? null,
                    $data['start_date'],
                    $data['end_date'],
                    $data['status'] ?? 'scheduled',
                    $data['instructions'] ?? null,
                    $data['created_by'] ?? 1
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE exams 
                    SET exam_name = ?, exam_type_id = ?, academic_year = ?, term_id = ?, 
                        start_date = ?, end_date = ?, status = ?, instructions = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['exam_name'],
                    $data['exam_type_id'] ?? null,
                    $data['academic_year'] ?? date('Y'),
                    $data['term_id'] ?? null,
                    $data['start_date'],
                    $data['end_date'],
                    $data['status'] ?? 'scheduled',
                    $data['instructions'] ?? null,
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM exams WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // EXAM SCHEDULES
    // ============================================
    elseif ($resource === 'schedules') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_exam') {
                    $examId = $_GET['exam_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            es.*,
                            c.class_name,
                            s.subject_name,
                            r.room_number,
                            r.room_name,
                            (SELECT COUNT(*) FROM exam_seating WHERE exam_schedule_id = es.id) as students_count
                        FROM exam_schedules es
                        JOIN classes c ON es.class_id = c.id
                        JOIN subjects s ON es.subject_id = s.id
                        LEFT JOIN rooms r ON es.room_id = r.id
                        WHERE es.exam_id = ?
                        ORDER BY es.exam_date, es.start_time
                    ");
                    $stmt->execute([$examId]);
                    echo json_encode(['success' => true, 'schedules' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_date') {
                    $date = $_GET['date'] ?? date('Y-m-d');
                    $stmt = $pdo->prepare("
                        SELECT 
                            es.*,
                            e.exam_name,
                            c.class_name,
                            s.subject_name,
                            r.room_number
                        FROM exam_schedules es
                        JOIN exams e ON es.exam_id = e.id
                        JOIN classes c ON es.class_id = c.id
                        JOIN subjects s ON es.subject_id = s.id
                        LEFT JOIN rooms r ON es.room_id = r.id
                        WHERE es.exam_date = ?
                        ORDER BY es.start_time
                    ");
                    $stmt->execute([$date]);
                    echo json_encode(['success' => true, 'schedules' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            es.*,
                            e.exam_name,
                            c.class_name,
                            s.subject_name,
                            r.room_number,
                            r.room_name
                        FROM exam_schedules es
                        JOIN exams e ON es.exam_id = e.id
                        JOIN classes c ON es.class_id = c.id
                        JOIN subjects s ON es.subject_id = s.id
                        LEFT JOIN rooms r ON es.room_id = r.id
                        WHERE es.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'schedule' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO exam_schedules 
                    (exam_id, class_id, subject_id, exam_date, start_time, end_time, duration_minutes, room_id, max_marks, pass_marks, instructions, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['exam_id'],
                    $data['class_id'],
                    $data['subject_id'],
                    $data['exam_date'],
                    $data['start_time'],
                    $data['end_time'],
                    $data['duration_minutes'],
                    $data['room_id'] ?? null,
                    $data['max_marks'] ?? 100,
                    $data['pass_marks'] ?? 40,
                    $data['instructions'] ?? null,
                    $data['status'] ?? 'scheduled'
                ]);
                
                $scheduleId = $pdo->lastInsertId();
                
                // Auto-generate seating if requested
                if (!empty($data['auto_generate_seating'])) {
                    generateSeating($pdo, $scheduleId, $data['class_id'], $data['room_id']);
                }
                
                echo json_encode(['success' => true, 'id' => $scheduleId]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE exam_schedules 
                    SET class_id = ?, subject_id = ?, exam_date = ?, start_time = ?, end_time = ?, 
                        duration_minutes = ?, room_id = ?, max_marks = ?, pass_marks = ?, instructions = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['class_id'],
                    $data['subject_id'],
                    $data['exam_date'],
                    $data['start_time'],
                    $data['end_time'],
                    $data['duration_minutes'],
                    $data['room_id'] ?? null,
                    $data['max_marks'] ?? 100,
                    $data['pass_marks'] ?? 40,
                    $data['instructions'] ?? null,
                    $data['status'] ?? 'scheduled',
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM exam_schedules WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // SEATING ARRANGEMENTS
    // ============================================
    elseif ($resource === 'seating') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_schedule') {
                    $scheduleId = $_GET['schedule_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            es.*,
                            CONCAT(s.first_name, ' ', s.last_name) as student_name,
                            s.student_id as student_number,
                            r.room_number
                        FROM exam_seating es
                        JOIN students s ON es.student_id = s.id
                        LEFT JOIN rooms r ON es.room_id = r.id
                        WHERE es.exam_schedule_id = ?
                        ORDER BY es.seat_number
                    ");
                    $stmt->execute([$scheduleId]);
                    echo json_encode(['success' => true, 'seating' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'generate') {
                    $scheduleId = $_GET['schedule_id'] ?? null;
                    $classId = $_GET['class_id'] ?? null;
                    $roomId = $_GET['room_id'] ?? null;
                    
                    generateSeating($pdo, $scheduleId, $classId, $roomId);
                    echo json_encode(['success' => true, 'message' => 'Seating generated successfully']);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO exam_seating (exam_schedule_id, student_id, room_id, seat_number, roll_number, status)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['exam_schedule_id'],
                    $data['student_id'],
                    $data['room_id'],
                    $data['seat_number'] ?? null,
                    $data['roll_number'] ?? null,
                    $data['status'] ?? 'assigned'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'mark_attendance') {
                    $stmt = $pdo->prepare("UPDATE exam_seating SET status = ? WHERE id = ?");
                    $stmt->execute([$data['status'], $id]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE exam_seating 
                        SET room_id = ?, seat_number = ?, roll_number = ?, status = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['room_id'],
                        $data['seat_number'] ?? null,
                        $data['roll_number'] ?? null,
                        $data['status'] ?? 'assigned',
                        $id
                    ]);
                }
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // RESULTS
    // ============================================
    elseif ($resource === 'results') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_schedule') {
                    $scheduleId = $_GET['schedule_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            er.*,
                            CONCAT(s.first_name, ' ', s.last_name) as student_name,
                            s.student_id as student_number
                        FROM exam_results er
                        JOIN students s ON er.student_id = s.id
                        WHERE er.exam_schedule_id = ?
                        ORDER BY er.marks_obtained DESC
                    ");
                    $stmt->execute([$scheduleId]);
                    echo json_encode(['success' => true, 'results' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_student') {
                    $studentId = $_GET['student_id'] ?? null;
                    $examId = $_GET['exam_id'] ?? null;
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            er.*,
                            es.exam_date,
                            s.subject_name,
                            e.exam_name
                        FROM exam_results er
                        JOIN exam_schedules es ON er.exam_schedule_id = es.id
                        JOIN subjects s ON es.subject_id = s.id
                        JOIN exams e ON es.exam_id = e.id
                        WHERE er.student_id = ? AND es.exam_id = ?
                        ORDER BY es.exam_date
                    ");
                    $stmt->execute([$studentId, $examId]);
                    echo json_encode(['success' => true, 'results' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Calculate percentage and grade
                $percentage = ($data['marks_obtained'] / $data['max_marks']) * 100;
                $grade = calculateGrade($pdo, $percentage);
                
                $stmt = $pdo->prepare("
                    INSERT INTO exam_results 
                    (exam_schedule_id, student_id, marks_obtained, max_marks, percentage, grade, remarks, status, entered_by, entry_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE 
                    marks_obtained = VALUES(marks_obtained),
                    percentage = VALUES(percentage),
                    grade = VALUES(grade),
                    remarks = VALUES(remarks),
                    status = VALUES(status),
                    entered_by = VALUES(entered_by),
                    entry_date = NOW()
                ");
                $stmt->execute([
                    $data['exam_schedule_id'],
                    $data['student_id'],
                    $data['marks_obtained'],
                    $data['max_marks'] ?? 100,
                    $percentage,
                    $grade,
                    $data['remarks'] ?? null,
                    $data['status'] ?? 'submitted',
                    $data['entered_by'] ?? 1
                ]);
                
                // Update statistics
                updateExamStatistics($pdo, $data['exam_schedule_id']);
                
                echo json_encode(['success' => true, 'percentage' => $percentage, 'grade' => $grade]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'publish') {
                    $scheduleId = $_GET['schedule_id'] ?? null;
                    $stmt = $pdo->prepare("UPDATE exam_results SET status = 'published' WHERE exam_schedule_id = ?");
                    $stmt->execute([$scheduleId]);
                    echo json_encode(['success' => true, 'message' => 'Results published']);
                } else {
                    $percentage = ($data['marks_obtained'] / $data['max_marks']) * 100;
                    $grade = calculateGrade($pdo, $percentage);
                    
                    $stmt = $pdo->prepare("
                        UPDATE exam_results 
                        SET marks_obtained = ?, max_marks = ?, percentage = ?, grade = ?, remarks = ?, status = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['marks_obtained'],
                        $data['max_marks'] ?? 100,
                        $percentage,
                        $grade,
                        $data['remarks'] ?? null,
                        $data['status'] ?? 'submitted',
                        $id
                    ]);
                    
                    updateExamStatistics($pdo, $data['exam_schedule_id']);
                    echo json_encode(['success' => true]);
                }
                break;
        }
    }

    // ============================================
    // STATISTICS
    // ============================================
    elseif ($resource === 'statistics') {
        if ($method === 'GET') {
            $scheduleId = $_GET['schedule_id'] ?? null;
            
            $stmt = $pdo->prepare("SELECT * FROM exam_statistics WHERE exam_schedule_id = ?");
            $stmt->execute([$scheduleId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$stats) {
                updateExamStatistics($pdo, $scheduleId);
                $stmt->execute([$scheduleId]);
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            }
            
            echo json_encode(['success' => true, 'statistics' => $stats]);
        }
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateSeating($pdo, $scheduleId, $classId, $roomId) {
    // Get all students in the class
    $stmt = $pdo->prepare("SELECT id FROM students WHERE class_id = ? AND status = 'active' ORDER BY student_id");
    $stmt->execute([$classId]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Clear existing seating
    $stmt = $pdo->prepare("DELETE FROM exam_seating WHERE exam_schedule_id = ?");
    $stmt->execute([$scheduleId]);
    
    // Generate seating
    $seatNumber = 1;
    $stmt = $pdo->prepare("
        INSERT INTO exam_seating (exam_schedule_id, student_id, room_id, seat_number, status)
        VALUES (?, ?, ?, ?, 'assigned')
    ");
    
    foreach ($students as $student) {
        $stmt->execute([$scheduleId, $student['id'], $roomId, $seatNumber]);
        $seatNumber++;
    }
}

function calculateGrade($pdo, $percentage) {
    $stmt = $pdo->prepare("
        SELECT grade FROM grade_scales 
        WHERE ? BETWEEN min_percentage AND max_percentage 
        AND status = 'active'
        LIMIT 1
    ");
    $stmt->execute([$percentage]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result ? $result['grade'] : 'N/A';
}

function updateExamStatistics($pdo, $scheduleId) {
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_students,
            COUNT(CASE WHEN marks_obtained IS NOT NULL THEN 1 END) as present_students,
            MAX(marks_obtained) as highest_marks,
            MIN(marks_obtained) as lowest_marks,
            AVG(marks_obtained) as average_marks,
            COUNT(CASE WHEN percentage >= (SELECT pass_marks FROM exam_schedules WHERE id = ?) THEN 1 END) as pass_count,
            COUNT(CASE WHEN percentage < (SELECT pass_marks FROM exam_schedules WHERE id = ?) THEN 1 END) as fail_count
        FROM exam_results
        WHERE exam_schedule_id = ?
    ");
    $stmt->execute([$scheduleId, $scheduleId, $scheduleId]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $passPercentage = $stats['present_students'] > 0 
        ? ($stats['pass_count'] / $stats['present_students']) * 100 
        : 0;
    
    $stmt = $pdo->prepare("
        INSERT INTO exam_statistics 
        (exam_schedule_id, total_students, present_students, absent_students, highest_marks, lowest_marks, average_marks, pass_count, fail_count, pass_percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        total_students = VALUES(total_students),
        present_students = VALUES(present_students),
        absent_students = VALUES(absent_students),
        highest_marks = VALUES(highest_marks),
        lowest_marks = VALUES(lowest_marks),
        average_marks = VALUES(average_marks),
        pass_count = VALUES(pass_count),
        fail_count = VALUES(fail_count),
        pass_percentage = VALUES(pass_percentage),
        calculated_at = NOW()
    ");
    
    $stmt->execute([
        $scheduleId,
        $stats['total_students'],
        $stats['present_students'],
        $stats['total_students'] - $stats['present_students'],
        $stats['highest_marks'],
        $stats['lowest_marks'],
        $stats['average_marks'],
        $stats['pass_count'],
        $stats['fail_count'],
        $passPercentage
    ]);
}

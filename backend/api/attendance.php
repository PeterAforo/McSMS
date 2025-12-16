<?php
/**
 * Attendance Management API
 * Handles all attendance-related operations
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) || strpos($origin, 'eea.mcaforo.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
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
            if ($action === 'stats') {
                getAttendanceStats($pdo);
            } elseif ($action === 'report') {
                getAttendanceReport($pdo);
            } elseif ($action === 'student') {
                getStudentAttendance($pdo);
            } elseif ($action === 'history') {
                getAttendanceHistory($pdo);
            } elseif ($action === 'calendar') {
                getCalendarData($pdo);
            } elseif ($action === 'student_stats') {
                getStudentStats($pdo);
            } else {
                getAttendance($pdo);
            }
            break;

        case 'POST':
            if ($action === 'mark') {
                markAttendance($pdo);
            } elseif ($action === 'bulk') {
                markBulkAttendance($pdo);
            } elseif ($action === 'mark_teacher') {
                markTeacherAttendance($pdo);
            } elseif ($action === 'mark_class') {
                markClassAttendance($pdo);
            } else {
                createAttendance($pdo);
            }
            break;

        case 'PUT':
            updateAttendance($pdo);
            break;

        case 'DELETE':
            deleteAttendance($pdo);
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

function getAttendance($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $date = $_GET['date'] ?? date('Y-m-d');
    $termId = $_GET['term_id'] ?? null;
    $studentId = $_GET['student_id'] ?? null;

    try {
        // First try with class_name column
        $sql = "
            SELECT 
                a.*,
                s.first_name,
                s.last_name,
                s.student_id as student_number,
                c.class_name,
                u.name as marked_by_name
            FROM attendance a
            LEFT JOIN students s ON a.student_id = s.id
            LEFT JOIN classes c ON a.class_id = c.id
            LEFT JOIN users u ON a.marked_by = u.id
            WHERE 1=1
        ";

        $params = [];

        if ($classId) {
            $sql .= " AND a.class_id = ?";
            $params[] = $classId;
        }

        if ($date) {
            $sql .= " AND a.date = ?";
            $params[] = $date;
        }

        if ($termId) {
            $sql .= " AND a.term_id = ?";
            $params[] = $termId;
        }

        if ($studentId) {
            $sql .= " AND a.student_id = ?";
            $params[] = $studentId;
        }

        $sql .= " ORDER BY a.date DESC, s.first_name ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'attendance' => $attendance
        ]);
    } catch (Exception $e) {
        // Table might not exist or have different structure, return empty
        echo json_encode([
            'success' => true,
            'attendance' => [],
            'note' => 'No attendance records found'
        ]);
    }
}

function getAttendanceStats($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;

    // Overall stats
    $sql = "
        SELECT 
            COUNT(*) as total_records,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
            SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_count
        FROM attendance
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

    if ($startDate) {
        $sql .= " AND date >= ?";
        $params[] = $startDate;
    }

    if ($endDate) {
        $sql .= " AND date <= ?";
        $params[] = $endDate;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Calculate percentage
    $total = $stats['total_records'];
    $stats['present_percentage'] = $total > 0 ? round(($stats['present_count'] / $total) * 100, 2) : 0;
    $stats['absent_percentage'] = $total > 0 ? round(($stats['absent_count'] / $total) * 100, 2) : 0;
    $stats['late_percentage'] = $total > 0 ? round(($stats['late_count'] / $total) * 100, 2) : 0;

    // Get daily attendance trend
    $trendSql = "
        SELECT 
            date,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
        FROM attendance
        WHERE 1=1
    ";

    if ($classId) {
        $trendSql .= " AND class_id = ?";
    }
    if ($termId) {
        $trendSql .= " AND term_id = ?";
    }
    if ($startDate) {
        $trendSql .= " AND date >= ?";
    }
    if ($endDate) {
        $trendSql .= " AND date <= ?";
    }

    $trendSql .= " GROUP BY date ORDER BY date DESC LIMIT 30";

    $trendStmt = $pdo->prepare($trendSql);
    $trendStmt->execute($params);
    $trend = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'trend' => $trend
    ]);
}

function getAttendanceReport($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;

    if (!$classId) {
        throw new Exception('Class ID is required for attendance report');
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

    // Get attendance for each student
    foreach ($students as &$student) {
        $attendanceSql = "
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused_days
            FROM attendance
            WHERE student_id = ?
        ";

        $params = [$student['id']];

        if ($termId) {
            $attendanceSql .= " AND term_id = ?";
            $params[] = $termId;
        }

        if ($startDate) {
            $attendanceSql .= " AND date >= ?";
            $params[] = $startDate;
        }

        if ($endDate) {
            $attendanceSql .= " AND date <= ?";
            $params[] = $endDate;
        }

        $attendanceStmt = $pdo->prepare($attendanceSql);
        $attendanceStmt->execute($params);
        $attendance = $attendanceStmt->fetch(PDO::FETCH_ASSOC);

        $student['attendance'] = $attendance;
        $total = $attendance['total_days'];
        $student['attendance_percentage'] = $total > 0 
            ? round(($attendance['present_days'] / $total) * 100, 2) 
            : 0;
    }

    echo json_encode([
        'success' => true,
        'students' => $students
    ]);
}

function getStudentAttendance($pdo) {
    $studentId = $_GET['student_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;

    if (!$studentId) {
        throw new Exception('Student ID is required');
    }

    $sql = "
        SELECT 
            a.*,
            c.name as class_name,
            u.name as marked_by_name
        FROM attendance a
        LEFT JOIN classes c ON a.class_id = c.id
        LEFT JOIN users u ON a.marked_by = u.id
        WHERE a.student_id = ?
    ";

    $params = [$studentId];

    if ($termId) {
        $sql .= " AND a.term_id = ?";
        $params[] = $termId;
    }

    $sql .= " ORDER BY a.date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'attendance' => $attendance
    ]);
}

function createAttendance($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['student_id', 'class_id', 'date', 'status'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("$field is required");
        }
    }

    $sql = "
        INSERT INTO attendance (
            student_id, class_id, term_id, date, status, 
            time_in, time_out, remarks, marked_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $data['student_id'],
        $data['class_id'],
        $data['term_id'] ?? null,
        $data['date'],
        $data['status'],
        $data['time_in'] ?? null,
        $data['time_out'] ?? null,
        $data['remarks'] ?? null,
        $data['marked_by'] ?? null
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Attendance recorded successfully',
        'id' => $pdo->lastInsertId()
    ]);
}

function markAttendance($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    $required = ['student_id', 'class_id', 'date', 'status'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("$field is required");
        }
    }

    // Check if attendance already exists
    $checkSql = "
        SELECT id FROM attendance 
        WHERE student_id = ? AND date = ?
    ";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$data['student_id'], $data['date']]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        // Update existing
        $sql = "
            UPDATE attendance 
            SET status = ?, time_in = ?, time_out = ?, remarks = ?, marked_by = ?
            WHERE id = ?
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['status'],
            $data['time_in'] ?? null,
            $data['time_out'] ?? null,
            $data['remarks'] ?? null,
            $data['marked_by'] ?? null,
            $existing['id']
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Attendance updated successfully'
        ]);
    } else {
        // Create new
        createAttendance($pdo);
    }
}

function markBulkAttendance($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['attendance']) || !is_array($data['attendance'])) {
        throw new Exception('Attendance array is required');
    }

    $pdo->beginTransaction();

    try {
        $marked = 0;
        foreach ($data['attendance'] as $record) {
            $sql = "
                INSERT INTO attendance (
                    student_id, class_id, term_id, date, status, 
                    time_in, time_out, remarks, marked_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    time_in = VALUES(time_in),
                    time_out = VALUES(time_out),
                    remarks = VALUES(remarks),
                    marked_by = VALUES(marked_by)
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $record['student_id'],
                $record['class_id'],
                $record['term_id'] ?? null,
                $record['date'],
                $record['status'],
                $record['time_in'] ?? null,
                $record['time_out'] ?? null,
                $record['remarks'] ?? null,
                $record['marked_by'] ?? null
            ]);

            $marked++;
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => "Attendance marked for $marked students",
            'count' => $marked
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function markClassAttendance($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['class_id']) || !isset($data['students'])) {
        throw new Exception('class_id and students array required');
    }
    
    $pdo->beginTransaction();
    try {
        $marked = 0;
        foreach ($data['students'] as $record) {
            // Check if attendance already exists for this student on this date
            $checkSql = "SELECT id FROM attendance WHERE student_id = ? AND date = ?";
            $checkStmt = $pdo->prepare($checkSql);
            $checkStmt->execute([$record['student_id'], $data['date']]);
            $existing = $checkStmt->fetch();
            
            if ($existing) {
                // Update existing record
                $sql = "UPDATE attendance SET status = ?, time_in = ?, remarks = ?, marked_by = ? WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $record['status'],
                    $record['time_in'] ?? null,
                    $record['notes'] ?? null,
                    $data['marked_by'] ?? null,
                    $existing['id']
                ]);
            } else {
                // Insert new record
                $sql = "INSERT INTO attendance (student_id, class_id, term_id, date, status, time_in, remarks, marked_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $record['student_id'],
                    $data['class_id'],
                    $data['term_id'] ?? null,
                    $data['date'],
                    $record['status'],
                    $record['time_in'] ?? null,
                    $record['notes'] ?? null,
                    $data['marked_by'] ?? null
                ]);
            }
            $marked++;
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => "Attendance marked for $marked students", 'count' => $marked]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function updateAttendance($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'] ?? $data['id'] ?? null;

    if (!$id) {
        throw new Exception('Attendance ID is required');
    }

    $fields = [];
    $params = [];

    $allowedFields = ['status', 'time_in', 'time_out', 'remarks', 'marked_by'];
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
    $sql = "UPDATE attendance SET " . implode(', ', $fields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'message' => 'Attendance updated successfully'
    ]);
}

function deleteAttendance($pdo) {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        throw new Exception('Attendance ID is required');
    }

    $stmt = $pdo->prepare("DELETE FROM attendance WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode([
        'success' => true,
        'message' => 'Attendance deleted successfully'
    ]);
}

function getAttendanceHistory($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;
    
    if (!$classId) {
        echo json_encode(['success' => true, 'history' => []]);
        return;
    }
    
    $sql = "
        SELECT 
            date,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
            SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused
        FROM attendance
        WHERE class_id = ?
    ";
    
    $params = [$classId];
    
    if ($termId) {
        $sql .= " AND term_id = ?";
        $params[] = $termId;
    }
    
    $sql .= " GROUP BY date ORDER BY date DESC LIMIT 60";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'history' => $history]);
}

function getCalendarData($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $year = $_GET['year'] ?? date('Y');
    $month = $_GET['month'] ?? date('m');
    
    if (!$classId) {
        echo json_encode(['success' => true, 'calendar' => []]);
        return;
    }
    
    $startDate = "$year-$month-01";
    $endDate = date('Y-m-t', strtotime($startDate));
    
    $sql = "
        SELECT 
            date,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
        FROM attendance
        WHERE class_id = ? AND date BETWEEN ? AND ?
        GROUP BY date
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$classId, $startDate, $endDate]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert to keyed array by date
    $calendar = [];
    foreach ($data as $row) {
        $calendar[$row['date']] = $row;
    }
    
    echo json_encode(['success' => true, 'calendar' => $calendar]);
}

function getStudentStats($pdo) {
    $classId = $_GET['class_id'] ?? null;
    $termId = $_GET['term_id'] ?? null;
    
    if (!$classId) {
        echo json_encode(['success' => true, 'stats' => []]);
        return;
    }
    
    // Get students in class
    $studentsSql = "SELECT id FROM students WHERE class_id = ? AND status = 'active'";
    $studentsStmt = $pdo->prepare($studentsSql);
    $studentsStmt->execute([$classId]);
    $students = $studentsStmt->fetchAll(PDO::FETCH_COLUMN);
    
    $stats = [];
    
    foreach ($students as $studentId) {
        $sql = "
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
            FROM attendance
            WHERE student_id = ?
        ";
        
        $params = [$studentId];
        
        if ($termId) {
            $sql .= " AND term_id = ?";
            $params[] = $termId;
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $stats[$studentId] = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    echo json_encode(['success' => true, 'stats' => $stats]);
}

function markTeacherAttendance($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['teachers']) || !is_array($data['teachers'])) {
        throw new Exception('Teachers array is required');
    }
    
    $date = $data['date'] ?? date('Y-m-d');
    
    // Create teacher_attendance table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teacher_attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            date DATE NOT NULL,
            status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
            time_in TIME,
            time_out TIME,
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_teacher_date (teacher_id, date),
            INDEX (teacher_id),
            INDEX (date)
        )
    ");
    
    $pdo->beginTransaction();
    
    try {
        foreach ($data['teachers'] as $record) {
            $sql = "
                INSERT INTO teacher_attendance (teacher_id, date, status, time_in, remarks)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    time_in = VALUES(time_in),
                    remarks = VALUES(remarks)
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $record['teacher_id'],
                $date,
                $record['status'] ?? 'present',
                $record['time_in'] ?? null,
                $record['remarks'] ?? null
            ]);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Teacher attendance saved successfully'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}
?>

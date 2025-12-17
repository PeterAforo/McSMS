<?php
/**
 * Teacher Dashboard API
 * Comprehensive dashboard data for teachers with live statistics
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$teacher_id = $_GET['teacher_id'] ?? null;
$user_id = $_GET['user_id'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Get teacher by user_id if teacher_id not provided
    if (!$teacher_id && $user_id) {
        $stmt = $pdo->prepare("SELECT id FROM teachers WHERE user_id = ? LIMIT 1");
        $stmt->execute([$user_id]);
        $teacher_id = $stmt->fetchColumn();
    }

    if (!$teacher_id) {
        echo json_encode(['success' => false, 'error' => 'Teacher not found']);
        exit();
    }

    // Get teacher info
    $stmt = $pdo->prepare("SELECT * FROM teachers WHERE id = ?");
    $stmt->execute([$teacher_id]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get teacher's classes via class_subjects
    $stmt = $pdo->prepare("
        SELECT DISTINCT c.*, 
               (SELECT COUNT(*) FROM students WHERE class_id = c.id AND status = 'active') as student_count
        FROM classes c
        INNER JOIN class_subjects cs ON c.id = cs.class_id
        WHERE cs.teacher_id = ? AND c.status = 'active'
        ORDER BY c.class_name
    ");
    $stmt->execute([$teacher_id]);
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get teacher's subjects
    $stmt = $pdo->prepare("
        SELECT DISTINCT s.*, cs.class_id, c.class_name
        FROM subjects s
        INNER JOIN class_subjects cs ON s.id = cs.subject_id
        INNER JOIN classes c ON cs.class_id = c.id
        WHERE cs.teacher_id = ?
        ORDER BY c.class_name, s.subject_name
    ");
    $stmt->execute([$teacher_id]);
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total students across all classes
    $classIds = array_column($classes, 'id');
    $totalStudents = 0;
    if (!empty($classIds)) {
        $placeholders = implode(',', array_fill(0, count($classIds), '?'));
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE class_id IN ($placeholders) AND status = 'active'");
        $stmt->execute($classIds);
        $totalStudents = $stmt->fetchColumn();
    }

    // Get today's date info
    $today = date('Y-m-d');
    $dayOfWeek = strtolower(date('l'));
    $weekStart = date('Y-m-d', strtotime('monday this week'));
    $weekEnd = date('Y-m-d', strtotime('sunday this week'));

    // Get today's schedule from timetable
    $todaysSchedule = [];
    if (!empty($classIds)) {
        $placeholders = implode(',', array_fill(0, count($classIds), '?'));
        $stmt = $pdo->prepare("
            SELECT t.*, c.class_name, s.subject_name
            FROM timetable t
            LEFT JOIN classes c ON t.class_id = c.id
            LEFT JOIN subjects s ON t.subject_id = s.id
            WHERE t.class_id IN ($placeholders) 
            AND t.teacher_id = ?
            AND LOWER(t.day_of_week) = ?
            ORDER BY t.start_time
        ");
        $params = array_merge($classIds, [$teacher_id, $dayOfWeek]);
        $stmt->execute($params);
        $todaysSchedule = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get attendance status for today
    $attendanceStatus = [];
    foreach ($classes as $class) {
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
            FROM attendance 
            WHERE class_id = ? AND date = ?
        ");
        $stmt->execute([$class['id'], $today]);
        $att = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $attendanceStatus[$class['id']] = [
            'class_id' => $class['id'],
            'class_name' => $class['class_name'],
            'marked' => ($att['total'] ?? 0) > 0,
            'total' => $att['total'] ?? 0,
            'present' => $att['present'] ?? 0,
            'absent' => $att['absent'] ?? 0,
            'late' => $att['late'] ?? 0,
            'student_count' => $class['student_count']
        ];
    }

    // Get pending homework (active homework not yet due)
    $pendingHomework = 0;
    if (!empty($classIds)) {
        $placeholders = implode(',', array_fill(0, count($classIds), '?'));
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM homework 
            WHERE class_id IN ($placeholders) 
            AND teacher_id = ?
            AND status = 'active'
            AND due_date >= ?
        ");
        $params = array_merge($classIds, [$teacher_id, $today]);
        $stmt->execute($params);
        $pendingHomework = $stmt->fetchColumn();
    }

    // Get homework submissions to review
    $homeworkToReview = 0;
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM homework_submissions hs
        INNER JOIN homework h ON hs.homework_id = h.id
        WHERE h.teacher_id = ? AND hs.status = 'submitted'
    ");
    $stmt->execute([$teacher_id]);
    $homeworkToReview = $stmt->fetchColumn();

    // Get grades to enter (assessments without grades for teacher's classes)
    $pendingGrades = 0;
    if (!empty($classIds)) {
        $placeholders = implode(',', array_fill(0, count($classIds), '?'));
        $stmt = $pdo->prepare("
            SELECT COUNT(DISTINCT a.id) FROM assessments a
            LEFT JOIN grades g ON a.id = g.assessment_id
            WHERE a.class_id IN ($placeholders)
            AND g.id IS NULL
            AND a.status = 'published'
        ");
        $stmt->execute($classIds);
        $pendingGrades = $stmt->fetchColumn();
    }

    // Get class performance (average grades per class)
    $classPerformance = [];
    foreach ($classes as $class) {
        $stmt = $pdo->prepare("
            SELECT AVG(g.marks_obtained) as avg_score, COUNT(DISTINCT g.student_id) as graded_students
            FROM grades g
            INNER JOIN assessments a ON g.assessment_id = a.id
            WHERE a.class_id = ?
        ");
        $stmt->execute([$class['id']]);
        $perf = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $classPerformance[] = [
            'class_id' => $class['id'],
            'class_name' => $class['class_name'],
            'student_count' => $class['student_count'],
            'average' => $perf['avg_score'] ? round($perf['avg_score'], 1) : null,
            'graded_students' => $perf['graded_students'] ?? 0
        ];
    }

    // Get student alerts (low attendance, failing grades)
    $studentAlerts = [];
    if (!empty($classIds)) {
        // Students with low attendance this week
        $placeholders = implode(',', array_fill(0, count($classIds), '?'));
        $stmt = $pdo->prepare("
            SELECT s.id, s.first_name, s.last_name, c.class_name,
                   COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absences,
                   COUNT(a.id) as total_records
            FROM students s
            INNER JOIN classes c ON s.class_id = c.id
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date BETWEEN ? AND ?
            WHERE s.class_id IN ($placeholders) AND s.status = 'active'
            GROUP BY s.id
            HAVING absences >= 2
            ORDER BY absences DESC
            LIMIT 5
        ");
        $params = array_merge([$weekStart, $weekEnd], $classIds);
        $stmt->execute($params);
        $lowAttendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($lowAttendance as $student) {
            $studentAlerts[] = [
                'student_id' => $student['id'],
                'student_name' => $student['first_name'] . ' ' . $student['last_name'],
                'class_name' => $student['class_name'],
                'issue' => "Absent {$student['absences']} times this week",
                'type' => 'attendance',
                'severity' => $student['absences'] >= 3 ? 'high' : 'medium'
            ];
        }

        // Students with low grades
        $stmt = $pdo->prepare("
            SELECT s.id, s.first_name, s.last_name, c.class_name,
                   AVG(g.marks_obtained) as avg_grade
            FROM students s
            INNER JOIN classes c ON s.class_id = c.id
            INNER JOIN grades g ON s.id = g.student_id
            WHERE s.class_id IN ($placeholders) AND s.status = 'active'
            GROUP BY s.id
            HAVING avg_grade < 50
            ORDER BY avg_grade ASC
            LIMIT 5
        ");
        $stmt->execute($classIds);
        $lowGrades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($lowGrades as $student) {
            $studentAlerts[] = [
                'student_id' => $student['id'],
                'student_name' => $student['first_name'] . ' ' . $student['last_name'],
                'class_name' => $student['class_name'],
                'issue' => "Average grade: " . round($student['avg_grade'], 1) . "%",
                'type' => 'grades',
                'severity' => $student['avg_grade'] < 40 ? 'high' : 'medium'
            ];
        }
    }

    // Get upcoming events
    $stmt = $pdo->prepare("
        SELECT * FROM events 
        WHERE (start_date >= ? OR end_date >= ?)
        AND status = 'active'
        ORDER BY start_date ASC
        LIMIT 5
    ");
    $stmt->execute([$today, $today]);
    $upcomingEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get recent messages
    $recentMessages = [];
    if ($teacher['user_id']) {
        $stmt = $pdo->prepare("
            SELECT m.*, u.name as sender_name
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.recipient_id = ?
            ORDER BY m.created_at DESC
            LIMIT 5
        ");
        $stmt->execute([$teacher['user_id']]);
        $recentMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get weekly stats
    $weeklyStats = [
        'attendance_marked' => 0,
        'homework_assigned' => 0,
        'grades_entered' => 0,
        'messages_sent' => 0
    ];

    // Attendance records marked this week
    if (!empty($classIds)) {
        $placeholders = implode(',', array_fill(0, count($classIds), '?'));
        $stmt = $pdo->prepare("
            SELECT COUNT(DISTINCT CONCAT(class_id, '-', date)) as days_marked
            FROM attendance 
            WHERE class_id IN ($placeholders) AND date BETWEEN ? AND ?
        ");
        $params = array_merge($classIds, [$weekStart, $weekEnd]);
        $stmt->execute($params);
        $weeklyStats['attendance_marked'] = $stmt->fetchColumn();
    }

    // Homework assigned this week
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM homework 
        WHERE teacher_id = ? AND created_at BETWEEN ? AND ?
    ");
    $stmt->execute([$teacher_id, $weekStart . ' 00:00:00', $weekEnd . ' 23:59:59']);
    $weeklyStats['homework_assigned'] = $stmt->fetchColumn();

    // Grades entered this week
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM grades 
        WHERE teacher_id = ? AND created_at BETWEEN ? AND ?
    ");
    $stmt->execute([$teacher_id, $weekStart . ' 00:00:00', $weekEnd . ' 23:59:59']);
    $weeklyStats['grades_entered'] = $stmt->fetchColumn();

    // Build response
    echo json_encode([
        'success' => true,
        'teacher' => $teacher,
        'classes' => $classes,
        'subjects' => $subjects,
        'total_students' => $totalStudents,
        'todays_schedule' => $todaysSchedule,
        'attendance_status' => array_values($attendanceStatus),
        'pending_homework' => $pendingHomework,
        'homework_to_review' => $homeworkToReview,
        'pending_grades' => $pendingGrades,
        'class_performance' => $classPerformance,
        'student_alerts' => array_slice($studentAlerts, 0, 5),
        'upcoming_events' => $upcomingEvents,
        'recent_messages' => $recentMessages,
        'weekly_stats' => $weeklyStats,
        'today' => $today,
        'day_of_week' => ucfirst($dayOfWeek)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}

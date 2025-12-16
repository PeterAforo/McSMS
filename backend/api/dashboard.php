<?php
/**
 * Comprehensive Dashboard API with AI Insights
 * Provides role-based dashboard data and intelligent recommendations
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) || strpos($origin, 'eea.mcaforo.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once dirname(dirname(__DIR__)) . '/config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $role = $_GET['role'] ?? 'admin';
    $userId = $_GET['user_id'] ?? null;
    $action = $_GET['action'] ?? 'overview';

    switch ($role) {
        case 'admin':
            echo json_encode(getAdminDashboard($pdo, $action));
            break;
        case 'principal':
            echo json_encode(getPrincipalDashboard($pdo, $userId, $action));
            break;
        case 'hr':
            echo json_encode(getHRDashboard($pdo, $userId, $action));
            break;
        case 'finance':
            echo json_encode(getFinanceDashboard($pdo, $userId, $action));
            break;
        case 'teacher':
            echo json_encode(getTeacherDashboard($pdo, $userId, $action));
            break;
        case 'student':
            echo json_encode(getStudentDashboard($pdo, $userId, $action));
            break;
        case 'parent':
            echo json_encode(getParentDashboard($pdo, $userId, $action));
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid role']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// ADMIN DASHBOARD
// ============================================
function getAdminDashboard($pdo, $action) {
    $data = ['success' => true, 'role' => 'admin'];
    
    // Overview Statistics
    $data['stats'] = getAdminStats($pdo);
    
    // Financial Overview
    $data['financial'] = getFinancialOverview($pdo);
    
    // Academic Performance
    $data['academic'] = getAcademicOverview($pdo);
    
    // HR Overview
    $data['hr'] = getHROverview($pdo);
    
    // Recent Activities
    $data['activities'] = getRecentActivities($pdo);
    
    // AI Insights
    $data['insights'] = generateAdminInsights($pdo, $data);
    
    // Charts Data
    $data['charts'] = getAdminCharts($pdo);
    
    return $data;
}

function getAdminStats($pdo) {
    $stats = [];
    
    // Total Students
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
    $stats['total_students'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total Teachers
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM teachers WHERE status = 'active'");
    $stats['total_teachers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total Employees
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
    $stats['total_employees'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total Classes
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM classes");
    $stats['total_classes'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total Parents
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM parents");
    $stats['total_parents'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Attendance Today
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT COUNT(*) as present FROM attendance WHERE date = ? AND status = 'present'");
    $stmt->execute([$today]);
    $stats['attendance_today'] = $stmt->fetch(PDO::FETCH_ASSOC)['present'];
    
    // Pending Leave Applications
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'pending'");
    $stats['pending_leaves'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Active Terms
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM terms WHERE status = 'active'");
    $stats['active_terms'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    return $stats;
}

function getFinancialOverview($pdo) {
    $financial = [];
    $currentMonth = date('Y-m');
    $currentYear = date('Y');
    
    // Total Revenue This Month
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE DATE_FORMAT(payment_date, '%Y-%m') = ?
    ");
    $stmt->execute([$currentMonth]);
    $financial['revenue_this_month'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total Revenue This Year
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE YEAR(payment_date) = ?
    ");
    $stmt->execute([$currentYear]);
    $financial['revenue_this_year'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Outstanding Fees
    $stmt = $pdo->query("
        SELECT COALESCE(SUM(balance), 0) as total 
        FROM invoices 
        WHERE status IN ('pending', 'partial')
    ");
    $financial['outstanding_fees'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total Payroll This Month
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(net_salary), 0) as total 
        FROM payroll 
        WHERE payroll_month = ?
    ");
    $stmt->execute([$currentMonth]);
    $financial['payroll_this_month'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Collection Rate
    $stmt = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices");
    $totalInvoiced = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $stmt = $pdo->query("SELECT COALESCE(SUM(paid_amount), 0) as total FROM invoices");
    $totalPaid = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $financial['collection_rate'] = $totalInvoiced > 0 ? round(($totalPaid / $totalInvoiced) * 100, 1) : 0;
    
    return $financial;
}

function getAcademicOverview($pdo) {
    $academic = [];
    
    // Average Performance (if grades exist)
    $stmt = $pdo->query("
        SELECT AVG(marks_obtained) as avg_marks_obtained 
        FROM grades 
        WHERE marks_obtained IS NOT NULL
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $academic['average_marks_obtained'] = $result['avg_marks_obtained'] ? round($result['avg_marks_obtained'], 1) : 0;
    
    // Pass Rate
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM grades WHERE marks_obtained IS NOT NULL");
    $totalGrades = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $stmt = $pdo->query("SELECT COUNT(*) as passed FROM grades WHERE marks_obtained >= 50");
    $passedGrades = $stmt->fetch(PDO::FETCH_ASSOC)['passed'];
    $academic['pass_rate'] = $totalGrades > 0 ? round(($passedGrades / $totalGrades) * 100, 1) : 0;
    
    // Subjects Count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM subjects WHERE status = 'active'");
    $academic['total_subjects'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Exams This Term
    $stmt = $pdo->query("
        SELECT COUNT(*) as count FROM exams 
        WHERE term_id = (SELECT id FROM terms WHERE status = 'active' LIMIT 1)
    ");
    $academic['exams_this_term'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    return $academic;
}

function getHROverview($pdo) {
    $hr = [];
    $currentMonth = date('Y-m');
    
    // Present Today
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM employee_attendance 
        WHERE attendance_date = ? AND status = 'present'
    ");
    $stmt->execute([$today]);
    $hr['present_today'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // On Leave Today
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM leave_applications 
        WHERE status = 'approved' AND ? BETWEEN start_date AND end_date
    ");
    $stmt->execute([$today]);
    $hr['on_leave_today'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Pending Payroll
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM payroll 
        WHERE payroll_month = ? AND status = 'processed'
    ");
    $stmt->execute([$currentMonth]);
    $hr['pending_payroll'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Total Payroll Amount
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(net_salary), 0) as total FROM payroll 
        WHERE payroll_month = ?
    ");
    $stmt->execute([$currentMonth]);
    $hr['total_payroll'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    return $hr;
}

function getRecentActivities($pdo) {
    $activities = [];
    
    // Recent Payments
    $stmt = $pdo->query("
        SELECT 
            'payment' as type,
            CONCAT('Payment received: GHS ', amount) as description,
            payment_date as date
        FROM payments 
        ORDER BY payment_date DESC 
        LIMIT 5
    ");
    $activities = array_merge($activities, $stmt->fetchAll(PDO::FETCH_ASSOC));
    
    // Recent Admissions
    $stmt = $pdo->query("
        SELECT 
            'admission' as type,
            CONCAT('New student: ', first_name, ' ', last_name) as description,
            created_at as date
        FROM students 
        ORDER BY created_at DESC 
        LIMIT 5
    ");
    $activities = array_merge($activities, $stmt->fetchAll(PDO::FETCH_ASSOC));
    
    // Sort by date
    usort($activities, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    return array_slice($activities, 0, 10);
}

function generateAdminInsights($pdo, $data) {
    $insights = [];
    
    // Financial Insights
    if ($data['financial']['collection_rate'] < 70) {
        $insights[] = [
            'type' => 'warning',
            'category' => 'Finance',
            'title' => 'Low Fee Collection Rate',
            'message' => "Fee collection rate is at {$data['financial']['collection_rate']}%. Consider sending payment reminders to parents.",
            'action' => 'Send Reminders',
            'priority' => 'high'
        ];
    }
    
    if ($data['financial']['outstanding_fees'] > 50000) {
        $outstanding = number_format($data['financial']['outstanding_fees'], 2);
        $insights[] = [
            'type' => 'alert',
            'category' => 'Finance',
            'title' => 'High Outstanding Fees',
            'message' => "Outstanding fees total GHS {$outstanding}. Review overdue accounts.",
            'action' => 'View Debtors',
            'priority' => 'high'
        ];
    }
    
    // HR Insights
    if ($data['hr']['pending_payroll'] > 0) {
        $insights[] = [
            'type' => 'info',
            'category' => 'HR',
            'title' => 'Payroll Pending',
            'message' => "{$data['hr']['pending_payroll']} employees have processed payroll awaiting payment.",
            'action' => 'Process Payments',
            'priority' => 'medium'
        ];
    }
    
    if ($data['stats']['pending_leaves'] > 0) {
        $insights[] = [
            'type' => 'info',
            'category' => 'HR',
            'title' => 'Leave Requests Pending',
            'message' => "{$data['stats']['pending_leaves']} leave applications require your attention.",
            'action' => 'Review Leaves',
            'priority' => 'medium'
        ];
    }
    
    // Academic Insights
    if ($data['academic']['pass_rate'] < 60 && $data['academic']['pass_rate'] > 0) {
        $insights[] = [
            'type' => 'warning',
            'category' => 'Academic',
            'title' => 'Low Pass Rate',
            'message' => "Overall pass rate is {$data['academic']['pass_rate']}%. Consider academic intervention programs.",
            'action' => 'View Reports',
            'priority' => 'high'
        ];
    }
    
    // Attendance Insights
    $attendanceRate = $data['stats']['total_students'] > 0 
        ? round(($data['stats']['attendance_today'] / $data['stats']['total_students']) * 100, 1) 
        : 0;
    
    if ($attendanceRate < 80 && $attendanceRate > 0) {
        $insights[] = [
            'type' => 'warning',
            'category' => 'Attendance',
            'title' => 'Low Attendance Today',
            'message' => "Only {$attendanceRate}% attendance recorded today. Check for any issues.",
            'action' => 'View Attendance',
            'priority' => 'medium'
        ];
    }
    
    // Positive Insights
    if ($data['financial']['collection_rate'] >= 90) {
        $insights[] = [
            'type' => 'success',
            'category' => 'Finance',
            'title' => 'Excellent Collection Rate',
            'message' => "Fee collection rate is at {$data['financial']['collection_rate']}%. Great job!",
            'action' => null,
            'priority' => 'low'
        ];
    }
    
    if ($data['academic']['pass_rate'] >= 80) {
        $insights[] = [
            'type' => 'success',
            'category' => 'Academic',
            'title' => 'Strong Academic Performance',
            'message' => "Pass rate is at {$data['academic']['pass_rate']}%. Students are performing well!",
            'action' => null,
            'priority' => 'low'
        ];
    }
    
    // Sort by priority
    usort($insights, function($a, $b) {
        $priority = ['high' => 1, 'medium' => 2, 'low' => 3];
        return $priority[$a['priority']] - $priority[$b['priority']];
    });
    
    return $insights;
}

function getAdminCharts($pdo) {
    $charts = [];
    
    // Monthly Revenue (Last 6 months)
    $charts['revenue'] = [];
    for ($i = 5; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $monthName = date('M Y', strtotime("-$i months"));
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM payments 
            WHERE DATE_FORMAT(payment_date, '%Y-%m') = ?
        ");
        $stmt->execute([$month]);
        $charts['revenue'][] = [
            'month' => $monthName,
            'amount' => floatval($stmt->fetch(PDO::FETCH_ASSOC)['total'])
        ];
    }
    
    // Student Distribution by Class
    $stmt = $pdo->query("
        SELECT c.class_name, COUNT(s.id) as count
        FROM classes c
        LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
        GROUP BY c.id, c.class_name
        ORDER BY c.class_name
    ");
    $charts['students_by_class'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Attendance Trend (Last 7 days)
    $charts['attendance'] = [];
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $dayName = date('D', strtotime("-$i days"));
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent
            FROM attendance 
            WHERE date = ?
        ");
        $stmt->execute([$date]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $charts['attendance'][] = [
            'day' => $dayName,
            'present' => intval($result['present']),
            'absent' => intval($result['absent'])
        ];
    }
    
    // Fee Collection Status
    $stmt = $pdo->query("
        SELECT 
            status,
            COUNT(*) as count,
            SUM(total_amount) as total
        FROM invoices
        GROUP BY status
    ");
    $charts['fee_status'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return $charts;
}

// ============================================
// TEACHER DASHBOARD
// ============================================
function getTeacherDashboard($pdo, $userId, $action) {
    $data = ['success' => true, 'role' => 'teacher'];
    
    // Get teacher info - try by user_id first
    $stmt = $pdo->prepare("
        SELECT t.*, u.email 
        FROM teachers t 
        LEFT JOIN users u ON t.user_id = u.id 
        WHERE t.user_id = ?
    ");
    $stmt->execute([$userId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // If not found by user_id, try by teacher id directly
    if (!$teacher) {
        $stmt = $pdo->prepare("
            SELECT t.*, u.email 
            FROM teachers t 
            LEFT JOIN users u ON t.user_id = u.id 
            WHERE t.id = ?
        ");
        $stmt->execute([$userId]);
        $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if (!$teacher) {
        return ['success' => false, 'error' => 'Teacher not found'];
    }
    
    $data['teacher'] = $teacher;
    
    // My Classes
    $stmt = $pdo->prepare("
        SELECT c.*, COUNT(s.id) as student_count
        FROM classes c
        LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
        WHERE c.class_teacher_id = ?
        GROUP BY c.id
    ");
    $stmt->execute([$teacher['id']]);
    $data['my_classes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // My Subjects
    $stmt = $pdo->prepare("
        SELECT DISTINCT sub.* 
        FROM subjects sub
        JOIN teacher_subjects ts ON ts.subject_id = sub.id
        WHERE ts.teacher_id = ?
    ");
    $stmt->execute([$teacher['id']]);
    $data['my_subjects'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Today's Schedule
    $today = strtolower(date('l'));
    $stmt = $pdo->prepare("
        SELECT te.*, c.class_name, sub.subject_name, ts.start_time, ts.end_time
        FROM timetable_entries te
        JOIN classes c ON te.class_id = c.id
        JOIN subjects sub ON te.subject_id = sub.id
        LEFT JOIN time_slots ts ON te.time_slot_id = ts.id
        WHERE te.teacher_id = ? AND te.day_of_week = ?
        ORDER BY ts.start_time
    ");
    $stmt->execute([$teacher['id'], $today]);
    $data['todays_schedule'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Pending Assignments
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM homework 
        WHERE teacher_id = ? AND due_date >= CURDATE()
    ");
    $stmt->execute([$teacher['id']]);
    $data['pending_assignments'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Students to Grade (assessments without grades)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count FROM assessments a
        JOIN classes c ON a.class_id = c.id
        LEFT JOIN grades g ON g.assessment_id = a.id
        WHERE c.class_teacher_id = ? AND g.id IS NULL
    ");
    $stmt->execute([$teacher['id']]);
    $data['pending_grades'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // AI Insights for Teacher
    $data['insights'] = generateTeacherInsights($pdo, $teacher, $data);
    
    return $data;
}

function generateTeacherInsights($pdo, $teacher, $data) {
    $insights = [];
    
    // Class Performance Insights
    foreach ($data['my_classes'] as $class) {
        $stmt = $pdo->prepare("
            SELECT AVG(g.marks_obtained) as avg_marks_obtained FROM grades g
            JOIN assessments a ON g.assessment_id = a.id
            WHERE a.class_id = ? AND g.marks_obtained IS NOT NULL
        ");
        $stmt->execute([$class['id']]);
        $avgScore = $stmt->fetch(PDO::FETCH_ASSOC)['avg_marks_obtained'];
        
        if ($avgScore && $avgScore < 50) {
            $insights[] = [
                'type' => 'warning',
                'category' => 'Academic',
                'title' => "Low Performance in {$class['class_name']}",
                'message' => "Average score is " . round($avgScore, 1) . "%. Consider extra tutorials.",
                'action' => 'View Class',
                'priority' => 'high'
            ];
        }
    }
    
    // Pending Work
    if ($data['pending_grades'] > 0) {
        $insights[] = [
            'type' => 'info',
            'category' => 'Tasks',
            'title' => 'Grades Pending',
            'message' => "{$data['pending_grades']} student grades need to be entered.",
            'action' => 'Enter Grades',
            'priority' => 'medium'
        ];
    }
    
    // Today's Classes
    $classCount = count($data['todays_schedule']);
    if ($classCount > 0) {
        $insights[] = [
            'type' => 'info',
            'category' => 'Schedule',
            'title' => "Today's Classes",
            'message' => "You have {$classCount} class(es) scheduled for today.",
            'action' => 'View Schedule',
            'priority' => 'low'
        ];
    }
    
    return $insights;
}

// ============================================
// STUDENT DASHBOARD
// ============================================
function getStudentDashboard($pdo, $userId, $action) {
    $data = ['success' => true, 'role' => 'student'];
    
    // Get student info - userId here is the student's ID directly
    $stmt = $pdo->prepare("
        SELECT s.*, c.class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.id = ?
    ");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        return ['success' => false, 'error' => 'Student not found'];
    }
    
    $data['student'] = $student;
    
    // My Grades
    $stmt = $pdo->prepare("
        SELECT g.*, a.assessment_name, sub.subject_name
        FROM grades g
        JOIN assessments a ON g.assessment_id = a.id
        JOIN subjects sub ON a.subject_id = sub.id
        WHERE g.student_id = ?
        ORDER BY g.created_at DESC
        LIMIT 10
    ");
    $stmt->execute([$student['id']]);
    $data['recent_grades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Average Score
    $stmt = $pdo->prepare("
        SELECT AVG(marks_obtained) as avg_marks_obtained FROM grades 
        WHERE student_id = ? AND marks_obtained IS NOT NULL
    ");
    $stmt->execute([$student['id']]);
    $data['average_marks_obtained'] = round($stmt->fetch(PDO::FETCH_ASSOC)['avg_marks_obtained'] ?? 0, 1);
    
    // Attendance Summary
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
        FROM attendance 
        WHERE student_id = ?
    ");
    $stmt->execute([$student['id']]);
    $data['attendance'] = $stmt->fetch(PDO::FETCH_ASSOC);
    $data['attendance_rate'] = $data['attendance']['total'] > 0 
        ? round(($data['attendance']['present'] / $data['attendance']['total']) * 100, 1) 
        : 0;
    
    // Pending Homework
    $stmt = $pdo->prepare("
        SELECT h.*, sub.subject_name
        FROM homework h
        JOIN subjects sub ON h.subject_id = sub.id
        WHERE h.class_id = ? AND h.due_date >= CURDATE()
        ORDER BY h.due_date
        LIMIT 5
    ");
    $stmt->execute([$student['class_id']]);
    $data['pending_homework'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Fee Status
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(total_amount), 0) as total_fees,
            COALESCE(SUM(paid_amount), 0) as paid,
            COALESCE(SUM(balance), 0) as balance
        FROM invoices 
        WHERE student_id = ?
    ");
    $stmt->execute([$student['id']]);
    $data['fees'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Today's Timetable
    $today = strtolower(date('l'));
    $stmt = $pdo->prepare("
        SELECT te.*, sub.subject_name, CONCAT(t.first_name, ' ', t.last_name) as teacher_name, ts.start_time, ts.end_time
        FROM timetable_entries te
        JOIN subjects sub ON te.subject_id = sub.id
        LEFT JOIN teachers t ON te.teacher_id = t.id
        LEFT JOIN time_slots ts ON te.time_slot_id = ts.id
        WHERE te.class_id = ? AND te.day_of_week = ?
        ORDER BY ts.start_time
    ");
    $stmt->execute([$student['class_id'], $today]);
    $data['todays_timetable'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // AI Insights for Student
    $data['insights'] = generateStudentInsights($pdo, $student, $data);
    
    return $data;
}

function generateStudentInsights($pdo, $student, $data) {
    $insights = [];
    
    // Academic Performance
    if ($data['average_marks_obtained'] < 50 && $data['average_marks_obtained'] > 0) {
        $insights[] = [
            'type' => 'warning',
            'category' => 'Academic',
            'title' => 'Improve Your Grades',
            'message' => "Your average score is {$data['average_marks_obtained']}%. Focus on weaker subjects.",
            'action' => 'View Grades',
            'priority' => 'high'
        ];
    } elseif ($data['average_marks_obtained'] >= 80) {
        $insights[] = [
            'type' => 'success',
            'category' => 'Academic',
            'title' => 'Excellent Performance!',
            'message' => "Your average score is {$data['average_marks_obtained']}%. Keep up the great work!",
            'action' => null,
            'priority' => 'low'
        ];
    }
    
    // Attendance
    if ($data['attendance_rate'] < 80 && $data['attendance_rate'] > 0) {
        $insights[] = [
            'type' => 'warning',
            'category' => 'Attendance',
            'title' => 'Improve Attendance',
            'message' => "Your attendance rate is {$data['attendance_rate']}%. Regular attendance improves learning.",
            'action' => 'View Attendance',
            'priority' => 'medium'
        ];
    }
    
    // Pending Homework
    $homeworkCount = count($data['pending_homework']);
    if ($homeworkCount > 0) {
        $insights[] = [
            'type' => 'info',
            'category' => 'Tasks',
            'title' => 'Homework Due',
            'message' => "You have {$homeworkCount} homework assignment(s) pending.",
            'action' => 'View Homework',
            'priority' => 'medium'
        ];
    }
    
    // Fee Balance
    if ($data['fees']['balance'] > 0) {
        $balance = number_format($data['fees']['balance'], 2);
        $insights[] = [
            'type' => 'info',
            'category' => 'Finance',
            'title' => 'Fee Balance',
            'message' => "You have an outstanding balance of GHS {$balance}.",
            'action' => 'View Fees',
            'priority' => 'medium'
        ];
    }
    
    return $insights;
}

// ============================================
// PARENT DASHBOARD
// ============================================
function getParentDashboard($pdo, $userId, $action) {
    $data = ['success' => true, 'role' => 'parent'];
    
    // Get parent info - try by user_id first, then by parent id
    $stmt = $pdo->prepare("
        SELECT p.*, u.email, u.name as full_name
        FROM parents p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
    ");
    $stmt->execute([$userId]);
    $parent = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // If not found by user_id, try by parent id directly
    if (!$parent) {
        $stmt = $pdo->prepare("
            SELECT p.*, u.email, u.name as full_name
            FROM parents p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        ");
        $stmt->execute([$userId]);
        $parent = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // If still no parent record, create one automatically for this user
    if (!$parent) {
        // Get user info
        $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            return ['success' => false, 'error' => 'User not found'];
        }
        
        // Create parent record
        $stmt = $pdo->prepare("INSERT INTO parents (user_id, created_at) VALUES (?, NOW())");
        $stmt->execute([$userId]);
        $parentId = $pdo->lastInsertId();
        
        // Fetch the newly created parent record
        $parent = [
            'id' => $parentId,
            'user_id' => $userId,
            'email' => $user['email'],
            'full_name' => $user['name']
        ];
    }
    
    $data['parent'] = $parent;
    
    // Get Children
    $stmt = $pdo->prepare("
        SELECT s.*, c.class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.parent_id = ?
    ");
    $stmt->execute([$parent['id']]);
    $children = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $data['children'] = $children;
    
    // Children's Performance Summary
    $data['children_summary'] = [];
    foreach ($children as $child) {
        $summary = ['student' => $child];
        
        // Average Score
        $stmt = $pdo->prepare("
            SELECT AVG(marks_obtained) as avg_score FROM grades 
            WHERE student_id = ? AND marks_obtained IS NOT NULL
        ");
        $stmt->execute([$child['id']]);
        $summary['average_score'] = round($stmt->fetch(PDO::FETCH_ASSOC)['avg_score'] ?? 0, 1);
        
        // Attendance Rate - check last 30 days
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
            FROM attendance 
            WHERE student_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $stmt->execute([$child['id']]);
        $att = $stmt->fetch(PDO::FETCH_ASSOC);
        $summary['attendance_rate'] = $att['total'] > 0 
            ? round(($att['present'] / $att['total']) * 100, 1) 
            : 0;
        $summary['attendance_total'] = $att['total'] ?? 0;
        $summary['attendance_present'] = $att['present'] ?? 0;
        
        // Fee Balance - calculate from total_amount - amount_paid (more accurate)
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(total_amount), 0) as total_fees,
                COALESCE(SUM(amount_paid), 0) as total_paid,
                COALESCE(SUM(total_amount - amount_paid), 0) as balance 
            FROM invoices 
            WHERE student_id = ? AND status != 'cancelled'
        ");
        $stmt->execute([$child['id']]);
        $feeData = $stmt->fetch(PDO::FETCH_ASSOC);
        $summary['fee_balance'] = max(0, $feeData['balance'] ?? 0);
        $summary['total_fees'] = $feeData['total_fees'] ?? 0;
        $summary['total_paid'] = $feeData['total_paid'] ?? 0;
        
        // Subjects Enrolled - count subjects for this student's class
        $subjectCount = 0;
        try {
            // First try class_subjects table
            $stmt = $pdo->prepare("
                SELECT COUNT(DISTINCT subject_id) as count 
                FROM class_subjects 
                WHERE class_id = ?
            ");
            $stmt->execute([$child['class_id']]);
            $subjectCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;
        } catch (Exception $e) {
            // class_subjects table might not exist
        }
        
        // If no class_subjects, try subjects table directly
        if ($subjectCount == 0) {
            try {
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM subjects WHERE status = 'active'");
                $subjectCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;
            } catch (Exception $e) {
                $subjectCount = 0;
            }
        }
        $summary['subjects_enrolled'] = $subjectCount;
        
        // Get student photo
        $summary['photo'] = $child['photo'] ?? $child['profile_photo'] ?? null;
        
        $data['children_summary'][] = $summary;
    }
    
    // Total Fee Balance - calculate from total_amount - amount_paid
    $childIds = array_column($children, 'id');
    if (!empty($childIds)) {
        $placeholders = implode(',', array_fill(0, count($childIds), '?'));
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(total_amount - amount_paid), 0) as total 
            FROM invoices 
            WHERE student_id IN ($placeholders) AND status != 'cancelled'
        ");
        $stmt->execute($childIds);
        $data['total_fee_balance'] = max(0, $stmt->fetch(PDO::FETCH_ASSOC)['total']);
    } else {
        $data['total_fee_balance'] = 0;
    }
    
    // Get Applications submitted by this parent (using user_id)
    $stmt = $pdo->prepare("
        SELECT * FROM student_applications 
        WHERE parent_id = ?
        ORDER BY application_date DESC
    ");
    $stmt->execute([$parent['user_id']]);
    $data['applications'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // AI Insights for Parent
    $data['insights'] = generateParentInsights($pdo, $parent, $data);
    
    return $data;
}

function generateParentInsights($pdo, $parent, $data) {
    $insights = [];
    
    foreach ($data['children_summary'] as $summary) {
        $childName = $summary['student']['first_name'];
        
        // Academic Performance
        if ($summary['average_marks_obtained'] < 50 && $summary['average_marks_obtained'] > 0) {
            $insights[] = [
                'type' => 'warning',
                'category' => 'Academic',
                'title' => "{$childName} Needs Support",
                'message' => "{$childName}'s average score is {$summary['average_marks_obtained']}%. Consider extra tutoring.",
                'action' => 'View Grades',
                'priority' => 'high'
            ];
        } elseif ($summary['average_marks_obtained'] >= 80) {
            $insights[] = [
                'type' => 'success',
                'category' => 'Academic',
                'title' => "{$childName} Excelling!",
                'message' => "{$childName}'s average score is {$summary['average_marks_obtained']}%. Great performance!",
                'action' => null,
                'priority' => 'low'
            ];
        }
        
        // Attendance
        if ($summary['attendance_rate'] < 80 && $summary['attendance_rate'] > 0) {
            $insights[] = [
                'type' => 'warning',
                'category' => 'Attendance',
                'title' => "{$childName}'s Attendance",
                'message' => "Attendance rate is {$summary['attendance_rate']}%. Regular attendance is important.",
                'action' => 'View Attendance',
                'priority' => 'medium'
            ];
        }
        
        // Fee Balance
        if ($summary['fee_balance'] > 0) {
            $balance = number_format($summary['fee_balance'], 2);
            $insights[] = [
                'type' => 'info',
                'category' => 'Finance',
                'title' => "Fee Due for {$childName}",
                'message' => "Outstanding balance: GHS {$balance}",
                'action' => 'Pay Now',
                'priority' => 'medium'
            ];
        }
    }
    
    // Sort by priority
    usort($insights, function($a, $b) {
        $priority = ['high' => 1, 'medium' => 2, 'low' => 3];
        return $priority[$a['priority']] - $priority[$b['priority']];
    });
    
    return $insights;
}

// ============================================
// PRINCIPAL DASHBOARD
// ============================================
function getPrincipalDashboard($pdo, $userId, $action) {
    $data = ['success' => true, 'role' => 'principal'];
    
    // School Overview
    $data['school_overview'] = getSchoolOverview($pdo);
    
    // Academic Summary
    $data['academic'] = getAcademicOverview($pdo);
    
    // Staff Summary
    $data['staff'] = getStaffSummary($pdo);
    
    // Student Summary
    $data['students'] = getStudentSummary($pdo);
    
    // Financial Summary
    $data['financial'] = getFinancialOverview($pdo);
    
    // Performance by Class
    $data['class_performance'] = getClassPerformance($pdo);
    
    // Teacher Performance
    $data['teacher_performance'] = getTeacherPerformance($pdo);
    
    // Recent Events
    $data['recent_events'] = getRecentEvents($pdo);
    
    // AI Insights
    $data['insights'] = generatePrincipalInsights($pdo, $data);
    
    // Charts
    $data['charts'] = getPrincipalCharts($pdo);
    
    return $data;
}

function getSchoolOverview($pdo) {
    $overview = [];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
    $overview['total_students'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
    $overview['total_staff'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM teachers WHERE status = 'active'");
    $overview['total_teachers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM classes");
    $overview['total_classes'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM subjects WHERE status = 'active'");
    $overview['total_subjects'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
        FROM attendance WHERE date = ?
    ");
    $stmt->execute([$today]);
    $att = $stmt->fetch(PDO::FETCH_ASSOC);
    $overview['attendance_rate'] = $att['total'] > 0 ? round(($att['present'] / $att['total']) * 100, 1) : 0;
    
    return $overview;
}

function getStaffSummary($pdo) {
    $staff = [];
    $today = date('Y-m-d');
    
    $stmt = $pdo->query("
        SELECT d.department_name, COUNT(e.id) as count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
        GROUP BY d.id, d.department_name ORDER BY count DESC LIMIT 5
    ");
    $staff['by_department'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM employee_attendance WHERE attendance_date = ? AND status = 'present'");
    $stmt->execute([$today]);
    $staff['present_today'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'approved' AND ? BETWEEN start_date AND end_date");
    $stmt->execute([$today]);
    $staff['on_leave'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    return $staff;
}

function getStudentSummary($pdo) {
    $students = [];
    
    $stmt = $pdo->query("
        SELECT c.class_name, COUNT(s.id) as count FROM classes c
        LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
        GROUP BY c.id, c.class_name ORDER BY c.class_name
    ");
    $students['by_class'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->query("SELECT gender, COUNT(*) as count FROM students WHERE status = 'active' GROUP BY gender");
    $students['by_gender'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM students WHERE DATE_FORMAT(created_at, '%Y-%m') = ?");
    $stmt->execute([date('Y-m')]);
    $students['new_admissions'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    return $students;
}

function getClassPerformance($pdo) {
    $stmt = $pdo->query("
        SELECT c.class_name, COUNT(DISTINCT s.id) as student_count,
            ROUND(AVG(g.marks_obtained), 1) as avg_marks_obtained,
            ROUND(SUM(CASE WHEN g.marks_obtained >= 50 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(g.id), 0), 1) as pass_rate
        FROM classes c
        LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
        LEFT JOIN grades g ON g.student_id = s.id AND g.marks_obtained IS NOT NULL
        GROUP BY c.id, c.class_name ORDER BY avg_marks_obtained DESC
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getTeacherPerformance($pdo) {
    $stmt = $pdo->query("
        SELECT CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
            COUNT(DISTINCT ts.subject_id) as subjects_taught,
            COUNT(DISTINCT c.id) as classes_assigned
        FROM teachers t
        LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
        LEFT JOIN classes c ON c.class_teacher_id = t.id
        WHERE t.status = 'active'
        GROUP BY t.id, t.first_name, t.last_name ORDER BY subjects_taught DESC LIMIT 10
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getRecentEvents($pdo) {
    $events = [];
    $stmt = $pdo->query("SELECT 'admission' as type, CONCAT('New student: ', first_name, ' ', last_name) as description, created_at as date FROM students ORDER BY created_at DESC LIMIT 3");
    $events = array_merge($events, $stmt->fetchAll(PDO::FETCH_ASSOC));
    $stmt = $pdo->query("SELECT 'staff' as type, CONCAT('New staff: ', first_name, ' ', last_name) as description, created_at as date FROM employees ORDER BY created_at DESC LIMIT 3");
    $events = array_merge($events, $stmt->fetchAll(PDO::FETCH_ASSOC));
    usort($events, function($a, $b) { return strtotime($b['date']) - strtotime($a['date']); });
    return array_slice($events, 0, 5);
}

function generatePrincipalInsights($pdo, $data) {
    $insights = [];
    
    if ($data['academic']['pass_rate'] < 70 && $data['academic']['pass_rate'] > 0) {
        $insights[] = ['type' => 'warning', 'category' => 'Academic', 'title' => 'Pass Rate Below Target', 'message' => "School pass rate is {$data['academic']['pass_rate']}%. Target is 70%.", 'action' => 'Review Academic Plan', 'priority' => 'high'];
    }
    if ($data['school_overview']['attendance_rate'] < 85 && $data['school_overview']['attendance_rate'] > 0) {
        $insights[] = ['type' => 'warning', 'category' => 'Attendance', 'title' => 'Low Attendance Rate', 'message' => "Today's attendance is {$data['school_overview']['attendance_rate']}%.", 'action' => 'Investigate', 'priority' => 'medium'];
    }
    if ($data['staff']['on_leave'] > 5) {
        $insights[] = ['type' => 'info', 'category' => 'Staff', 'title' => 'Multiple Staff on Leave', 'message' => "{$data['staff']['on_leave']} staff members are on leave today.", 'action' => 'Check Coverage', 'priority' => 'medium'];
    }
    if ($data['financial']['collection_rate'] < 75) {
        $insights[] = ['type' => 'warning', 'category' => 'Finance', 'title' => 'Fee Collection Below Target', 'message' => "Collection rate is {$data['financial']['collection_rate']}%.", 'action' => 'Review Collections', 'priority' => 'high'];
    }
    if ($data['academic']['pass_rate'] >= 85) {
        $insights[] = ['type' => 'success', 'category' => 'Academic', 'title' => 'Excellent Performance', 'message' => "School pass rate is {$data['academic']['pass_rate']}%!", 'action' => null, 'priority' => 'low'];
    }
    if ($data['students']['new_admissions'] > 0) {
        $insights[] = ['type' => 'info', 'category' => 'Admissions', 'title' => 'New Students', 'message' => "{$data['students']['new_admissions']} new students this month.", 'action' => 'View Details', 'priority' => 'low'];
    }
    
    usort($insights, function($a, $b) { $p = ['high' => 1, 'medium' => 2, 'low' => 3]; return $p[$a['priority']] - $p[$b['priority']]; });
    return $insights;
}

function getPrincipalCharts($pdo) {
    $charts = [];
    
    $charts['enrollment'] = [];
    for ($i = 5; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM students WHERE DATE_FORMAT(created_at, '%Y-%m') <= ?");
        $stmt->execute([$month]);
        $charts['enrollment'][] = ['month' => date('M Y', strtotime("-$i months")), 'count' => intval($stmt->fetch(PDO::FETCH_ASSOC)['count'])];
    }
    
    $stmt = $pdo->query("
        SELECT CASE WHEN marks_obtained >= 80 THEN 'Excellent' WHEN marks_obtained >= 70 THEN 'Very Good' WHEN marks_obtained >= 60 THEN 'Good' WHEN marks_obtained >= 50 THEN 'Average' ELSE 'Below Average' END as grade, COUNT(*) as count
        FROM grades WHERE marks_obtained IS NOT NULL GROUP BY grade
    ");
    $charts['grade_distribution'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return $charts;
}

// ============================================
// HR DASHBOARD
// ============================================
function getHRDashboard($pdo, $userId, $action) {
    $data = ['success' => true, 'role' => 'hr'];
    $data['employees'] = getEmployeeOverview($pdo);
    $data['attendance'] = getHRAttendanceSummary($pdo);
    $data['leave'] = getLeaveManagement($pdo);
    $data['payroll'] = getPayrollSummary($pdo);
    $data['departments'] = getDepartmentStats($pdo);
    $data['activities'] = getHRActivities($pdo);
    $data['insights'] = generateHRInsights($pdo, $data);
    $data['charts'] = getHRCharts($pdo);
    return $data;
}

function getEmployeeOverview($pdo) {
    $employees = [];
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
    $employees['total'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM employees GROUP BY status");
    $employees['by_status'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt = $pdo->query("SELECT employment_type, COUNT(*) as count FROM employees WHERE status = 'active' GROUP BY employment_type");
    $employees['by_type'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM employees WHERE DATE_FORMAT(join_date, '%Y-%m') = ?");
    $stmt->execute([date('Y-m')]);
    $employees['new_hires'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM teachers WHERE status = 'active'");
    $employees['teachers'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    return $employees;
}

function getHRAttendanceSummary($pdo) {
    $attendance = [];
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present, SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent, SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late FROM employee_attendance WHERE attendance_date = ?");
    $stmt->execute([$today]);
    $attendance['today'] = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT attendance_date) as days, AVG(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100 as avg_rate FROM employee_attendance WHERE DATE_FORMAT(attendance_date, '%Y-%m') = ?");
    $stmt->execute([date('Y-m')]);
    $attendance['monthly'] = $stmt->fetch(PDO::FETCH_ASSOC);
    return $attendance;
}

function getLeaveManagement($pdo) {
    $leave = [];
    $today = date('Y-m-d');
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'pending'");
    $leave['pending'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'approved' AND DATE_FORMAT(applied_date, '%Y-%m') = ?");
    $stmt->execute([date('Y-m')]);
    $leave['approved_this_month'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'approved' AND ? BETWEEN start_date AND end_date");
    $stmt->execute([$today]);
    $leave['on_leave_today'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    $stmt = $pdo->query("SELECT lt.leave_type_name as leave_type, COUNT(*) as count FROM leave_applications la JOIN leave_types lt ON la.leave_type_id = lt.id WHERE la.status = 'approved' GROUP BY lt.id, lt.leave_type_name");
    $leave['by_type'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt = $pdo->query("SELECT la.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, lt.leave_type_name as leave_type FROM leave_applications la JOIN employees e ON la.employee_id = e.id JOIN leave_types lt ON la.leave_type_id = lt.id ORDER BY la.applied_date DESC LIMIT 5");
    $leave['recent'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $leave;
}

function getPayrollSummary($pdo) {
    $payroll = [];
    $currentMonth = date('Y-m');
    $stmt = $pdo->prepare("SELECT COUNT(*) as employee_count, COALESCE(SUM(basic_salary), 0) as total_basic, COALESCE(SUM(total_earnings), 0) as total_earnings, COALESCE(SUM(total_deductions), 0) as total_deductions, COALESCE(SUM(net_salary), 0) as total_net FROM payroll WHERE payroll_month = ?");
    $stmt->execute([$currentMonth]);
    $payroll['current_month'] = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare("SELECT status, COUNT(*) as count, SUM(net_salary) as total FROM payroll WHERE payroll_month = ? GROUP BY status");
    $stmt->execute([$currentMonth]);
    $payroll['by_status'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare("SELECT COUNT(*) as count, COALESCE(SUM(net_salary), 0) as total FROM payroll WHERE payroll_month = ? AND status = 'processed'");
    $stmt->execute([$currentMonth]);
    $payroll['pending_payment'] = $stmt->fetch(PDO::FETCH_ASSOC);
    return $payroll;
}

function getDepartmentStats($pdo) {
    $stmt = $pdo->query("SELECT d.department_name, COUNT(e.id) as employee_count, COALESCE(SUM(e.basic_salary), 0) as total_salary FROM departments d LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active' GROUP BY d.id, d.department_name ORDER BY employee_count DESC");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getHRActivities($pdo) {
    $activities = [];
    $stmt = $pdo->query("SELECT 'leave' as type, CONCAT(e.first_name, ' ', e.last_name, ' applied for ', lt.leave_type_name, ' leave') as description, la.applied_date as date, la.status FROM leave_applications la JOIN employees e ON la.employee_id = e.id JOIN leave_types lt ON la.leave_type_id = lt.id ORDER BY la.applied_date DESC LIMIT 5");
    $activities = array_merge($activities, $stmt->fetchAll(PDO::FETCH_ASSOC));
    usort($activities, function($a, $b) { return strtotime($b['date']) - strtotime($a['date']); });
    return array_slice($activities, 0, 8);
}

function generateHRInsights($pdo, $data) {
    $insights = [];
    if ($data['leave']['pending'] > 0) {
        $insights[] = ['type' => 'warning', 'category' => 'Leave', 'title' => 'Pending Leave Requests', 'message' => "{$data['leave']['pending']} leave applications awaiting approval.", 'action' => 'Review Now', 'priority' => 'high'];
    }
    if ($data['payroll']['pending_payment']['count'] > 0) {
        $total = number_format($data['payroll']['pending_payment']['total'], 2);
        $insights[] = ['type' => 'warning', 'category' => 'Payroll', 'title' => 'Payroll Pending Payment', 'message' => "{$data['payroll']['pending_payment']['count']} employees pending (GHS {$total}).", 'action' => 'Process Payments', 'priority' => 'high'];
    }
    $attendanceRate = $data['attendance']['today']['total'] > 0 ? round(($data['attendance']['today']['present'] / $data['attendance']['today']['total']) * 100, 1) : 0;
    if ($attendanceRate < 90 && $attendanceRate > 0) {
        $insights[] = ['type' => 'info', 'category' => 'Attendance', 'title' => 'Attendance Update', 'message' => "Today's attendance rate is {$attendanceRate}%.", 'action' => 'View Details', 'priority' => 'medium'];
    }
    if ($data['leave']['on_leave_today'] > 0) {
        $insights[] = ['type' => 'info', 'category' => 'Leave', 'title' => 'Staff on Leave Today', 'message' => "{$data['leave']['on_leave_today']} employees on leave.", 'action' => 'View List', 'priority' => 'low'];
    }
    if ($data['employees']['new_hires'] > 0) {
        $insights[] = ['type' => 'success', 'category' => 'Recruitment', 'title' => 'New Team Members', 'message' => "{$data['employees']['new_hires']} new employees this month.", 'action' => 'Welcome Them', 'priority' => 'low'];
    }
    usort($insights, function($a, $b) { $p = ['high' => 1, 'medium' => 2, 'low' => 3]; return $p[$a['priority']] - $p[$b['priority']]; });
    return $insights;
}

function getHRCharts($pdo) {
    $charts = [];
    $charts['attendance'] = [];
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $stmt = $pdo->prepare("SELECT COUNT(CASE WHEN status = 'present' THEN 1 END) as present, COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent FROM employee_attendance WHERE attendance_date = ?");
        $stmt->execute([$date]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $charts['attendance'][] = ['day' => date('D', strtotime("-$i days")), 'present' => intval($result['present']), 'absent' => intval($result['absent'])];
    }
    $charts['payroll'] = [];
    for ($i = 5; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(net_salary), 0) as total FROM payroll WHERE payroll_month = ?");
        $stmt->execute([$month]);
        $charts['payroll'][] = ['month' => date('M', strtotime("-$i months")), 'amount' => floatval($stmt->fetch(PDO::FETCH_ASSOC)['total'])];
    }
    $stmt = $pdo->query("SELECT lt.leave_type_name as leave_type, COUNT(*) as count FROM leave_applications la JOIN leave_types lt ON la.leave_type_id = lt.id WHERE YEAR(la.applied_date) = YEAR(CURDATE()) GROUP BY lt.id, lt.leave_type_name");
    $charts['leave_types'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $charts;
}

// ============================================
// FINANCE DASHBOARD
// ============================================
function getFinanceDashboard($pdo, $userId, $action) {
    $data = ['success' => true, 'role' => 'finance'];
    $data['revenue'] = getRevenueOverview($pdo);
    $data['fees'] = getFeeCollection($pdo);
    $data['expenses'] = getExpensesSummary($pdo);
    $data['outstanding'] = getOutstandingPayments($pdo);
    $data['transactions'] = getRecentTransactions($pdo);
    $data['debtors'] = getDebtorsList($pdo);
    $data['insights'] = generateFinanceInsights($pdo, $data);
    $data['charts'] = getFinanceCharts($pdo);
    return $data;
}

function getRevenueOverview($pdo) {
    $revenue = [];
    $currentMonth = date('Y-m');
    $lastMonth = date('Y-m', strtotime('-1 month'));
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payments WHERE DATE_FORMAT(payment_date, '%Y-%m') = ?");
    $stmt->execute([$currentMonth]);
    $revenue['this_month'] = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->execute([$lastMonth]);
    $revenue['last_month'] = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payments WHERE YEAR(payment_date) = ?");
    $stmt->execute([date('Y')]);
    $revenue['this_year'] = $stmt->fetch(PDO::FETCH_ASSOC);
    $thisMonthTotal = floatval($revenue['this_month']['total']);
    $lastMonthTotal = floatval($revenue['last_month']['total']);
    $revenue['growth_rate'] = $lastMonthTotal > 0 ? round((($thisMonthTotal - $lastMonthTotal) / $lastMonthTotal) * 100, 1) : 0;
    return $revenue;
}

function getFeeCollection($pdo) {
    $fees = [];
    $stmt = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices");
    $fees['total_invoiced'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $stmt = $pdo->query("SELECT COALESCE(SUM(paid_amount), 0) as total FROM invoices");
    $fees['total_collected'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $stmt = $pdo->query("SELECT COALESCE(SUM(balance), 0) as total FROM invoices WHERE balance > 0");
    $fees['outstanding'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $fees['collection_rate'] = $fees['total_invoiced'] > 0 ? round(($fees['total_collected'] / $fees['total_invoiced']) * 100, 1) : 0;
    $stmt = $pdo->query("SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM invoices GROUP BY status");
    $fees['by_status'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $fees;
}

function getExpensesSummary($pdo) {
    $expenses = [];
    $currentMonth = date('Y-m');
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(net_salary), 0) as total FROM payroll WHERE payroll_month = ?");
    $stmt->execute([$currentMonth]);
    $expenses['payroll'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_earnings), 0) as earnings, COALESCE(SUM(total_deductions), 0) as deductions FROM payroll WHERE payroll_month = ?");
    $stmt->execute([$currentMonth]);
    $expenses['breakdown'] = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt = $pdo->prepare("SELECT SUM(CASE WHEN status = 'paid' THEN net_salary ELSE 0 END) as paid, SUM(CASE WHEN status != 'paid' THEN net_salary ELSE 0 END) as pending FROM payroll WHERE payroll_month = ?");
    $stmt->execute([$currentMonth]);
    $expenses['payment_status'] = $stmt->fetch(PDO::FETCH_ASSOC);
    return $expenses;
}

function getOutstandingPayments($pdo) {
    $outstanding = [];
    $stmt = $pdo->query("SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as total FROM invoices WHERE balance > 0");
    $outstanding['summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt = $pdo->query("SELECT CASE WHEN DATEDIFF(CURDATE(), due_date) <= 30 THEN '0-30 days' WHEN DATEDIFF(CURDATE(), due_date) <= 60 THEN '31-60 days' WHEN DATEDIFF(CURDATE(), due_date) <= 90 THEN '61-90 days' ELSE '90+ days' END as age_bracket, COUNT(*) as count, COALESCE(SUM(balance), 0) as total FROM invoices WHERE balance > 0 AND due_date IS NOT NULL GROUP BY age_bracket");
    $outstanding['by_age'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $outstanding;
}

function getRecentTransactions($pdo) {
    $stmt = $pdo->query("SELECT p.id, p.amount, p.payment_method, p.payment_date, p.reference_number, CONCAT(s.first_name, ' ', s.last_name) as student_name, i.invoice_number FROM payments p LEFT JOIN invoices i ON p.invoice_id = i.id LEFT JOIN students s ON i.student_id = s.id ORDER BY p.payment_date DESC LIMIT 10");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getDebtorsList($pdo) {
    $stmt = $pdo->query("SELECT s.admission_number, CONCAT(s.first_name, ' ', s.last_name) as student_name, c.class_name, COALESCE(SUM(i.balance), 0) as total_owed, MAX(i.due_date) as oldest_due FROM students s JOIN invoices i ON i.student_id = s.id AND i.balance > 0 LEFT JOIN classes c ON s.class_id = c.id GROUP BY s.id, s.admission_number, s.first_name, s.last_name, c.class_name ORDER BY total_owed DESC LIMIT 10");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function generateFinanceInsights($pdo, $data) {
    $insights = [];
    if ($data['fees']['collection_rate'] < 70) {
        $insights[] = ['type' => 'warning', 'category' => 'Collections', 'title' => 'Low Collection Rate', 'message' => "Fee collection rate is {$data['fees']['collection_rate']}%. Target is 85%.", 'action' => 'Send Reminders', 'priority' => 'high'];
    }
    if ($data['outstanding']['summary']['total'] > 50000) {
        $total = number_format($data['outstanding']['summary']['total'], 2);
        $insights[] = ['type' => 'alert', 'category' => 'Outstanding', 'title' => 'High Outstanding Fees', 'message' => "GHS {$total} in outstanding fees.", 'action' => 'View Debtors', 'priority' => 'high'];
    }
    if ($data['revenue']['growth_rate'] > 10) {
        $insights[] = ['type' => 'success', 'category' => 'Revenue', 'title' => 'Revenue Growing', 'message' => "Revenue increased by {$data['revenue']['growth_rate']}%.", 'action' => null, 'priority' => 'low'];
    } elseif ($data['revenue']['growth_rate'] < -10) {
        $insights[] = ['type' => 'warning', 'category' => 'Revenue', 'title' => 'Revenue Declining', 'message' => "Revenue decreased by " . abs($data['revenue']['growth_rate']) . "%.", 'action' => 'Analyze', 'priority' => 'medium'];
    }
    if (($data['expenses']['payment_status']['pending'] ?? 0) > 0) {
        $pending = number_format($data['expenses']['payment_status']['pending'], 2);
        $insights[] = ['type' => 'info', 'category' => 'Payroll', 'title' => 'Payroll Pending', 'message' => "GHS {$pending} in payroll awaiting payment.", 'action' => 'Process', 'priority' => 'medium'];
    }
    if ($data['fees']['collection_rate'] >= 90) {
        $insights[] = ['type' => 'success', 'category' => 'Collections', 'title' => 'Excellent Collection', 'message' => "Collection rate is {$data['fees']['collection_rate']}%!", 'action' => null, 'priority' => 'low'];
    }
    usort($insights, function($a, $b) { $p = ['high' => 1, 'medium' => 2, 'low' => 3]; return $p[$a['priority']] - $p[$b['priority']]; });
    return $insights;
}

function getFinanceCharts($pdo) {
    $charts = [];
    $charts['revenue'] = [];
    for ($i = 11; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE_FORMAT(payment_date, '%Y-%m') = ?");
        $stmt->execute([$month]);
        $charts['revenue'][] = ['month' => date('M', strtotime("-$i months")), 'amount' => floatval($stmt->fetch(PDO::FETCH_ASSOC)['total'])];
    }
    $stmt = $pdo->query("SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE YEAR(payment_date) = YEAR(CURDATE()) GROUP BY payment_method");
    $charts['payment_methods'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $charts['fee_vs_payroll'] = [];
    for ($i = 5; $i >= 0; $i--) {
        $month = date('Y-m', strtotime("-$i months"));
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE_FORMAT(payment_date, '%Y-%m') = ?");
        $stmt->execute([$month]);
        $fees = floatval($stmt->fetch(PDO::FETCH_ASSOC)['total']);
        $stmt = $pdo->prepare("SELECT COALESCE(SUM(net_salary), 0) as total FROM payroll WHERE payroll_month = ?");
        $stmt->execute([$month]);
        $payroll = floatval($stmt->fetch(PDO::FETCH_ASSOC)['total']);
        $charts['fee_vs_payroll'][] = ['month' => date('M', strtotime("-$i months")), 'fees' => $fees, 'payroll' => $payroll];
    }
    return $charts;
}

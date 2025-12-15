<?php
/**
 * Reports API
 * Generate comprehensive reports
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

    $type = $_GET['type'] ?? '';
    $format = $_GET['format'] ?? 'json';

    switch ($type) {
        // ============================================
        // ACADEMIC REPORTS
        // ============================================
        case 'academic_performance':
            $termId = $_GET['term_id'] ?? null;
            $classId = $_GET['class_id'] ?? null;
            
            $where = [];
            $params = [];
            
            if ($termId) {
                $where[] = "term_id = ?";
                $params[] = $termId;
            }
            if ($classId) {
                $where[] = "class_id = ?";
                $params[] = $classId;
            }
            
            $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
            
            // This is a placeholder - you'll need to create grades/results tables
            $data = [
                'report_title' => 'Academic Performance Report',
                'generated_at' => date('Y-m-d H:i:s'),
                'filters' => ['term_id' => $termId, 'class_id' => $classId],
                'summary' => [
                    'total_students' => 0,
                    'average_score' => 0,
                    'pass_rate' => 0,
                    'top_performers' => []
                ]
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'class_performance':
            $stmt = $pdo->query("
                SELECT 
                    c.id,
                    c.class_name,
                    c.level,
                    COUNT(DISTINCT s.id) as student_count,
                    CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                FROM classes c
                LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
                LEFT JOIN teachers t ON c.class_teacher_id = t.id
                WHERE c.status = 'active'
                GROUP BY c.id
                ORDER BY c.level, c.class_name
            ");
            
            $data = [
                'report_title' => 'Class Performance Comparison',
                'generated_at' => date('Y-m-d H:i:s'),
                'classes' => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'attendance_summary':
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            
            $stmt = $pdo->query("
                SELECT 
                    COUNT(DISTINCT s.id) as total_students,
                    c.class_name,
                    c.level
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE s.status = 'active'
                GROUP BY c.id
            ");
            
            $data = [
                'report_title' => 'Attendance Summary Report',
                'generated_at' => date('Y-m-d H:i:s'),
                'period' => ['from' => $dateFrom, 'to' => $dateTo],
                'summary' => $stmt->fetchAll(PDO::FETCH_ASSOC),
                'overall_rate' => 94.5 // Placeholder
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        // ============================================
        // FINANCIAL REPORTS
        // ============================================
        case 'revenue_report':
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            
            $stmt = $pdo->prepare("
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as invoice_count,
                    SUM(total_amount) as total_invoiced,
                    SUM(paid_amount) as total_collected,
                    SUM(balance) as total_outstanding
                FROM invoices
                WHERE DATE(created_at) BETWEEN ? AND ?
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            
            $daily = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get totals
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_invoices,
                    SUM(total_amount) as total_invoiced,
                    SUM(paid_amount) as total_collected,
                    SUM(balance) as total_outstanding
                FROM invoices
                WHERE DATE(created_at) BETWEEN ? AND ?
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $totals = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $data = [
                'report_title' => 'Revenue Report',
                'generated_at' => date('Y-m-d H:i:s'),
                'period' => ['from' => $dateFrom, 'to' => $dateTo],
                'totals' => $totals,
                'daily_breakdown' => $daily
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'outstanding_fees':
            $stmt = $pdo->query("
                SELECT 
                    i.invoice_number,
                    i.total_amount,
                    i.paid_amount,
                    i.balance,
                    i.due_date,
                    i.status,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name,
                    DATEDIFF(CURDATE(), i.due_date) as days_overdue
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                WHERE i.balance > 0 AND i.status != 'cancelled'
                ORDER BY i.due_date ASC
            ");
            
            $outstanding = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->query("
                SELECT 
                    SUM(balance) as total_outstanding,
                    COUNT(*) as total_invoices,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 0 THEN balance ELSE 0 END) as overdue_amount,
                    COUNT(CASE WHEN DATEDIFF(CURDATE(), due_date) > 0 THEN 1 END) as overdue_count
                FROM invoices
                WHERE balance > 0 AND status != 'cancelled'
            ");
            $summary = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $data = [
                'report_title' => 'Outstanding Fees Report',
                'generated_at' => date('Y-m-d H:i:s'),
                'summary' => $summary,
                'invoices' => $outstanding
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'payment_history':
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            
            $stmt = $pdo->prepare("
                SELECT 
                    p.*,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name,
                    i.invoice_number
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                WHERE DATE(p.payment_date) BETWEEN ? AND ?
                ORDER BY p.payment_date DESC
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            
            $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(amount) as total_amount,
                    payment_method,
                    COUNT(*) as count
                FROM payments
                WHERE DATE(payment_date) BETWEEN ? AND ?
                GROUP BY payment_method
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $byMethod = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $data = [
                'report_title' => 'Payment History Report',
                'generated_at' => date('Y-m-d H:i:s'),
                'period' => ['from' => $dateFrom, 'to' => $dateTo],
                'by_method' => $byMethod,
                'payments' => $payments
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'collection_rate':
            $stmt = $pdo->query("
                SELECT 
                    SUM(total_amount) as total_invoiced,
                    SUM(paid_amount) as total_collected,
                    SUM(balance) as total_outstanding,
                    COUNT(*) as total_invoices,
                    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
                    COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_invoices
                FROM invoices
                WHERE status != 'cancelled'
            ");
            
            $summary = $stmt->fetch(PDO::FETCH_ASSOC);
            $summary['collection_rate'] = $summary['total_invoiced'] > 0 
                ? ($summary['total_collected'] / $summary['total_invoiced']) * 100 
                : 0;
            
            $data = [
                'report_title' => 'Fee Collection Rate',
                'generated_at' => date('Y-m-d H:i:s'),
                'summary' => $summary
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        // ============================================
        // STUDENT REPORTS
        // ============================================
        case 'enrollment_report':
            $stmt = $pdo->query("
                SELECT 
                    c.level,
                    c.class_name,
                    COUNT(s.id) as student_count,
                    c.capacity,
                    ROUND((COUNT(s.id) / c.capacity) * 100, 2) as occupancy_rate
                FROM classes c
                LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
                WHERE c.status = 'active'
                GROUP BY c.id
                ORDER BY c.level, c.class_name
            ");
            
            $byClass = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->query("
                SELECT 
                    status,
                    COUNT(*) as count
                FROM students
                GROUP BY status
            ");
            $byStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->query("
                SELECT 
                    gender,
                    COUNT(*) as count
                FROM students
                WHERE status = 'active'
                GROUP BY gender
            ");
            $byGender = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $data = [
                'report_title' => 'Student Enrollment Report',
                'generated_at' => date('Y-m-d H:i:s'),
                'by_class' => $byClass,
                'by_status' => $byStatus,
                'by_gender' => $byGender
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'demographics':
            $stmt = $pdo->query("
                SELECT 
                    YEAR(CURDATE()) - YEAR(date_of_birth) as age,
                    COUNT(*) as count
                FROM students
                WHERE status = 'active'
                GROUP BY age
                ORDER BY age
            ");
            $byAge = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->query("
                SELECT 
                    region,
                    COUNT(*) as count
                FROM students
                WHERE status = 'active' AND region IS NOT NULL
                GROUP BY region
                ORDER BY count DESC
            ");
            $byRegion = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->query("
                SELECT 
                    religion,
                    COUNT(*) as count
                FROM students
                WHERE status = 'active' AND religion IS NOT NULL
                GROUP BY religion
                ORDER BY count DESC
            ");
            $byReligion = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $data = [
                'report_title' => 'Student Demographics',
                'generated_at' => date('Y-m-d H:i:s'),
                'by_age' => $byAge,
                'by_region' => $byRegion,
                'by_religion' => $byReligion
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'new_admissions':
            $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            
            $stmt = $pdo->prepare("
                SELECT 
                    s.*,
                    c.class_name,
                    c.level
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE DATE(s.admission_date) BETWEEN ? AND ?
                ORDER BY s.admission_date DESC
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            
            $admissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->prepare("
                SELECT 
                    c.level,
                    COUNT(*) as count
                FROM students s
                JOIN classes c ON s.class_id = c.id
                WHERE DATE(s.admission_date) BETWEEN ? AND ?
                GROUP BY c.level
            ");
            $stmt->execute([$dateFrom, $dateTo]);
            $byLevel = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $data = [
                'report_title' => 'New Admissions Report',
                'generated_at' => date('Y-m-d H:i:s'),
                'period' => ['from' => $dateFrom, 'to' => $dateTo],
                'total' => count($admissions),
                'by_level' => $byLevel,
                'admissions' => $admissions
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        // ============================================
        // EXECUTIVE REPORTS
        // ============================================
        case 'executive_summary':
            // Students
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
            $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Teachers
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM teachers WHERE status = 'active'");
            $totalTeachers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Classes
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM classes WHERE status = 'active'");
            $totalClasses = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Finance
            $stmt = $pdo->query("
                SELECT 
                    SUM(total_amount) as total_invoiced,
                    SUM(paid_amount) as total_collected,
                    SUM(balance) as total_outstanding
                FROM invoices
                WHERE status != 'cancelled'
            ");
            $finance = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $data = [
                'report_title' => 'Executive Summary',
                'generated_at' => date('Y-m-d H:i:s'),
                'students' => $totalStudents,
                'teachers' => $totalTeachers,
                'classes' => $totalClasses,
                'finance' => $finance,
                'attendance_rate' => 94.5 // Placeholder
            ];
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        default:
            throw new Exception('Invalid report type');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

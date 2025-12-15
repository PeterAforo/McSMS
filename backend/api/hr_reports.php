<?php
/**
 * HR Reports API
 * Generate comprehensive HR reports
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

require_once dirname(dirname(__DIR__)) . '/config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $reportType = $_GET['type'] ?? '';
    $month = $_GET['month'] ?? date('Y-m');
    $format = $_GET['format'] ?? 'json'; // json, pdf, excel

    switch ($reportType) {
        case 'payroll_summary':
            $report = generatePayrollSummary($pdo, $month);
            break;
        
        case 'attendance_report':
            $report = generateAttendanceReport($pdo, $month);
            break;
        
        case 'leave_report':
            $report = generateLeaveReport($pdo, $month);
            break;
        
        case 'salary_slips':
            $report = generateSalarySlips($pdo, $month);
            break;
        
        case 'employee_report':
            $report = generateEmployeeReport($pdo);
            break;
        
        default:
            throw new Exception('Invalid report type');
    }

    if ($format === 'json') {
        echo json_encode(['success' => true, 'report' => $report]);
    } elseif ($format === 'pdf') {
        // Generate PDF (requires TCPDF or similar library)
        generatePDF($report, $reportType);
    } elseif ($format === 'excel') {
        // Generate Excel (requires PhpSpreadsheet)
        generateExcel($report, $reportType);
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// REPORT GENERATION FUNCTIONS
// ============================================

function generatePayrollSummary($pdo, $month) {
    $stmt = $pdo->prepare("
        SELECT 
            p.*,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            e.employee_number,
            d.department_name,
            des.designation_name
        FROM payroll p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN designations des ON e.designation_id = des.id
        WHERE p.payroll_month = ?
        ORDER BY d.department_name, e.first_name
    ");
    $stmt->execute([$month]);
    $payroll = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get payroll details for each
    foreach ($payroll as &$p) {
        $stmt = $pdo->prepare("
            SELECT 
                pd.*,
                sc.component_name,
                sc.component_type
            FROM payroll_details pd
            JOIN salary_components sc ON pd.component_id = sc.id
            WHERE pd.payroll_id = ?
            ORDER BY sc.component_type, sc.component_name
        ");
        $stmt->execute([$p['id']]);
        $p['details'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Calculate totals
    $summary = [
        'month' => $month,
        'total_employees' => count($payroll),
        'total_basic_salary' => array_sum(array_column($payroll, 'basic_salary')),
        'total_earnings' => array_sum(array_column($payroll, 'total_earnings')),
        'total_deductions' => array_sum(array_column($payroll, 'total_deductions')),
        'total_gross_salary' => array_sum(array_column($payroll, 'gross_salary')),
        'total_net_salary' => array_sum(array_column($payroll, 'net_salary')),
        'payroll' => $payroll
    ];

    return $summary;
}

function generateAttendanceReport($pdo, $month) {
    $startDate = $month . '-01';
    $endDate = date('Y-m-t', strtotime($startDate));

    $stmt = $pdo->prepare("
        SELECT 
            e.id,
            e.employee_number,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            d.department_name,
            COUNT(CASE WHEN ea.status = 'present' THEN 1 END) as present_days,
            COUNT(CASE WHEN ea.status = 'absent' THEN 1 END) as absent_days,
            COUNT(CASE WHEN ea.status = 'late' THEN 1 END) as late_days,
            COUNT(CASE WHEN ea.status = 'half_day' THEN 1 END) as half_days,
            COUNT(CASE WHEN ea.status = 'on_leave' THEN 1 END) as leave_days,
            SUM(ea.working_hours) as total_hours,
            AVG(ea.working_hours) as avg_hours
        FROM employees e
        LEFT JOIN employee_attendance ea ON e.id = ea.employee_id 
            AND ea.attendance_date BETWEEN ? AND ?
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.status = 'active'
        GROUP BY e.id
        ORDER BY d.department_name, e.first_name
    ");
    $stmt->execute([$startDate, $endDate]);
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get detailed attendance for each employee
    foreach ($attendance as &$emp) {
        $stmt = $pdo->prepare("
            SELECT 
                attendance_date,
                check_in_time,
                check_out_time,
                working_hours,
                status,
                remarks
            FROM employee_attendance
            WHERE employee_id = ? AND attendance_date BETWEEN ? AND ?
            ORDER BY attendance_date
        ");
        $stmt->execute([$emp['id'], $startDate, $endDate]);
        $emp['daily_attendance'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    return [
        'month' => $month,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'total_employees' => count($attendance),
        'attendance' => $attendance
    ];
}

function generateLeaveReport($pdo, $month) {
    $startDate = $month . '-01';
    $endDate = date('Y-m-t', strtotime($startDate));

    $stmt = $pdo->prepare("
        SELECT 
            la.*,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            e.employee_number,
            d.department_name,
            lt.leave_type_name,
            CONCAT(u.name) as approved_by_name
        FROM leave_applications la
        JOIN employees e ON la.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        JOIN leave_types lt ON la.leave_type_id = lt.id
        LEFT JOIN users u ON la.approved_by = u.id
        WHERE (la.start_date BETWEEN ? AND ?) 
           OR (la.end_date BETWEEN ? AND ?)
        ORDER BY la.applied_date DESC
    ");
    $stmt->execute([$startDate, $endDate, $startDate, $endDate]);
    $leaves = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get leave balance for each employee
    $stmt = $pdo->query("
        SELECT 
            e.id,
            e.employee_number,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            e.annual_leave_days,
            e.sick_leave_days,
            e.casual_leave_days,
            COALESCE(SUM(CASE WHEN la.leave_type_id = 1 AND la.status = 'approved' THEN la.total_days ELSE 0 END), 0) as annual_used,
            COALESCE(SUM(CASE WHEN la.leave_type_id = 2 AND la.status = 'approved' THEN la.total_days ELSE 0 END), 0) as sick_used,
            COALESCE(SUM(CASE WHEN la.leave_type_id = 3 AND la.status = 'approved' THEN la.total_days ELSE 0 END), 0) as casual_used
        FROM employees e
        LEFT JOIN leave_applications la ON e.id = la.employee_id 
            AND YEAR(la.start_date) = YEAR(CURDATE())
        WHERE e.status = 'active'
        GROUP BY e.id
    ");
    $balances = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return [
        'month' => $month,
        'total_applications' => count($leaves),
        'pending' => count(array_filter($leaves, fn($l) => $l['status'] === 'pending')),
        'approved' => count(array_filter($leaves, fn($l) => $l['status'] === 'approved')),
        'rejected' => count(array_filter($leaves, fn($l) => $l['status'] === 'rejected')),
        'applications' => $leaves,
        'balances' => $balances
    ];
}

function generateSalarySlips($pdo, $month) {
    // Check if employee_id is provided
    $employeeId = isset($_GET['employee_id']) ? $_GET['employee_id'] : null;
    
    $sql = "
        SELECT 
            p.*,
            e.employee_number,
            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
            e.email,
            e.phone,
            e.address,
            e.bank_name,
            e.bank_account_number,
            d.department_name,
            des.designation_name
        FROM payroll p
        JOIN employees e ON p.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN designations des ON e.designation_id = des.id
        WHERE p.payroll_month = ?
    ";
    
    $params = [$month];
    
    if ($employeeId) {
        $sql .= " AND p.employee_id = ?";
        $params[] = $employeeId;
    }
    
    $sql .= " ORDER BY e.employee_number";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $slips = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($slips as &$slip) {
        // Get earnings
        $stmt = $pdo->prepare("
            SELECT 
                sc.component_name,
                pd.amount
            FROM payroll_details pd
            JOIN salary_components sc ON pd.component_id = sc.id
            WHERE pd.payroll_id = ? AND sc.component_type = 'earning'
            ORDER BY sc.component_name
        ");
        $stmt->execute([$slip['id']]);
        $slip['earnings'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get deductions
        $stmt = $pdo->prepare("
            SELECT 
                sc.component_name,
                pd.amount
            FROM payroll_details pd
            JOIN salary_components sc ON pd.component_id = sc.id
            WHERE pd.payroll_id = ? AND sc.component_type = 'deduction'
            ORDER BY sc.component_name
        ");
        $stmt->execute([$slip['id']]);
        $slip['deductions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add month for display
        $slip['month'] = $month;
        $slip['designation'] = $slip['designation_name'];
    }

    return $slips;
}

function generateEmployeeReport($pdo) {
    $stmt = $pdo->query("
        SELECT 
            e.*,
            d.department_name,
            des.designation_name,
            ec.category_name,
            CONCAT(sup.first_name, ' ', sup.last_name) as supervisor_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN designations des ON e.designation_id = des.id
        LEFT JOIN employee_categories ec ON e.category_id = ec.id
        LEFT JOIN employees sup ON e.supervisor_id = sup.id
        ORDER BY e.employee_number
    ");
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function generatePDF($data, $reportType) {
    // Implement PDF generation using TCPDF or similar
    // For now, return JSON with message
    echo json_encode([
        'success' => true,
        'message' => 'PDF generation not yet implemented',
        'data' => $data
    ]);
}

function generateExcel($data, $reportType) {
    // Implement Excel generation using PhpSpreadsheet
    // For now, return JSON with message
    echo json_encode([
        'success' => true,
        'message' => 'Excel generation not yet implemented',
        'data' => $data
    ]);
}

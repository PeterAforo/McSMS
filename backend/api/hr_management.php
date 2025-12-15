<?php
/**
 * Advanced HR Management API
 * Payroll, Leave Management, Performance Reviews, Employee Management
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create necessary tables
    createHRTables($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'list';
    $id = $_GET['id'] ?? null;

    switch ($action) {
        // ============================================
        // PAYROLL MANAGEMENT
        // ============================================
        case 'payroll':
            handlePayroll($pdo, $method, $id);
            break;
            
        case 'generate_payroll':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(generatePayroll($pdo, $data));
            break;
            
        case 'process_payroll':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(processPayroll($pdo, $data['payroll_id']));
            break;
            
        case 'salary_structure':
            handleSalaryStructure($pdo, $method, $id);
            break;
            
        case 'payslip':
            $employeeId = $_GET['employee_id'] ?? null;
            $month = $_GET['month'] ?? date('Y-m');
            echo json_encode(getPayslip($pdo, $employeeId, $month));
            break;

        // ============================================
        // LEAVE MANAGEMENT
        // ============================================
        case 'leave_types':
            handleLeaveTypes($pdo, $method, $id);
            break;
            
        case 'leave_requests':
            handleLeaveRequests($pdo, $method, $id);
            break;
            
        case 'apply_leave':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(applyLeave($pdo, $data));
            break;
            
        case 'approve_leave':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(approveLeave($pdo, $data['leave_id'], $data['status'], $data['remarks'] ?? ''));
            break;
            
        case 'leave_balance':
            $employeeId = $_GET['employee_id'] ?? null;
            echo json_encode(getLeaveBalance($pdo, $employeeId));
            break;
            
        case 'leave_calendar':
            $month = $_GET['month'] ?? date('Y-m');
            echo json_encode(getLeaveCalendar($pdo, $month));
            break;

        // ============================================
        // PERFORMANCE REVIEWS
        // ============================================
        case 'performance_reviews':
            handlePerformanceReviews($pdo, $method, $id);
            break;
            
        case 'create_review':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(createPerformanceReview($pdo, $data));
            break;
            
        case 'submit_review':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(submitReview($pdo, $data));
            break;
            
        case 'review_templates':
            handleReviewTemplates($pdo, $method, $id);
            break;
            
        case 'performance_goals':
            handlePerformanceGoals($pdo, $method, $id);
            break;

        // ============================================
        // EMPLOYEE MANAGEMENT
        // ============================================
        case 'employees':
            handleEmployees($pdo, $method, $id);
            break;
            
        case 'employee_documents':
            $employeeId = $_GET['employee_id'] ?? null;
            handleEmployeeDocuments($pdo, $method, $employeeId);
            break;
            
        case 'employee_history':
            $employeeId = $_GET['employee_id'] ?? null;
            echo json_encode(getEmployeeHistory($pdo, $employeeId));
            break;

        // ============================================
        // ATTENDANCE & TIME TRACKING
        // ============================================
        case 'attendance':
            handleAttendance($pdo, $method, $id);
            break;
            
        case 'clock_in':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(clockIn($pdo, $data['employee_id']));
            break;
            
        case 'clock_out':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(clockOut($pdo, $data['employee_id']));
            break;
            
        case 'overtime':
            handleOvertime($pdo, $method, $id);
            break;

        // ============================================
        // REPORTS & ANALYTICS
        // ============================================
        case 'hr_dashboard':
            echo json_encode(getHRDashboard($pdo));
            break;
            
        case 'payroll_report':
            $month = $_GET['month'] ?? date('Y-m');
            echo json_encode(getPayrollReport($pdo, $month));
            break;
            
        case 'attendance_report':
            $month = $_GET['month'] ?? date('Y-m');
            echo json_encode(getAttendanceReport($pdo, $month));
            break;
            
        case 'leave_report':
            $year = $_GET['year'] ?? date('Y');
            echo json_encode(getLeaveReport($pdo, $year));
            break;

        default:
            echo json_encode(['error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

// ============================================
// TABLE CREATION
// ============================================
function createHRTables($pdo) {
    // Salary structures
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS salary_structures (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            basic_salary DECIMAL(12,2) NOT NULL,
            housing_allowance DECIMAL(12,2) DEFAULT 0,
            transport_allowance DECIMAL(12,2) DEFAULT 0,
            medical_allowance DECIMAL(12,2) DEFAULT 0,
            other_allowances DECIMAL(12,2) DEFAULT 0,
            tax_rate DECIMAL(5,2) DEFAULT 0,
            pension_rate DECIMAL(5,2) DEFAULT 5.5,
            insurance_rate DECIMAL(5,2) DEFAULT 0,
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Employee salary assignments
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS employee_salaries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            employee_type ENUM('teacher', 'staff') NOT NULL,
            salary_structure_id INT,
            custom_basic DECIMAL(12,2),
            custom_allowances JSON,
            bank_name VARCHAR(100),
            bank_account VARCHAR(50),
            effective_date DATE NOT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_employee (employee_id, employee_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Payroll records
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS payroll (
            id INT AUTO_INCREMENT PRIMARY KEY,
            payroll_month VARCHAR(7) NOT NULL,
            employee_id INT NOT NULL,
            employee_type ENUM('teacher', 'staff') NOT NULL,
            basic_salary DECIMAL(12,2) NOT NULL,
            total_allowances DECIMAL(12,2) DEFAULT 0,
            gross_salary DECIMAL(12,2) NOT NULL,
            tax_deduction DECIMAL(12,2) DEFAULT 0,
            pension_deduction DECIMAL(12,2) DEFAULT 0,
            other_deductions DECIMAL(12,2) DEFAULT 0,
            net_salary DECIMAL(12,2) NOT NULL,
            overtime_hours DECIMAL(5,2) DEFAULT 0,
            overtime_pay DECIMAL(12,2) DEFAULT 0,
            bonus DECIMAL(12,2) DEFAULT 0,
            status ENUM('draft', 'approved', 'paid') DEFAULT 'draft',
            payment_date DATE,
            payment_method VARCHAR(50),
            payment_reference VARCHAR(100),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_payroll (payroll_month, employee_id, employee_type),
            INDEX idx_month (payroll_month),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Leave types
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leave_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            days_allowed INT DEFAULT 0,
            is_paid TINYINT(1) DEFAULT 1,
            requires_approval TINYINT(1) DEFAULT 1,
            carry_forward TINYINT(1) DEFAULT 0,
            max_carry_forward INT DEFAULT 0,
            applicable_to ENUM('all', 'teachers', 'staff') DEFAULT 'all',
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Leave balances
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leave_balances (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            employee_type ENUM('teacher', 'staff') NOT NULL,
            leave_type_id INT NOT NULL,
            year INT NOT NULL,
            entitled_days INT DEFAULT 0,
            used_days INT DEFAULT 0,
            carried_forward INT DEFAULT 0,
            remaining_days INT DEFAULT 0,
            UNIQUE KEY unique_balance (employee_id, employee_type, leave_type_id, year),
            INDEX idx_employee (employee_id, employee_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Leave requests
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            employee_type ENUM('teacher', 'staff') NOT NULL,
            leave_type_id INT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            days_requested INT NOT NULL,
            reason TEXT,
            attachment VARCHAR(255),
            status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
            approved_by INT,
            approval_date DATETIME,
            remarks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_employee (employee_id, employee_type),
            INDEX idx_status (status),
            INDEX idx_dates (start_date, end_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Performance review templates
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS review_templates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            criteria JSON,
            rating_scale INT DEFAULT 5,
            applicable_to ENUM('all', 'teachers', 'staff') DEFAULT 'all',
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Performance reviews
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS performance_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            employee_type ENUM('teacher', 'staff') NOT NULL,
            review_period VARCHAR(50) NOT NULL,
            template_id INT,
            reviewer_id INT NOT NULL,
            reviewer_type VARCHAR(20) NOT NULL,
            scores JSON,
            overall_rating DECIMAL(3,2),
            strengths TEXT,
            areas_for_improvement TEXT,
            goals TEXT,
            employee_comments TEXT,
            status ENUM('draft', 'submitted', 'acknowledged') DEFAULT 'draft',
            submitted_at DATETIME,
            acknowledged_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_employee (employee_id, employee_type),
            INDEX idx_period (review_period)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Performance goals
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS performance_goals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            employee_type ENUM('teacher', 'staff') NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            target_date DATE,
            progress INT DEFAULT 0,
            status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_employee (employee_id, employee_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Employee attendance (time tracking)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS employee_time_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            employee_type ENUM('teacher', 'staff') NOT NULL,
            log_date DATE NOT NULL,
            clock_in TIME,
            clock_out TIME,
            total_hours DECIMAL(5,2),
            overtime_hours DECIMAL(5,2) DEFAULT 0,
            status ENUM('present', 'absent', 'half_day', 'on_leave') DEFAULT 'present',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_log (employee_id, employee_type, log_date),
            INDEX idx_date (log_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Overtime requests
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS overtime_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            employee_type ENUM('teacher', 'staff') NOT NULL,
            request_date DATE NOT NULL,
            hours DECIMAL(5,2) NOT NULL,
            reason TEXT,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            approved_by INT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_employee (employee_id, employee_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Insert default leave types if not exist
    $stmt = $pdo->query("SELECT COUNT(*) FROM leave_types");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("
            INSERT INTO leave_types (name, description, days_allowed, is_paid, applicable_to) VALUES
            ('Annual Leave', 'Yearly vacation leave', 21, 1, 'all'),
            ('Sick Leave', 'Medical leave with documentation', 10, 1, 'all'),
            ('Maternity Leave', 'Leave for new mothers', 90, 1, 'all'),
            ('Paternity Leave', 'Leave for new fathers', 5, 1, 'all'),
            ('Compassionate Leave', 'Leave for family emergencies', 5, 1, 'all'),
            ('Study Leave', 'Leave for educational purposes', 10, 0, 'all'),
            ('Unpaid Leave', 'Leave without pay', 30, 0, 'all')
        ");
    }
}

// ============================================
// PAYROLL FUNCTIONS
// ============================================
function handlePayroll($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT p.*,
                           CASE WHEN p.employee_type = 'teacher' 
                                THEN (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE id = p.employee_id)
                                ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE id = p.employee_id)
                           END as employee_name
                    FROM payroll p
                    WHERE p.id = ?
                ");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'payroll' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $month = $_GET['month'] ?? date('Y-m');
                $status = $_GET['status'] ?? null;
                
                $sql = "
                    SELECT p.*,
                           CASE WHEN p.employee_type = 'teacher' 
                                THEN (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE id = p.employee_id)
                                ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE id = p.employee_id)
                           END as employee_name
                    FROM payroll p
                    WHERE p.payroll_month = ?
                ";
                $params = [$month];
                
                if ($status) {
                    $sql .= " AND p.status = ?";
                    $params[] = $status;
                }
                
                $sql .= " ORDER BY employee_name";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'payroll' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
    }
}

function generatePayroll($pdo, $data) {
    $month = $data['month'] ?? date('Y-m');
    $generated = 0;
    
    // Get all active employees with salary info
    $employees = [];
    
    // Teachers
    $stmt = $pdo->query("
        SELECT t.id, 'teacher' as type, t.first_name, t.last_name,
               es.salary_structure_id, es.custom_basic, es.custom_allowances,
               ss.basic_salary, ss.housing_allowance, ss.transport_allowance,
               ss.medical_allowance, ss.other_allowances, ss.tax_rate, ss.pension_rate
        FROM teachers t
        LEFT JOIN employee_salaries es ON t.id = es.employee_id AND es.employee_type = 'teacher' AND es.status = 'active'
        LEFT JOIN salary_structures ss ON es.salary_structure_id = ss.id
        WHERE t.status = 'active'
    ");
    $employees = array_merge($employees, $stmt->fetchAll(PDO::FETCH_ASSOC));
    
    // Staff
    $stmt = $pdo->query("
        SELECT e.id, 'staff' as type, e.first_name, e.last_name,
               es.salary_structure_id, es.custom_basic, es.custom_allowances,
               ss.basic_salary, ss.housing_allowance, ss.transport_allowance,
               ss.medical_allowance, ss.other_allowances, ss.tax_rate, ss.pension_rate
        FROM employees e
        LEFT JOIN employee_salaries es ON e.id = es.employee_id AND es.employee_type = 'staff' AND es.status = 'active'
        LEFT JOIN salary_structures ss ON es.salary_structure_id = ss.id
        WHERE e.status = 'active'
    ");
    $employees = array_merge($employees, $stmt->fetchAll(PDO::FETCH_ASSOC));
    
    foreach ($employees as $emp) {
        // Check if payroll already exists
        $stmt = $pdo->prepare("
            SELECT id FROM payroll 
            WHERE payroll_month = ? AND employee_id = ? AND employee_type = ?
        ");
        $stmt->execute([$month, $emp['id'], $emp['type']]);
        if ($stmt->fetch()) continue;
        
        // Calculate salary
        $basic = $emp['custom_basic'] ?? $emp['basic_salary'] ?? 0;
        $allowances = ($emp['housing_allowance'] ?? 0) + ($emp['transport_allowance'] ?? 0) + 
                      ($emp['medical_allowance'] ?? 0) + ($emp['other_allowances'] ?? 0);
        
        if ($emp['custom_allowances']) {
            $customAllowances = json_decode($emp['custom_allowances'], true);
            $allowances = array_sum($customAllowances);
        }
        
        $gross = $basic + $allowances;
        $tax = $gross * (($emp['tax_rate'] ?? 0) / 100);
        $pension = $gross * (($emp['pension_rate'] ?? 5.5) / 100);
        $net = $gross - $tax - $pension;
        
        // Get overtime
        $stmt = $pdo->prepare("
            SELECT SUM(hours) as total_hours
            FROM overtime_requests
            WHERE employee_id = ? AND employee_type = ? 
            AND DATE_FORMAT(request_date, '%Y-%m') = ?
            AND status = 'approved'
        ");
        $stmt->execute([$emp['id'], $emp['type'], $month]);
        $overtime = $stmt->fetch(PDO::FETCH_ASSOC);
        $overtimeHours = $overtime['total_hours'] ?? 0;
        $overtimePay = $overtimeHours * ($basic / 176) * 1.5; // 1.5x hourly rate
        
        // Insert payroll record
        $stmt = $pdo->prepare("
            INSERT INTO payroll 
            (payroll_month, employee_id, employee_type, basic_salary, total_allowances,
             gross_salary, tax_deduction, pension_deduction, net_salary,
             overtime_hours, overtime_pay, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
        ");
        $stmt->execute([
            $month, $emp['id'], $emp['type'], $basic, $allowances,
            $gross, $tax, $pension, $net + $overtimePay,
            $overtimeHours, $overtimePay
        ]);
        $generated++;
    }
    
    return ['success' => true, 'generated' => $generated, 'month' => $month];
}

function processPayroll($pdo, $payrollId) {
    $stmt = $pdo->prepare("
        UPDATE payroll 
        SET status = 'paid', payment_date = CURDATE()
        WHERE id = ?
    ");
    $stmt->execute([$payrollId]);
    
    return ['success' => true, 'message' => 'Payroll processed'];
}

function handleSalaryStructure($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM salary_structures WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'structure' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $stmt = $pdo->query("SELECT * FROM salary_structures WHERE status = 'active' ORDER BY name");
                echo json_encode(['success' => true, 'structures' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO salary_structures 
                (name, basic_salary, housing_allowance, transport_allowance, medical_allowance,
                 other_allowances, tax_rate, pension_rate, insurance_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'],
                $data['basic_salary'],
                $data['housing_allowance'] ?? 0,
                $data['transport_allowance'] ?? 0,
                $data['medical_allowance'] ?? 0,
                $data['other_allowances'] ?? 0,
                $data['tax_rate'] ?? 0,
                $data['pension_rate'] ?? 5.5,
                $data['insurance_rate'] ?? 0
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
    }
}

function getPayslip($pdo, $employeeId, $month) {
    $employeeType = $_GET['employee_type'] ?? 'teacher';
    
    $stmt = $pdo->prepare("
        SELECT p.*,
               CASE WHEN p.employee_type = 'teacher' 
                    THEN (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE id = p.employee_id)
                    ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE id = p.employee_id)
               END as employee_name,
               es.bank_name, es.bank_account
        FROM payroll p
        LEFT JOIN employee_salaries es ON p.employee_id = es.employee_id AND p.employee_type = es.employee_type
        WHERE p.employee_id = ? AND p.employee_type = ? AND p.payroll_month = ?
    ");
    $stmt->execute([$employeeId, $employeeType, $month]);
    
    return ['success' => true, 'payslip' => $stmt->fetch(PDO::FETCH_ASSOC)];
}

// ============================================
// LEAVE MANAGEMENT FUNCTIONS
// ============================================
function handleLeaveTypes($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM leave_types WHERE status = 'active' ORDER BY name");
            echo json_encode(['success' => true, 'leave_types' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO leave_types (name, description, days_allowed, is_paid, requires_approval, 
                                        carry_forward, max_carry_forward, applicable_to)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'],
                $data['description'] ?? null,
                $data['days_allowed'] ?? 0,
                $data['is_paid'] ?? 1,
                $data['requires_approval'] ?? 1,
                $data['carry_forward'] ?? 0,
                $data['max_carry_forward'] ?? 0,
                $data['applicable_to'] ?? 'all'
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
    }
}

function handleLeaveRequests($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $employeeId = $_GET['employee_id'] ?? null;
            $status = $_GET['status'] ?? null;
            
            $sql = "
                SELECT lr.*,
                       lt.name as leave_type_name,
                       CASE WHEN lr.employee_type = 'teacher' 
                            THEN (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE id = lr.employee_id)
                            ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE id = lr.employee_id)
                       END as employee_name
                FROM leave_requests lr
                JOIN leave_types lt ON lr.leave_type_id = lt.id
                WHERE 1=1
            ";
            $params = [];
            
            if ($employeeId) {
                $sql .= " AND lr.employee_id = ?";
                $params[] = $employeeId;
            }
            if ($status) {
                $sql .= " AND lr.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY lr.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'requests' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
    }
}

function applyLeave($pdo, $data) {
    // Calculate days
    $start = new DateTime($data['start_date']);
    $end = new DateTime($data['end_date']);
    $days = $end->diff($start)->days + 1;
    
    // Check balance
    $balance = getLeaveBalance($pdo, $data['employee_id'], $data['employee_type'] ?? 'teacher');
    $leaveTypeBalance = null;
    foreach ($balance['balances'] as $b) {
        if ($b['leave_type_id'] == $data['leave_type_id']) {
            $leaveTypeBalance = $b;
            break;
        }
    }
    
    if ($leaveTypeBalance && $leaveTypeBalance['remaining_days'] < $days) {
        return ['success' => false, 'error' => 'Insufficient leave balance'];
    }
    
    // Check for overlapping requests
    $stmt = $pdo->prepare("
        SELECT id FROM leave_requests
        WHERE employee_id = ? AND employee_type = ?
        AND status IN ('pending', 'approved')
        AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?))
    ");
    $stmt->execute([
        $data['employee_id'],
        $data['employee_type'] ?? 'teacher',
        $data['start_date'], $data['end_date'],
        $data['start_date'], $data['end_date']
    ]);
    if ($stmt->fetch()) {
        return ['success' => false, 'error' => 'Overlapping leave request exists'];
    }
    
    // Create request
    $stmt = $pdo->prepare("
        INSERT INTO leave_requests 
        (employee_id, employee_type, leave_type_id, start_date, end_date, days_requested, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['employee_id'],
        $data['employee_type'] ?? 'teacher',
        $data['leave_type_id'],
        $data['start_date'],
        $data['end_date'],
        $days,
        $data['reason'] ?? null
    ]);
    
    return ['success' => true, 'id' => $pdo->lastInsertId(), 'days' => $days];
}

function approveLeave($pdo, $leaveId, $status, $remarks) {
    $stmt = $pdo->prepare("
        UPDATE leave_requests 
        SET status = ?, approved_by = 1, approval_date = NOW(), remarks = ?
        WHERE id = ?
    ");
    $stmt->execute([$status, $remarks, $leaveId]);
    
    // Update balance if approved
    if ($status === 'approved') {
        $stmt = $pdo->prepare("SELECT * FROM leave_requests WHERE id = ?");
        $stmt->execute([$leaveId]);
        $request = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->prepare("
            UPDATE leave_balances 
            SET used_days = used_days + ?, remaining_days = remaining_days - ?
            WHERE employee_id = ? AND employee_type = ? AND leave_type_id = ? AND year = YEAR(CURDATE())
        ");
        $stmt->execute([
            $request['days_requested'],
            $request['days_requested'],
            $request['employee_id'],
            $request['employee_type'],
            $request['leave_type_id']
        ]);
    }
    
    return ['success' => true, 'message' => 'Leave request ' . $status];
}

function getLeaveBalance($pdo, $employeeId, $employeeType = 'teacher') {
    $year = date('Y');
    
    // Initialize balances if not exist
    $stmt = $pdo->query("SELECT * FROM leave_types WHERE status = 'active'");
    $leaveTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($leaveTypes as $lt) {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO leave_balances 
            (employee_id, employee_type, leave_type_id, year, entitled_days, remaining_days)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$employeeId, $employeeType, $lt['id'], $year, $lt['days_allowed'], $lt['days_allowed']]);
    }
    
    // Get balances
    $stmt = $pdo->prepare("
        SELECT lb.*, lt.name as leave_type_name
        FROM leave_balances lb
        JOIN leave_types lt ON lb.leave_type_id = lt.id
        WHERE lb.employee_id = ? AND lb.employee_type = ? AND lb.year = ?
    ");
    $stmt->execute([$employeeId, $employeeType, $year]);
    
    return ['success' => true, 'balances' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getLeaveCalendar($pdo, $month) {
    $stmt = $pdo->prepare("
        SELECT lr.*,
               lt.name as leave_type_name,
               CASE WHEN lr.employee_type = 'teacher' 
                    THEN (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE id = lr.employee_id)
                    ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE id = lr.employee_id)
               END as employee_name
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.status = 'approved'
        AND (DATE_FORMAT(lr.start_date, '%Y-%m') = ? OR DATE_FORMAT(lr.end_date, '%Y-%m') = ?)
    ");
    $stmt->execute([$month, $month]);
    
    return ['success' => true, 'calendar' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

// ============================================
// PERFORMANCE REVIEW FUNCTIONS
// ============================================
function handlePerformanceReviews($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT pr.*,
                           CASE WHEN pr.employee_type = 'teacher' 
                                THEN (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE id = pr.employee_id)
                                ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE id = pr.employee_id)
                           END as employee_name,
                           rt.name as template_name
                    FROM performance_reviews pr
                    LEFT JOIN review_templates rt ON pr.template_id = rt.id
                    WHERE pr.id = ?
                ");
                $stmt->execute([$id]);
                $review = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($review) {
                    $review['scores'] = json_decode($review['scores'], true);
                }
                echo json_encode(['success' => true, 'review' => $review]);
            } else {
                $employeeId = $_GET['employee_id'] ?? null;
                $period = $_GET['period'] ?? null;
                
                $sql = "
                    SELECT pr.*,
                           CASE WHEN pr.employee_type = 'teacher' 
                                THEN (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE id = pr.employee_id)
                                ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE id = pr.employee_id)
                           END as employee_name
                    FROM performance_reviews pr
                    WHERE 1=1
                ";
                $params = [];
                
                if ($employeeId) {
                    $sql .= " AND pr.employee_id = ?";
                    $params[] = $employeeId;
                }
                if ($period) {
                    $sql .= " AND pr.review_period = ?";
                    $params[] = $period;
                }
                
                $sql .= " ORDER BY pr.created_at DESC";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'reviews' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
    }
}

function createPerformanceReview($pdo, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO performance_reviews 
        (employee_id, employee_type, review_period, template_id, reviewer_id, reviewer_type)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['employee_id'],
        $data['employee_type'] ?? 'teacher',
        $data['review_period'],
        $data['template_id'] ?? null,
        $data['reviewer_id'],
        $data['reviewer_type'] ?? 'admin'
    ]);
    
    return ['success' => true, 'id' => $pdo->lastInsertId()];
}

function submitReview($pdo, $data) {
    // Calculate overall rating
    $scores = $data['scores'] ?? [];
    $overallRating = count($scores) > 0 ? array_sum($scores) / count($scores) : 0;
    
    $stmt = $pdo->prepare("
        UPDATE performance_reviews 
        SET scores = ?, overall_rating = ?, strengths = ?, areas_for_improvement = ?,
            goals = ?, status = 'submitted', submitted_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([
        json_encode($scores),
        $overallRating,
        $data['strengths'] ?? null,
        $data['areas_for_improvement'] ?? null,
        $data['goals'] ?? null,
        $data['review_id']
    ]);
    
    return ['success' => true, 'overall_rating' => $overallRating];
}

function handleReviewTemplates($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM review_templates WHERE status = 'active'");
            $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($templates as &$t) {
                $t['criteria'] = json_decode($t['criteria'], true);
            }
            echo json_encode(['success' => true, 'templates' => $templates]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO review_templates (name, description, criteria, rating_scale, applicable_to)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'],
                $data['description'] ?? null,
                json_encode($data['criteria'] ?? []),
                $data['rating_scale'] ?? 5,
                $data['applicable_to'] ?? 'all'
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
    }
}

function handlePerformanceGoals($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $employeeId = $_GET['employee_id'] ?? null;
            $sql = "SELECT * FROM performance_goals WHERE 1=1";
            $params = [];
            
            if ($employeeId) {
                $sql .= " AND employee_id = ?";
                $params[] = $employeeId;
            }
            
            $sql .= " ORDER BY target_date";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'goals' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO performance_goals (employee_id, employee_type, title, description, target_date)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['employee_id'],
                $data['employee_type'] ?? 'teacher',
                $data['title'],
                $data['description'] ?? null,
                $data['target_date'] ?? null
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                UPDATE performance_goals SET progress = ?, status = ? WHERE id = ?
            ");
            $stmt->execute([$data['progress'], $data['status'], $id]);
            echo json_encode(['success' => true]);
            break;
    }
}

// ============================================
// EMPLOYEE FUNCTIONS
// ============================================
function handleEmployees($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            // Get combined list of teachers and staff
            $stmt = $pdo->query("
                SELECT id, 'teacher' as type, first_name, last_name, email, phone, department, status, created_at
                FROM teachers WHERE status = 'active'
                UNION ALL
                SELECT id, 'staff' as type, first_name, last_name, email, phone, department, status, created_at
                FROM employees WHERE status = 'active'
                ORDER BY first_name, last_name
            ");
            echo json_encode(['success' => true, 'employees' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
    }
}

function handleEmployeeDocuments($pdo, $method, $employeeId) {
    // Create documents table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS employee_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            employee_type ENUM('teacher', 'staff') NOT NULL,
            document_type VARCHAR(100) NOT NULL,
            document_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500),
            expiry_date DATE,
            status ENUM('active', 'expired', 'archived') DEFAULT 'active',
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_employee (employee_id, employee_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    switch ($method) {
        case 'GET':
            $employeeType = $_GET['employee_type'] ?? 'teacher';
            $stmt = $pdo->prepare("
                SELECT * FROM employee_documents 
                WHERE employee_id = ? AND employee_type = ?
                ORDER BY uploaded_at DESC
            ");
            $stmt->execute([$employeeId, $employeeType]);
            echo json_encode(['success' => true, 'documents' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
    }
}

function getEmployeeHistory($pdo, $employeeId) {
    $employeeType = $_GET['employee_type'] ?? 'teacher';
    
    $history = [];
    
    // Payroll history
    $stmt = $pdo->prepare("
        SELECT payroll_month, net_salary, status, payment_date
        FROM payroll
        WHERE employee_id = ? AND employee_type = ?
        ORDER BY payroll_month DESC
        LIMIT 12
    ");
    $stmt->execute([$employeeId, $employeeType]);
    $history['payroll'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Leave history
    $stmt = $pdo->prepare("
        SELECT lr.*, lt.name as leave_type_name
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE lr.employee_id = ? AND lr.employee_type = ?
        ORDER BY lr.created_at DESC
        LIMIT 20
    ");
    $stmt->execute([$employeeId, $employeeType]);
    $history['leaves'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Performance reviews
    $stmt = $pdo->prepare("
        SELECT review_period, overall_rating, status, submitted_at
        FROM performance_reviews
        WHERE employee_id = ? AND employee_type = ?
        ORDER BY created_at DESC
    ");
    $stmt->execute([$employeeId, $employeeType]);
    $history['reviews'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return ['success' => true, 'history' => $history];
}

// ============================================
// ATTENDANCE FUNCTIONS
// ============================================
function handleAttendance($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $date = $_GET['date'] ?? date('Y-m-d');
            $stmt = $pdo->prepare("
                SELECT etl.*,
                       CASE WHEN etl.employee_type = 'teacher' 
                            THEN (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE id = etl.employee_id)
                            ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE id = etl.employee_id)
                       END as employee_name
                FROM employee_time_logs etl
                WHERE etl.log_date = ?
                ORDER BY employee_name
            ");
            $stmt->execute([$date]);
            echo json_encode(['success' => true, 'attendance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
    }
}

function clockIn($pdo, $employeeId) {
    $employeeType = $_GET['employee_type'] ?? 'teacher';
    $today = date('Y-m-d');
    $now = date('H:i:s');
    
    // Check if already clocked in
    $stmt = $pdo->prepare("
        SELECT id FROM employee_time_logs 
        WHERE employee_id = ? AND employee_type = ? AND log_date = ?
    ");
    $stmt->execute([$employeeId, $employeeType, $today]);
    
    if ($stmt->fetch()) {
        return ['success' => false, 'error' => 'Already clocked in today'];
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO employee_time_logs (employee_id, employee_type, log_date, clock_in, status)
        VALUES (?, ?, ?, ?, 'present')
    ");
    $stmt->execute([$employeeId, $employeeType, $today, $now]);
    
    return ['success' => true, 'clock_in' => $now];
}

function clockOut($pdo, $employeeId) {
    $employeeType = $_GET['employee_type'] ?? 'teacher';
    $today = date('Y-m-d');
    $now = date('H:i:s');
    
    // Get clock in time
    $stmt = $pdo->prepare("
        SELECT id, clock_in FROM employee_time_logs 
        WHERE employee_id = ? AND employee_type = ? AND log_date = ?
    ");
    $stmt->execute([$employeeId, $employeeType, $today]);
    $log = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$log) {
        return ['success' => false, 'error' => 'No clock in record found'];
    }
    
    // Calculate hours
    $clockIn = new DateTime($log['clock_in']);
    $clockOut = new DateTime($now);
    $diff = $clockOut->diff($clockIn);
    $totalHours = $diff->h + ($diff->i / 60);
    $overtimeHours = max(0, $totalHours - 8);
    
    $stmt = $pdo->prepare("
        UPDATE employee_time_logs 
        SET clock_out = ?, total_hours = ?, overtime_hours = ?
        WHERE id = ?
    ");
    $stmt->execute([$now, $totalHours, $overtimeHours, $log['id']]);
    
    return ['success' => true, 'clock_out' => $now, 'total_hours' => round($totalHours, 2)];
}

function handleOvertime($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $employeeId = $_GET['employee_id'] ?? null;
            $status = $_GET['status'] ?? null;
            
            $sql = "
                SELECT o.*,
                       CASE WHEN o.employee_type = 'teacher' 
                            THEN (SELECT CONCAT(first_name, ' ', last_name) FROM teachers WHERE id = o.employee_id)
                            ELSE (SELECT CONCAT(first_name, ' ', last_name) FROM employees WHERE id = o.employee_id)
                       END as employee_name
                FROM overtime_requests o
                WHERE 1=1
            ";
            $params = [];
            
            if ($employeeId) {
                $sql .= " AND o.employee_id = ?";
                $params[] = $employeeId;
            }
            if ($status) {
                $sql .= " AND o.status = ?";
                $params[] = $status;
            }
            
            $sql .= " ORDER BY o.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'overtime' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO overtime_requests (employee_id, employee_type, request_date, hours, reason)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['employee_id'],
                $data['employee_type'] ?? 'teacher',
                $data['request_date'],
                $data['hours'],
                $data['reason'] ?? null
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
    }
}

// ============================================
// REPORTS & DASHBOARD
// ============================================
function getHRDashboard($pdo) {
    $dashboard = [];
    
    // Employee counts
    $stmt = $pdo->query("SELECT COUNT(*) FROM teachers WHERE status = 'active'");
    $dashboard['total_teachers'] = $stmt->fetchColumn();
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM employees WHERE status = 'active'");
    $dashboard['total_staff'] = $stmt->fetchColumn();
    
    // Pending leave requests
    $stmt = $pdo->query("SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'");
    $dashboard['pending_leaves'] = $stmt->fetchColumn();
    
    // Today's attendance
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM employee_time_logs WHERE log_date = ?");
    $stmt->execute([date('Y-m-d')]);
    $dashboard['today_attendance'] = $stmt->fetchColumn();
    
    // Payroll status
    $currentMonth = date('Y-m');
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
            SUM(net_salary) as total_amount
        FROM payroll WHERE payroll_month = ?
    ");
    $stmt->execute([$currentMonth]);
    $dashboard['payroll'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Upcoming reviews
    $stmt = $pdo->query("
        SELECT COUNT(*) FROM performance_reviews 
        WHERE status = 'draft' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $dashboard['pending_reviews'] = $stmt->fetchColumn();
    
    // On leave today
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM leave_requests 
        WHERE status = 'approved' AND ? BETWEEN start_date AND end_date
    ");
    $stmt->execute([date('Y-m-d')]);
    $dashboard['on_leave_today'] = $stmt->fetchColumn();
    
    return ['success' => true, 'dashboard' => $dashboard];
}

function getPayrollReport($pdo, $month) {
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_employees,
            SUM(basic_salary) as total_basic,
            SUM(total_allowances) as total_allowances,
            SUM(gross_salary) as total_gross,
            SUM(tax_deduction) as total_tax,
            SUM(pension_deduction) as total_pension,
            SUM(net_salary) as total_net,
            SUM(overtime_pay) as total_overtime
        FROM payroll
        WHERE payroll_month = ?
    ");
    $stmt->execute([$month]);
    
    return ['success' => true, 'report' => $stmt->fetch(PDO::FETCH_ASSOC), 'month' => $month];
}

function getAttendanceReport($pdo, $month) {
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(DISTINCT CONCAT(employee_id, '-', employee_type)) as total_employees,
            COUNT(*) as total_records,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
            SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) as leave_days,
            SUM(total_hours) as total_hours,
            SUM(overtime_hours) as total_overtime
        FROM employee_time_logs
        WHERE DATE_FORMAT(log_date, '%Y-%m') = ?
    ");
    $stmt->execute([$month]);
    
    return ['success' => true, 'report' => $stmt->fetch(PDO::FETCH_ASSOC), 'month' => $month];
}

function getLeaveReport($pdo, $year) {
    $stmt = $pdo->prepare("
        SELECT 
            lt.name as leave_type,
            COUNT(*) as total_requests,
            SUM(CASE WHEN lr.status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN lr.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN lr.status = 'approved' THEN lr.days_requested ELSE 0 END) as total_days
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leave_type_id = lt.id
        WHERE YEAR(lr.created_at) = ?
        GROUP BY lt.id
    ");
    $stmt->execute([$year]);
    
    return ['success' => true, 'report' => $stmt->fetchAll(PDO::FETCH_ASSOC), 'year' => $year];
}

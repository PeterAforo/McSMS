<?php
/**
 * HR & Payroll Management API
 * Complete HR system with payroll, leave, attendance, performance
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
    // EMPLOYEES
    // ============================================
    if ($resource === 'employees') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            e.*,
                            d.department_name,
                            des.designation_name,
                            ec.category_name
                        FROM employees e
                        LEFT JOIN departments d ON e.department_id = d.id
                        LEFT JOIN designations des ON e.designation_id = des.id
                        LEFT JOIN employee_categories ec ON e.category_id = ec.id
                        WHERE e.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'employee' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } else {
                    $where = [];
                    $params = [];
                    
                    if (!empty($_GET['status'])) {
                        $where[] = "e.status = ?";
                        $params[] = $_GET['status'];
                    }
                    if (!empty($_GET['department_id'])) {
                        $where[] = "e.department_id = ?";
                        $params[] = $_GET['department_id'];
                    }
                    
                    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            e.*,
                            d.department_name,
                            des.designation_name
                        FROM employees e
                        LEFT JOIN departments d ON e.department_id = d.id
                        LEFT JOIN designations des ON e.designation_id = des.id
                        $whereClause
                        ORDER BY e.first_name, e.last_name
                    ");
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'employees' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO employees 
                    (employee_number, first_name, last_name, email, phone, date_of_birth, gender, 
                     address, city, department_id, designation_id, category_id, employment_type, 
                     join_date, basic_salary, bank_name, bank_account_number, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['employee_number'],
                    $data['first_name'],
                    $data['last_name'],
                    $data['email'] ?? null,
                    $data['phone'] ?? null,
                    $data['date_of_birth'] ?? null,
                    $data['gender'] ?? null,
                    $data['address'] ?? null,
                    $data['city'] ?? null,
                    $data['department_id'] ?? null,
                    $data['designation_id'] ?? null,
                    $data['category_id'] ?? null,
                    $data['employment_type'] ?? 'full_time',
                    $data['join_date'],
                    $data['basic_salary'],
                    $data['bank_name'] ?? null,
                    $data['bank_account_number'] ?? null,
                    $data['status'] ?? 'active'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE employees 
                    SET first_name = ?, last_name = ?, email = ?, phone = ?, 
                        address = ?, city = ?, department_id = ?, designation_id = ?, 
                        basic_salary = ?, bank_name = ?, bank_account_number = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['first_name'],
                    $data['last_name'],
                    $data['email'] ?? null,
                    $data['phone'] ?? null,
                    $data['address'] ?? null,
                    $data['city'] ?? null,
                    $data['department_id'] ?? null,
                    $data['designation_id'] ?? null,
                    $data['basic_salary'],
                    $data['bank_name'] ?? null,
                    $data['bank_account_number'] ?? null,
                    $data['status'] ?? 'active',
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // PAYROLL
    // ============================================
    elseif ($resource === 'payroll') {
        switch ($method) {
            case 'GET':
                if ($action === 'generate') {
                    $month = $_GET['month'] ?? date('Y-m');
                    generatePayroll($pdo, $month);
                    echo json_encode(['success' => true, 'message' => 'Payroll generated successfully']);
                    
                } elseif ($action === 'by_month') {
                    $month = $_GET['month'] ?? date('Y-m');
                    $stmt = $pdo->prepare("
                        SELECT 
                            p.*,
                            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                            e.employee_number,
                            d.department_name
                        FROM payroll p
                        JOIN employees e ON p.employee_id = e.id
                        LEFT JOIN departments d ON e.department_id = d.id
                        WHERE p.payroll_month = ?
                        ORDER BY e.first_name, e.last_name
                    ");
                    $stmt->execute([$month]);
                    echo json_encode(['success' => true, 'payroll' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_employee') {
                    $employeeId = $_GET['employee_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT * FROM payroll 
                        WHERE employee_id = ? 
                        ORDER BY payroll_month DESC
                    ");
                    $stmt->execute([$employeeId]);
                    echo json_encode(['success' => true, 'payroll' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            p.*,
                            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                            e.employee_number,
                            e.bank_name,
                            e.bank_account_number
                        FROM payroll p
                        JOIN employees e ON p.employee_id = e.id
                        WHERE p.id = ?
                    ");
                    $stmt->execute([$id]);
                    $payroll = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get details
                    $stmt = $pdo->prepare("
                        SELECT 
                            pd.*,
                            sc.component_name
                        FROM payroll_details pd
                        JOIN salary_components sc ON pd.component_id = sc.id
                        WHERE pd.payroll_id = ?
                        ORDER BY pd.component_type, sc.component_name
                    ");
                    $stmt->execute([$id]);
                    $payroll['details'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode(['success' => true, 'payroll' => $payroll]);
                }
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'process') {
                    $stmt = $pdo->prepare("
                        UPDATE payroll 
                        SET status = 'processed', processed_by = ?, processed_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$data['processed_by'] ?? 1, $id]);
                    echo json_encode(['success' => true]);
                    
                } elseif ($action === 'pay') {
                    $stmt = $pdo->prepare("
                        UPDATE payroll 
                        SET status = 'paid', payment_date = ?, payment_method = ?, payment_reference = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['payment_date'] ?? date('Y-m-d'),
                        $data['payment_method'] ?? 'bank_transfer',
                        $data['payment_reference'] ?? null,
                        $id
                    ]);
                    echo json_encode(['success' => true]);
                }
                break;
        }
    }

    // ============================================
    // LEAVE APPLICATIONS
    // ============================================
    elseif ($resource === 'leave') {
        switch ($method) {
            case 'GET':
                if ($action === 'pending') {
                    $stmt = $pdo->query("
                        SELECT 
                            la.*,
                            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                            e.employee_number,
                            lt.leave_type_name
                        FROM leave_applications la
                        JOIN employees e ON la.employee_id = e.id
                        JOIN leave_types lt ON la.leave_type_id = lt.id
                        WHERE la.status = 'pending'
                        ORDER BY la.applied_date DESC
                    ");
                    echo json_encode(['success' => true, 'applications' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_employee') {
                    $employeeId = $_GET['employee_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            la.*,
                            lt.leave_type_name
                        FROM leave_applications la
                        JOIN leave_types lt ON la.leave_type_id = lt.id
                        WHERE la.employee_id = ?
                        ORDER BY la.start_date DESC
                    ");
                    $stmt->execute([$employeeId]);
                    echo json_encode(['success' => true, 'applications' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            la.*,
                            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                            lt.leave_type_name,
                            CONCAT(u.name) as approved_by_name
                        FROM leave_applications la
                        JOIN employees e ON la.employee_id = e.id
                        JOIN leave_types lt ON la.leave_type_id = lt.id
                        LEFT JOIN users u ON la.approved_by = u.id
                        WHERE la.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'application' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Calculate total days
                $start = new DateTime($data['start_date']);
                $end = new DateTime($data['end_date']);
                $totalDays = $end->diff($start)->days + 1;
                
                $stmt = $pdo->prepare("
                    INSERT INTO leave_applications 
                    (employee_id, leave_type_id, start_date, end_date, total_days, reason, contact_during_leave, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                ");
                $stmt->execute([
                    $data['employee_id'],
                    $data['leave_type_id'],
                    $data['start_date'],
                    $data['end_date'],
                    $totalDays,
                    $data['reason'],
                    $data['contact_during_leave'] ?? null
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'approve') {
                    $stmt = $pdo->prepare("
                        UPDATE leave_applications 
                        SET status = 'approved', approved_by = ?, approved_date = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$data['approved_by'] ?? 1, $id]);
                    echo json_encode(['success' => true]);
                    
                } elseif ($action === 'reject') {
                    $stmt = $pdo->prepare("
                        UPDATE leave_applications 
                        SET status = 'rejected', approved_by = ?, approved_date = NOW(), rejection_reason = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$data['approved_by'] ?? 1, $data['rejection_reason'] ?? null, $id]);
                    echo json_encode(['success' => true]);
                }
                break;
        }
    }

    // ============================================
    // EMPLOYEE ATTENDANCE
    // ============================================
    elseif ($resource === 'attendance') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_date') {
                    $date = $_GET['date'] ?? date('Y-m-d');
                    $stmt = $pdo->prepare("
                        SELECT 
                            ea.*,
                            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                            e.employee_number,
                            d.department_name
                        FROM employee_attendance ea
                        JOIN employees e ON ea.employee_id = e.id
                        LEFT JOIN departments d ON e.department_id = d.id
                        WHERE ea.attendance_date = ?
                        ORDER BY e.first_name, e.last_name
                    ");
                    $stmt->execute([$date]);
                    echo json_encode(['success' => true, 'attendance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_employee') {
                    $employeeId = $_GET['employee_id'] ?? null;
                    $month = $_GET['month'] ?? date('Y-m');
                    $stmt = $pdo->prepare("
                        SELECT * FROM employee_attendance 
                        WHERE employee_id = ? AND DATE_FORMAT(attendance_date, '%Y-%m') = ?
                        ORDER BY attendance_date DESC
                    ");
                    $stmt->execute([$employeeId, $month]);
                    echo json_encode(['success' => true, 'attendance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Calculate working hours
                $workingHours = null;
                if (!empty($data['check_in_time']) && !empty($data['check_out_time'])) {
                    $checkIn = new DateTime($data['check_in_time']);
                    $checkOut = new DateTime($data['check_out_time']);
                    $interval = $checkIn->diff($checkOut);
                    $workingHours = $interval->h + ($interval->i / 60);
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO employee_attendance 
                    (employee_id, attendance_date, check_in_time, check_out_time, working_hours, status, remarks, marked_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    check_in_time = VALUES(check_in_time),
                    check_out_time = VALUES(check_out_time),
                    working_hours = VALUES(working_hours),
                    status = VALUES(status),
                    remarks = VALUES(remarks)
                ");
                $stmt->execute([
                    $data['employee_id'],
                    $data['attendance_date'],
                    $data['check_in_time'] ?? null,
                    $data['check_out_time'] ?? null,
                    $workingHours,
                    $data['status'] ?? 'present',
                    $data['remarks'] ?? null,
                    $data['marked_by'] ?? 1
                ]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // PERFORMANCE REVIEWS
    // ============================================
    elseif ($resource === 'performance') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_employee') {
                    $employeeId = $_GET['employee_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            pr.*,
                            CONCAT(u.name) as reviewer_name
                        FROM performance_reviews pr
                        LEFT JOIN users u ON pr.reviewer_id = u.id
                        WHERE pr.employee_id = ?
                        ORDER BY pr.review_period_end DESC
                    ");
                    $stmt->execute([$employeeId]);
                    echo json_encode(['success' => true, 'reviews' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            pr.*,
                            CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                            CONCAT(u.name) as reviewer_name
                        FROM performance_reviews pr
                        JOIN employees e ON pr.employee_id = e.id
                        LEFT JOIN users u ON pr.reviewer_id = u.id
                        WHERE pr.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'review' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Calculate overall rating
                $overallRating = (
                    $data['work_quality'] + 
                    $data['productivity'] + 
                    $data['communication'] + 
                    $data['teamwork'] + 
                    $data['punctuality']
                ) / 5;
                
                $stmt = $pdo->prepare("
                    INSERT INTO performance_reviews 
                    (employee_id, review_period_start, review_period_end, reviewer_id, 
                     work_quality, productivity, communication, teamwork, punctuality, overall_rating,
                     strengths, areas_for_improvement, goals, comments, status, review_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['employee_id'],
                    $data['review_period_start'],
                    $data['review_period_end'],
                    $data['reviewer_id'] ?? 1,
                    $data['work_quality'],
                    $data['productivity'],
                    $data['communication'],
                    $data['teamwork'],
                    $data['punctuality'],
                    $overallRating,
                    $data['strengths'] ?? null,
                    $data['areas_for_improvement'] ?? null,
                    $data['goals'] ?? null,
                    $data['comments'] ?? null,
                    $data['status'] ?? 'draft',
                    $data['review_date'] ?? date('Y-m-d')
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
        }
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generatePayroll($pdo, $month) {
    // Get all active employees
    $stmt = $pdo->prepare("SELECT * FROM employees WHERE status = 'active'");
    $stmt->execute();
    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($employees as $employee) {
        // Check if payroll already exists
        $stmt = $pdo->prepare("SELECT id FROM payroll WHERE employee_id = ? AND payroll_month = ?");
        $stmt->execute([$employee['id'], $month]);
        if ($stmt->fetch()) {
            continue; // Skip if already generated
        }
        
        $basicSalary = floatval($employee['basic_salary']);
        
        // Get salary structure with calculation type
        $stmt = $pdo->prepare("
            SELECT ess.*, sc.component_type, sc.component_name, sc.calculation_type
            FROM employee_salary_structure ess
            JOIN salary_components sc ON ess.component_id = sc.id
            WHERE ess.employee_id = ? AND ess.status = 'active'
            AND (ess.effective_to IS NULL OR ess.effective_to >= ?)
        ");
        $stmt->execute([$employee['id'], $month . '-01']);
        $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $totalEarnings = $basicSalary;
        $totalDeductions = 0;
        $payrollDetails = [];
        
        foreach ($components as $component) {
            // Calculate actual amount based on calculation_type
            $amount = floatval($component['amount']);
            
            // If calculation_type is 'percentage', calculate based on basic salary
            if ($component['calculation_type'] === 'percentage') {
                $actualAmount = ($amount / 100) * $basicSalary;
            } else {
                $actualAmount = $amount;
            }
            
            // Store for payroll details
            $payrollDetails[] = [
                'component_id' => $component['component_id'],
                'component_type' => $component['component_type'],
                'amount' => $actualAmount
            ];
            
            if ($component['component_type'] === 'earning') {
                $totalEarnings += $actualAmount;
            } else {
                $totalDeductions += $actualAmount;
            }
        }
        
        $grossSalary = $totalEarnings;
        $netSalary = $grossSalary - $totalDeductions;
        
        // Insert payroll
        $stmt = $pdo->prepare("
            INSERT INTO payroll 
            (payroll_month, employee_id, basic_salary, total_earnings, total_deductions, 
             gross_salary, net_salary, status, generated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'processed', 1)
        ");
        $stmt->execute([
            $month,
            $employee['id'],
            $basicSalary,
            $totalEarnings,
            $totalDeductions,
            $grossSalary,
            $netSalary
        ]);
        
        $payrollId = $pdo->lastInsertId();
        
        // Insert payroll details with calculated amounts
        $stmt = $pdo->prepare("
            INSERT INTO payroll_details (payroll_id, component_id, component_type, amount)
            VALUES (?, ?, ?, ?)
        ");
        
        foreach ($payrollDetails as $detail) {
            $stmt->execute([
                $payrollId,
                $detail['component_id'],
                $detail['component_type'],
                $detail['amount']
            ]);
        }
    }
}

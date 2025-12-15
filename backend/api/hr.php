<?php
/**
 * HR Portal API
 * Handles leave management, payroll, and HR documents for teachers
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

    // Create HR tables if not exist
    createHRTables($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $teacherId = $_GET['teacher_id'] ?? null;

    switch ($method) {
        case 'GET':
            if (!$teacherId) {
                throw new Exception('Teacher ID is required');
            }
            $data = getHRData($pdo, $teacherId);
            echo json_encode(['success' => true, ...$data]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $action = $data['action'] ?? '';
            
            switch ($action) {
                case 'submit_leave':
                    $result = submitLeaveRequest($pdo, $data);
                    echo json_encode($result);
                    break;
                case 'request_document':
                    $result = requestDocument($pdo, $data);
                    echo json_encode($result);
                    break;
                default:
                    throw new Exception('Unknown action');
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $action = $data['action'] ?? '';
            
            switch ($action) {
                case 'approve_leave':
                    $result = updateLeaveStatus($pdo, $data['leave_id'], 'approved', $data['approved_by']);
                    echo json_encode($result);
                    break;
                case 'reject_leave':
                    $result = updateLeaveStatus($pdo, $data['leave_id'], 'rejected', $data['rejected_by']);
                    echo json_encode($result);
                    break;
                default:
                    throw new Exception('Unknown action');
            }
            break;
            
        case 'DELETE':
            $leaveId = $_GET['leave_id'] ?? null;
            if ($leaveId) {
                $result = cancelLeaveRequest($pdo, $leaveId);
                echo json_encode($result);
            } else {
                throw new Exception('Leave ID is required');
            }
            break;
            
        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function createHRTables($pdo) {
    // Leave requests table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leave_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            leave_type VARCHAR(50) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            days INT NOT NULL,
            reason TEXT,
            contact_during_leave VARCHAR(255),
            handover_to VARCHAR(255),
            status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
            approved_by INT,
            approved_date DATETIME,
            rejection_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Leave balance table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leave_balance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            leave_type VARCHAR(50) NOT NULL,
            total_days INT NOT NULL DEFAULT 0,
            used_days INT NOT NULL DEFAULT 0,
            year INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_balance (teacher_id, leave_type, year)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // HR documents table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS hr_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            document_type VARCHAR(100) NOT NULL,
            document_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500),
            status ENUM('available', 'processing', 'expired') DEFAULT 'available',
            expires_at DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Document requests table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS document_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            document_type VARCHAR(100) NOT NULL,
            purpose TEXT,
            copies INT DEFAULT 1,
            urgent TINYINT(1) DEFAULT 0,
            status ENUM('pending', 'processing', 'ready', 'collected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Payslips table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS payslips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            month VARCHAR(20) NOT NULL,
            year INT NOT NULL,
            gross_salary DECIMAL(10,2) NOT NULL,
            deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
            net_salary DECIMAL(10,2) NOT NULL,
            ssnit_deduction DECIMAL(10,2) DEFAULT 0,
            tax_deduction DECIMAL(10,2) DEFAULT 0,
            other_deductions DECIMAL(10,2) DEFAULT 0,
            status ENUM('pending', 'paid') DEFAULT 'pending',
            payment_date DATE,
            file_path VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_payslip (teacher_id, month, year),
            INDEX idx_teacher (teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // HR announcements table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS hr_announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            priority ENUM('normal', 'medium', 'high') DEFAULT 'normal',
            target_audience VARCHAR(50) DEFAULT 'all',
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at DATE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function getHRData($pdo, $teacherId) {
    $data = [];
    $currentYear = date('Y');
    
    // Get teacher profile with HR info
    try {
        $stmt = $pdo->prepare("
            SELECT t.*, u.email
            FROM teachers t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.id = ? OR t.user_id = ?
        ");
        $stmt->execute([$teacherId, $teacherId]);
        $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($teacher) {
            $data['profile'] = [
                'employee_id' => 'EMP-' . date('Y') . '-' . str_pad($teacher['id'], 4, '0', STR_PAD_LEFT),
                'department' => 'Academic Staff',
                'position' => $teacher['position'] ?? 'Teacher',
                'join_date' => $teacher['hire_date'] ?? $teacher['created_at'] ?? date('Y-m-d'),
                'contract_type' => $teacher['contract_type'] ?? 'Permanent',
                'reporting_to' => 'Head of Department',
                'work_location' => 'Main Campus',
                'bank_name' => $teacher['bank_name'] ?? 'Not specified',
                'bank_account' => $teacher['bank_account'] ? '****' . substr($teacher['bank_account'], -4) : 'Not specified',
                'ssnit_number' => $teacher['ssnit_number'] ?? 'Not specified',
                'tin_number' => $teacher['tin_number'] ?? 'Not specified'
            ];
        }
    } catch (Exception $e) {
        error_log("HR profile error: " . $e->getMessage());
    }
    
    // Get leave balance
    try {
        $stmt = $pdo->prepare("
            SELECT leave_type, total_days, used_days
            FROM leave_balance
            WHERE teacher_id = ? AND year = ?
        ");
        $stmt->execute([$teacherId, $currentYear]);
        $balances = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Default leave balances
        $leaveBalance = [
            'annual' => ['total' => 21, 'used' => 0, 'pending' => 0],
            'sick' => ['total' => 10, 'used' => 0, 'pending' => 0],
            'personal' => ['total' => 3, 'used' => 0, 'pending' => 0],
            'maternity' => ['total' => 90, 'used' => 0, 'pending' => 0],
            'study' => ['total' => 5, 'used' => 0, 'pending' => 0]
        ];
        
        foreach ($balances as $balance) {
            if (isset($leaveBalance[$balance['leave_type']])) {
                $leaveBalance[$balance['leave_type']]['total'] = $balance['total_days'];
                $leaveBalance[$balance['leave_type']]['used'] = $balance['used_days'];
            }
        }
        
        // Get pending leave days
        $stmt = $pdo->prepare("
            SELECT leave_type, SUM(days) as pending_days
            FROM leave_requests
            WHERE teacher_id = ? AND status = 'pending' AND YEAR(start_date) = ?
            GROUP BY leave_type
        ");
        $stmt->execute([$teacherId, $currentYear]);
        $pending = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($pending as $p) {
            if (isset($leaveBalance[$p['leave_type']])) {
                $leaveBalance[$p['leave_type']]['pending'] = (int)$p['pending_days'];
            }
        }
        
        $data['leave_balance'] = $leaveBalance;
    } catch (Exception $e) {
        error_log("Leave balance error: " . $e->getMessage());
    }
    
    // Get leave requests
    try {
        $stmt = $pdo->prepare("
            SELECT lr.*, 
                CONCAT(t.first_name, ' ', t.last_name) as approved_by_name
            FROM leave_requests lr
            LEFT JOIN teachers t ON lr.approved_by = t.id
            WHERE lr.teacher_id = ?
            ORDER BY lr.created_at DESC
            LIMIT 20
        ");
        $stmt->execute([$teacherId]);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $data['leave_requests'] = array_map(function($r) {
            return [
                'id' => $r['id'],
                'type' => $r['leave_type'],
                'start_date' => $r['start_date'],
                'end_date' => $r['end_date'],
                'days' => $r['days'],
                'status' => $r['status'],
                'reason' => $r['reason'],
                'approved_by' => $r['approved_by_name'],
                'approved_date' => $r['approved_date']
            ];
        }, $requests);
    } catch (Exception $e) {
        error_log("Leave requests error: " . $e->getMessage());
        $data['leave_requests'] = [];
    }
    
    // Get payslips
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM payslips
            WHERE teacher_id = ?
            ORDER BY year DESC, FIELD(month, 'December', 'November', 'October', 'September', 'August', 'July', 'June', 'May', 'April', 'March', 'February', 'January')
            LIMIT 12
        ");
        $stmt->execute([$teacherId]);
        $payslips = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $data['payslips'] = array_map(function($p) {
            return [
                'id' => $p['id'],
                'month' => $p['month'] . ' ' . $p['year'],
                'gross' => (float)$p['gross_salary'],
                'deductions' => (float)$p['deductions'],
                'net' => (float)$p['net_salary'],
                'status' => $p['status'],
                'date' => $p['payment_date']
            ];
        }, $payslips);
    } catch (Exception $e) {
        error_log("Payslips error: " . $e->getMessage());
        $data['payslips'] = [];
    }
    
    // Get documents
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM hr_documents
            WHERE teacher_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$teacherId]);
        $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $data['documents'] = array_map(function($d) {
            return [
                'id' => $d['id'],
                'name' => $d['document_name'],
                'type' => $d['document_type'],
                'date' => $d['created_at'],
                'status' => $d['status'],
                'expires' => $d['expires_at']
            ];
        }, $documents);
    } catch (Exception $e) {
        error_log("Documents error: " . $e->getMessage());
        $data['documents'] = [];
    }
    
    // Get announcements
    try {
        $stmt = $pdo->query("
            SELECT * FROM hr_announcements
            WHERE is_active = 1 AND (expires_at IS NULL OR expires_at >= CURDATE())
            ORDER BY priority DESC, created_at DESC
            LIMIT 5
        ");
        $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $data['announcements'] = array_map(function($a) {
            return [
                'id' => $a['id'],
                'title' => $a['title'],
                'message' => $a['message'],
                'date' => $a['created_at'],
                'priority' => $a['priority']
            ];
        }, $announcements);
    } catch (Exception $e) {
        error_log("Announcements error: " . $e->getMessage());
        $data['announcements'] = [];
    }
    
    return $data;
}

function submitLeaveRequest($pdo, $data) {
    $teacherId = $data['teacher_id'];
    $leaveType = $data['leave_type'];
    $startDate = $data['start_date'];
    $endDate = $data['end_date'];
    $reason = $data['reason'] ?? '';
    $contact = $data['contact_during_leave'] ?? '';
    $handover = $data['handover_to'] ?? '';
    
    // Calculate days
    $start = new DateTime($startDate);
    $end = new DateTime($endDate);
    $days = $end->diff($start)->days + 1;
    
    // Check leave balance
    $currentYear = date('Y');
    $stmt = $pdo->prepare("
        SELECT total_days, used_days FROM leave_balance
        WHERE teacher_id = ? AND leave_type = ? AND year = ?
    ");
    $stmt->execute([$teacherId, $leaveType, $currentYear]);
    $balance = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get pending days
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(days), 0) as pending
        FROM leave_requests
        WHERE teacher_id = ? AND leave_type = ? AND status = 'pending' AND YEAR(start_date) = ?
    ");
    $stmt->execute([$teacherId, $leaveType, $currentYear]);
    $pending = $stmt->fetch(PDO::FETCH_ASSOC)['pending'];
    
    if ($balance) {
        $available = $balance['total_days'] - $balance['used_days'] - $pending;
        if ($days > $available) {
            return ['success' => false, 'error' => "Insufficient leave balance. Available: {$available} days"];
        }
    }
    
    // Insert leave request
    $stmt = $pdo->prepare("
        INSERT INTO leave_requests (teacher_id, leave_type, start_date, end_date, days, reason, contact_during_leave, handover_to)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$teacherId, $leaveType, $startDate, $endDate, $days, $reason, $contact, $handover]);
    
    return ['success' => true, 'message' => 'Leave request submitted successfully', 'id' => $pdo->lastInsertId()];
}

function requestDocument($pdo, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO document_requests (teacher_id, document_type, purpose, copies, urgent)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['teacher_id'],
        $data['document_type'],
        $data['purpose'] ?? '',
        $data['copies'] ?? 1,
        $data['urgent'] ? 1 : 0
    ]);
    
    return ['success' => true, 'message' => 'Document request submitted successfully', 'id' => $pdo->lastInsertId()];
}

function updateLeaveStatus($pdo, $leaveId, $status, $approvedBy) {
    $stmt = $pdo->prepare("
        UPDATE leave_requests
        SET status = ?, approved_by = ?, approved_date = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$status, $approvedBy, $leaveId]);
    
    // If approved, update leave balance
    if ($status === 'approved') {
        $stmt = $pdo->prepare("SELECT teacher_id, leave_type, days FROM leave_requests WHERE id = ?");
        $stmt->execute([$leaveId]);
        $request = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($request) {
            $currentYear = date('Y');
            $stmt = $pdo->prepare("
                INSERT INTO leave_balance (teacher_id, leave_type, total_days, used_days, year)
                VALUES (?, ?, 21, ?, ?)
                ON DUPLICATE KEY UPDATE used_days = used_days + ?
            ");
            $stmt->execute([
                $request['teacher_id'],
                $request['leave_type'],
                $request['days'],
                $currentYear,
                $request['days']
            ]);
        }
    }
    
    return ['success' => true, 'message' => "Leave request {$status}"];
}

function cancelLeaveRequest($pdo, $leaveId) {
    $stmt = $pdo->prepare("
        UPDATE leave_requests SET status = 'cancelled' WHERE id = ? AND status = 'pending'
    ");
    $stmt->execute([$leaveId]);
    
    if ($stmt->rowCount() > 0) {
        return ['success' => true, 'message' => 'Leave request cancelled'];
    }
    return ['success' => false, 'error' => 'Cannot cancel this leave request'];
}

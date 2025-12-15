<?php
/**
 * Notifications API
 * Send email and SMS notifications
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
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

// Only load vendor if it exists
$vendorPath = __DIR__ . '/../../backend/vendor/autoload.php';
if (file_exists($vendorPath)) {
    require_once $vendorPath;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create notifications table if not exists
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                type VARCHAR(50) DEFAULT 'info',
                link VARCHAR(255) NULL,
                is_read TINYINT(1) DEFAULT 0,
                read_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_is_read (is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        // Add link column if it doesn't exist (for existing tables)
        try {
            $pdo->exec("ALTER TABLE notifications ADD COLUMN link VARCHAR(255) NULL AFTER type");
        } catch (Exception $e) {
            // Column might already exist
        }
    } catch (Exception $e) {
        // Table might already exist with different structure, continue
        error_log("Notifications table creation: " . $e->getMessage());
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    $userId = $_GET['user_id'] ?? null;
    $notificationId = $_GET['id'] ?? null;
    $limit = min((int)($_GET['limit'] ?? 50), 100);

    // Handle simple GET requests for fetching notifications (no action required)
    if ($method === 'GET' && !$action && $userId) {
        try {
            $sql = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT " . intval($limit);
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Cast is_read to boolean for proper JSON handling
            foreach ($notifications as &$notification) {
                $notification['is_read'] = (bool)(int)$notification['is_read'];
            }
            
            echo json_encode(['success' => true, 'notifications' => $notifications]);
        } catch (Exception $e) {
            // If table doesn't exist, return empty array
            echo json_encode(['success' => true, 'notifications' => []]);
        }
        exit;
    }

    // Handle PUT requests for marking as read
    if ($method === 'PUT' && $notificationId) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Try to add read_at column if it doesn't exist
            try {
                $pdo->exec("ALTER TABLE notifications ADD COLUMN read_at DATETIME NULL AFTER is_read");
            } catch (Exception $e) {
                // Column might already exist, ignore
            }
            
            // Try with read_at first, fallback to without
            try {
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?");
                $stmt->execute([(int)$notificationId]);
            } catch (Exception $e) {
                // Fallback without read_at
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
                $stmt->execute([(int)$notificationId]);
            }
            
            $rowsAffected = $stmt->rowCount();
            echo json_encode([
                'success' => true, 
                'message' => 'Notification marked as read',
                'rows_affected' => $rowsAffected,
                'notification_id' => (int)$notificationId
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false, 
                'error' => $e->getMessage(),
                'notification_id' => $notificationId
            ]);
        }
        exit;
    }

    // Handle PUT for mark all read
    if ($method === 'PUT' && $userId && $action === 'mark_all_read') {
        try {
            // Try with read_at first, fallback to without
            try {
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0");
                $stmt->execute([$userId]);
            } catch (Exception $e) {
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
                $stmt->execute([$userId]);
            }
            echo json_encode(['success' => true, 'message' => 'All notifications marked as read']);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    // Handle DELETE
    if ($method === 'DELETE' && $notificationId) {
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ?");
        $stmt->execute([$notificationId]);
        echo json_encode(['success' => true]);
        exit;
    }

    // Handle POST for creating notifications
    if ($method === 'POST' && !$action) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $userId = $data['user_id'] ?? null;
        $title = $data['title'] ?? 'Notification';
        $message = $data['message'] ?? '';
        $type = $data['type'] ?? 'info';
        $link = $data['link'] ?? null;
        
        if (!$userId) {
            echo json_encode(['success' => false, 'error' => 'User ID required']);
            exit;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, NOW())
        ");
        $stmt->execute([$userId, $title, $message, $type, $link]);
        
        echo json_encode([
            'success' => true, 
            'notification_id' => $pdo->lastInsertId(),
            'message' => 'Notification created'
        ]);
        exit;
    }

    // For email/SMS services, check if classes exist
    $emailService = null;
    $smsService = null;
    
    if (class_exists('McSMS\\Notifications\\EmailService')) {
        $emailConfig = [
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'username' => '',
            'password' => '',
            'from_email' => 'noreply@mcsms.edu.gh',
            'from_name' => 'McSMS School'
        ];
        $emailService = new McSMS\Notifications\EmailService($emailConfig);
    }
    
    if (class_exists('McSMS\\Notifications\\SMSService')) {
        $smsConfig = [
            'provider' => 'arkesel',
            'api_key' => '',
            'sender_id' => 'McSMS'
        ];
        $smsService = new McSMS\Notifications\SMSService($smsConfig);
    }
    
    switch ($action) {
        case 'send_invoice_notification':
            $data = json_decode(file_get_contents('php://input'), true);
            $invoiceId = $data['invoice_id'] ?? null;
            
            if (!$invoiceId) {
                throw new Exception('Invoice ID required');
            }
            
            // Get invoice and parent email
            $stmt = $pdo->prepare("
                SELECT 
                    i.*,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name,
                    u.email as parent_email
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                JOIN users u ON s.parent_id = u.id
                WHERE i.id = ?
            ");
            $stmt->execute([$invoiceId]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invoice) {
                throw new Exception('Invoice not found');
            }
            
            $result = $emailService->sendInvoiceNotification($invoice, $invoice['parent_email']);
            
            // Log notification
            if ($result['success']) {
                $stmt = $pdo->prepare("
                    INSERT INTO notifications (user_id, type, title, message, created_at)
                    VALUES ((SELECT parent_id FROM students WHERE id = ?), 'invoice', 'New Invoice', ?, NOW())
                ");
                $stmt->execute([$invoice['student_id'], "Invoice {$invoice['invoice_number']} has been generated"]);
            }
            
            echo json_encode($result);
            break;

        case 'send_payment_confirmation':
            $data = json_decode(file_get_contents('php://input'), true);
            $paymentId = $data['payment_id'] ?? null;
            
            if (!$paymentId) {
                throw new Exception('Payment ID required');
            }
            
            // Get payment and parent email
            $stmt = $pdo->prepare("
                SELECT 
                    p.*,
                    i.invoice_number,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name,
                    u.email as parent_email
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                JOIN users u ON s.parent_id = u.id
                WHERE p.id = ?
            ");
            $stmt->execute([$paymentId]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$payment) {
                throw new Exception('Payment not found');
            }
            
            // Generate receipt number
            if (empty($payment['receipt_number'])) {
                $payment['receipt_number'] = 'RCP-' . str_pad($payment['id'], 6, '0', STR_PAD_LEFT);
            }
            
            $result = $emailService->sendPaymentConfirmation($payment, $payment['parent_email']);
            
            echo json_encode($result);
            break;

        case 'send_application_status':
            $data = json_decode(file_get_contents('php://input'), true);
            $applicationId = $data['application_id'] ?? null;
            $status = $data['status'] ?? null;
            
            if (!$applicationId || !$status) {
                throw new Exception('Application ID and status required');
            }
            
            // Get application and parent email
            $stmt = $pdo->prepare("
                SELECT 
                    a.*,
                    u.email as parent_email
                FROM student_applications a
                JOIN users u ON a.parent_id = u.id
                WHERE a.id = ?
            ");
            $stmt->execute([$applicationId]);
            $application = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$application) {
                throw new Exception('Application not found');
            }
            
            $result = $emailService->sendApplicationStatus($application, $application['parent_email'], $status);
            
            // Log notification
            if ($result['success']) {
                $stmt = $pdo->prepare("
                    INSERT INTO notifications (user_id, type, title, message, created_at)
                    VALUES (?, 'application', 'Application Status Update', ?, NOW())
                ");
                $stmt->execute([$application['parent_id'], "Your application has been {$status}"]);
            }
            
            echo json_encode($result);
            break;

        case 'send_attendance_alert':
            $data = json_decode(file_get_contents('php://input'), true);
            $studentId = $data['student_id'] ?? null;
            $date = $data['date'] ?? null;
            $status = $data['status'] ?? null;
            
            if (!$studentId || !$date || !$status) {
                throw new Exception('Student ID, date, and status required');
            }
            
            // Get student and parent email
            $stmt = $pdo->prepare("
                SELECT 
                    s.*,
                    u.email as parent_email
                FROM students s
                JOIN users u ON s.parent_id = u.id
                WHERE s.id = ?
            ");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student) {
                throw new Exception('Student not found');
            }
            
            $result = $emailService->sendAttendanceAlert($student, $student['parent_email'], $date, $status);
            
            echo json_encode($result);
            break;

        case 'send_homework_reminder':
            $data = json_decode(file_get_contents('php://input'), true);
            $homeworkId = $data['homework_id'] ?? null;
            $studentId = $data['student_id'] ?? null;
            
            if (!$homeworkId || !$studentId) {
                throw new Exception('Homework ID and student ID required');
            }
            
            // Get homework details
            $stmt = $pdo->prepare("
                SELECT 
                    h.*,
                    s.subject_name
                FROM homework h
                JOIN subjects s ON h.subject_id = s.id
                WHERE h.id = ?
            ");
            $stmt->execute([$homeworkId]);
            $homework = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get student and parent email
            $stmt = $pdo->prepare("
                SELECT 
                    s.*,
                    u.email as parent_email
                FROM students s
                JOIN users u ON s.parent_id = u.id
                WHERE s.id = ?
            ");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$homework || !$student) {
                throw new Exception('Homework or student not found');
            }
            
            $result = $emailService->sendHomeworkReminder($homework, $student['parent_email'], $student);
            
            echo json_encode($result);
            break;

        case 'send_report_card_notification':
            $data = json_decode(file_get_contents('php://input'), true);
            $studentId = $data['student_id'] ?? null;
            $termId = $data['term_id'] ?? null;
            
            if (!$studentId || !$termId) {
                throw new Exception('Student ID and term ID required');
            }
            
            // Get student and parent email
            $stmt = $pdo->prepare("
                SELECT 
                    s.*,
                    u.email as parent_email
                FROM students s
                JOIN users u ON s.parent_id = u.id
                WHERE s.id = ?
            ");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get term details
            $stmt = $pdo->prepare("
                SELECT t.*, ses.session_name
                FROM academic_terms t
                JOIN academic_sessions ses ON t.session_id = ses.id
                WHERE t.id = ?
            ");
            $stmt->execute([$termId]);
            $term = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student || !$term) {
                throw new Exception('Student or term not found');
            }
            
            $result = $emailService->sendReportCardNotification($student, $student['parent_email'], $term);
            
            echo json_encode($result);
            break;

        case 'send_fee_reminder':
            $data = json_decode(file_get_contents('php://input'), true);
            $invoiceId = $data['invoice_id'] ?? null;
            
            if (!$invoiceId) {
                throw new Exception('Invoice ID required');
            }
            
            // Get overdue invoice
            $stmt = $pdo->prepare("
                SELECT 
                    i.*,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name,
                    u.email as parent_email,
                    DATEDIFF(CURDATE(), i.due_date) as days_overdue
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                JOIN users u ON s.parent_id = u.id
                WHERE i.id = ? AND i.balance > 0
            ");
            $stmt->execute([$invoiceId]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invoice) {
                throw new Exception('Invoice not found or already paid');
            }
            
            $result = $emailService->sendFeeReminder($invoice, $invoice['parent_email'], $invoice['days_overdue']);
            
            echo json_encode($result);
            break;

        case 'send_bulk_reminders':
            // Send reminders to all overdue invoices
            $stmt = $pdo->query("
                SELECT 
                    i.*,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name,
                    u.email as parent_email,
                    DATEDIFF(CURDATE(), i.due_date) as days_overdue
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                JOIN users u ON s.parent_id = u.id
                WHERE i.balance > 0 
                AND DATEDIFF(CURDATE(), i.due_date) > 0
                AND i.status != 'cancelled'
            ");
            
            $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $sent = 0;
            $failed = 0;
            
            foreach ($invoices as $invoice) {
                $result = $emailService->sendFeeReminder($invoice, $invoice['parent_email'], $invoice['days_overdue']);
                if ($result['success']) {
                    $sent++;
                } else {
                    $failed++;
                }
            }
            
            echo json_encode([
                'success' => true,
                'total' => count($invoices),
                'sent' => $sent,
                'failed' => $failed
            ]);
            break;

        case 'get_notifications':
            $userId = $_GET['user_id'] ?? null;
            
            if (!$userId) {
                throw new Exception('User ID required');
            }
            
            $stmt = $pdo->prepare("
                SELECT * FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 50
            ");
            $stmt->execute([$userId]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'notifications' => $notifications]);
            break;

        case 'mark_as_read':
            $data = json_decode(file_get_contents('php://input'), true);
            $notificationId = $data['notification_id'] ?? null;
            
            if (!$notificationId) {
                throw new Exception('Notification ID required');
            }
            
            $stmt = $pdo->prepare("
                UPDATE notifications SET is_read = 1, read_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$notificationId]);
            
            echo json_encode(['success' => true]);
            break;

        // ============================================
        // SMS ENDPOINTS
        // ============================================
        
        case 'send_sms':
            $data = json_decode(file_get_contents('php://input'), true);
            $phone = $data['phone'] ?? null;
            $message = $data['message'] ?? null;
            
            if (!$phone || !$message) {
                throw new Exception('Phone and message required');
            }
            
            $result = $smsService->send($phone, $message);
            echo json_encode($result);
            break;

        case 'send_bulk_sms':
            $data = json_decode(file_get_contents('php://input'), true);
            $recipients = $data['recipients'] ?? [];
            $message = $data['message'] ?? null;
            
            if (empty($recipients) || !$message) {
                throw new Exception('Recipients and message required');
            }
            
            $result = $smsService->sendBulk($recipients, $message);
            echo json_encode($result);
            break;

        case 'send_payment_sms':
            $data = json_decode(file_get_contents('php://input'), true);
            $paymentId = $data['payment_id'] ?? null;
            
            if (!$paymentId) {
                throw new Exception('Payment ID required');
            }
            
            // Get payment and parent phone
            $stmt = $pdo->prepare("
                SELECT 
                    p.*,
                    i.invoice_number,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    u.phone as parent_phone
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                JOIN students s ON i.student_id = s.id
                JOIN users u ON s.parent_id = u.id
                WHERE p.id = ?
            ");
            $stmt->execute([$paymentId]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$payment || empty($payment['parent_phone'])) {
                throw new Exception('Payment not found or phone number missing');
            }
            
            if (empty($payment['receipt_number'])) {
                $payment['receipt_number'] = 'RCP-' . str_pad($payment['id'], 6, '0', STR_PAD_LEFT);
            }
            
            $result = $smsService->sendPaymentConfirmation($payment, $payment['parent_phone']);
            echo json_encode($result);
            break;

        case 'send_invoice_sms':
            $data = json_decode(file_get_contents('php://input'), true);
            $invoiceId = $data['invoice_id'] ?? null;
            
            if (!$invoiceId) {
                throw new Exception('Invoice ID required');
            }
            
            // Get invoice and parent phone
            $stmt = $pdo->prepare("
                SELECT 
                    i.*,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    u.phone as parent_phone
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                JOIN users u ON s.parent_id = u.id
                WHERE i.id = ?
            ");
            $stmt->execute([$invoiceId]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invoice || empty($invoice['parent_phone'])) {
                throw new Exception('Invoice not found or phone number missing');
            }
            
            $result = $smsService->sendInvoiceReminder($invoice, $invoice['parent_phone']);
            echo json_encode($result);
            break;

        case 'send_attendance_sms':
            $data = json_decode(file_get_contents('php://input'), true);
            $studentId = $data['student_id'] ?? null;
            $date = $data['date'] ?? null;
            $status = $data['status'] ?? null;
            
            if (!$studentId || !$date || !$status) {
                throw new Exception('Student ID, date, and status required');
            }
            
            // Get student and parent phone
            $stmt = $pdo->prepare("
                SELECT 
                    s.*,
                    u.phone as parent_phone
                FROM students s
                JOIN users u ON s.parent_id = u.id
                WHERE s.id = ?
            ");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student || empty($student['parent_phone'])) {
                throw new Exception('Student not found or phone number missing');
            }
            
            $result = $smsService->sendAttendanceAlert($student, $student['parent_phone'], $date, $status);
            echo json_encode($result);
            break;

        case 'get_sms_balance':
            $result = $smsService->getBalance();
            echo json_encode($result);
            break;

        default:
            // If no valid action and we got here, return empty notifications
            echo json_encode(['success' => true, 'notifications' => []]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

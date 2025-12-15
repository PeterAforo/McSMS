<?php
/**
 * Notifications API
 * Send email and SMS notifications
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
require_once __DIR__ . '/../../backend/vendor/autoload.php';

use McSMS\Notifications\EmailService;
use McSMS\Notifications\SMSService;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    
    // Initialize email service
    $emailConfig = [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => '', // Configure in production
        'password' => '', // Configure in production
        'from_email' => 'noreply@mcsms.edu.gh',
        'from_name' => 'McSMS School'
    ];
    
    $emailService = new EmailService($emailConfig);
    
    // Initialize SMS service
    $smsConfig = [
        'provider' => 'arkesel', // arkesel, hubtel, twilio
        'api_key' => '', // Configure in production
        'sender_id' => 'McSMS'
    ];
    
    $smsService = new SMSService($smsConfig);

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
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

<?php
/**
 * Email Notifications API
 * Trigger email notifications for key events
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|eea\.mcaforo\.com)(:\d+)?$/', $origin)) {
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

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../vendor/autoload.php';

use McSMS\Notifications\EmailService;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create email_logs table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS email_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            recipient_email VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            email_type VARCHAR(50) NOT NULL,
            status ENUM('sent', 'failed', 'queued') DEFAULT 'queued',
            error_message TEXT NULL,
            related_id INT NULL,
            related_type VARCHAR(50) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            sent_at DATETIME NULL,
            INDEX idx_recipient (recipient_email),
            INDEX idx_type (email_type),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    $data = json_decode(file_get_contents('php://input'), true) ?? [];

    $emailService = new EmailService();

    switch ($action) {
        case 'send_welcome':
            // Send welcome email to new user
            if (empty($data['user_id'])) {
                throw new Exception('User ID required');
            }
            
            $stmt = $pdo->prepare("SELECT id, CONCAT(first_name, ' ', last_name) as name, email, user_type FROM users WHERE id = ?");
            $stmt->execute([$data['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                throw new Exception('User not found');
            }
            
            $result = $emailService->sendWelcomeEmail($user);
            logEmail($pdo, $user['email'], "Welcome to McSMS", 'welcome', $result, $user['id'], 'user');
            
            echo json_encode($result);
            break;

        case 'send_invoice':
            // Send invoice notification
            if (empty($data['invoice_id'])) {
                throw new Exception('Invoice ID required');
            }
            
            $stmt = $pdo->prepare("
                SELECT i.*, s.first_name, s.last_name, c.class_name,
                       CONCAT(s.first_name, ' ', s.last_name) as student_name,
                       p.email as parent_email
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                LEFT JOIN classes c ON s.class_id = c.id
                LEFT JOIN users p ON s.parent_id = p.id
                WHERE i.id = ?
            ");
            $stmt->execute([$data['invoice_id']]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invoice || !$invoice['parent_email']) {
                throw new Exception('Invoice not found or parent email missing');
            }
            
            $result = $emailService->sendInvoiceNotification($invoice, $invoice['parent_email']);
            logEmail($pdo, $invoice['parent_email'], "New Invoice - {$invoice['invoice_number']}", 'invoice', $result, $invoice['id'], 'invoice');
            
            echo json_encode($result);
            break;

        case 'send_payment_confirmation':
            // Send payment confirmation
            if (empty($data['payment_id'])) {
                throw new Exception('Payment ID required');
            }
            
            $stmt = $pdo->prepare("
                SELECT pay.*, i.invoice_number, 
                       CONCAT(s.first_name, ' ', s.last_name) as student_name,
                       p.email as parent_email
                FROM payments pay
                JOIN invoices i ON pay.invoice_id = i.id
                JOIN students s ON i.student_id = s.id
                LEFT JOIN users p ON s.parent_id = p.id
                WHERE pay.id = ?
            ");
            $stmt->execute([$data['payment_id']]);
            $payment = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$payment || !$payment['parent_email']) {
                throw new Exception('Payment not found or parent email missing');
            }
            
            $result = $emailService->sendPaymentConfirmation($payment, $payment['parent_email']);
            logEmail($pdo, $payment['parent_email'], "Payment Received - {$payment['receipt_number']}", 'payment', $result, $payment['id'], 'payment');
            
            echo json_encode($result);
            break;

        case 'send_attendance_alert':
            // Send attendance alert
            if (empty($data['student_id']) || empty($data['date']) || empty($data['status'])) {
                throw new Exception('Student ID, date, and status required');
            }
            
            $stmt = $pdo->prepare("
                SELECT s.*, p.email as parent_email
                FROM students s
                LEFT JOIN users p ON s.parent_id = p.id
                WHERE s.id = ?
            ");
            $stmt->execute([$data['student_id']]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student || !$student['parent_email']) {
                throw new Exception('Student not found or parent email missing');
            }
            
            $result = $emailService->sendAttendanceAlert($student, $student['parent_email'], $data['date'], $data['status']);
            logEmail($pdo, $student['parent_email'], "Attendance Alert - {$student['first_name']}", 'attendance', $result, $student['id'], 'student');
            
            echo json_encode($result);
            break;

        case 'send_report_card':
            // Send report card notification
            if (empty($data['student_id']) || empty($data['term_id'])) {
                throw new Exception('Student ID and term ID required');
            }
            
            $stmt = $pdo->prepare("
                SELECT s.*, p.email as parent_email
                FROM students s
                LEFT JOIN users p ON s.parent_id = p.id
                WHERE s.id = ?
            ");
            $stmt->execute([$data['student_id']]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->prepare("SELECT * FROM academic_terms WHERE id = ?");
            $stmt->execute([$data['term_id']]);
            $term = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student || !$term || !$student['parent_email']) {
                throw new Exception('Student, term not found, or parent email missing');
            }
            
            $result = $emailService->sendReportCardNotification($student, $student['parent_email'], $term);
            logEmail($pdo, $student['parent_email'], "Report Card Available - {$term['term_name']}", 'report_card', $result, $student['id'], 'student');
            
            echo json_encode($result);
            break;

        case 'send_fee_reminder':
            // Send fee reminder for overdue invoices
            if (empty($data['invoice_id'])) {
                throw new Exception('Invoice ID required');
            }
            
            $stmt = $pdo->prepare("
                SELECT i.*, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                       p.email as parent_email,
                       DATEDIFF(CURDATE(), i.due_date) as days_overdue
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                LEFT JOIN users p ON s.parent_id = p.id
                WHERE i.id = ? AND i.status != 'paid'
            ");
            $stmt->execute([$data['invoice_id']]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invoice || !$invoice['parent_email']) {
                throw new Exception('Invoice not found or parent email missing');
            }
            
            $daysOverdue = max(0, $invoice['days_overdue']);
            $result = $emailService->sendFeeReminder($invoice, $invoice['parent_email'], $daysOverdue);
            logEmail($pdo, $invoice['parent_email'], "Fee Payment Reminder - {$invoice['invoice_number']}", 'fee_reminder', $result, $invoice['id'], 'invoice');
            
            echo json_encode($result);
            break;

        case 'send_bulk_fee_reminders':
            // Send fee reminders for all overdue invoices
            $daysOverdue = (int)($data['days_overdue'] ?? 7);
            
            $stmt = $pdo->prepare("
                SELECT i.*, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                       p.email as parent_email,
                       DATEDIFF(CURDATE(), i.due_date) as days_overdue
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                LEFT JOIN users p ON s.parent_id = p.id
                WHERE i.status != 'paid' 
                AND i.balance > 0
                AND DATEDIFF(CURDATE(), i.due_date) >= ?
            ");
            $stmt->execute([$daysOverdue]);
            $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $sent = 0;
            $failed = 0;
            
            foreach ($invoices as $invoice) {
                if (!$invoice['parent_email']) continue;
                
                $result = $emailService->sendFeeReminder($invoice, $invoice['parent_email'], $invoice['days_overdue']);
                logEmail($pdo, $invoice['parent_email'], "Fee Payment Reminder - {$invoice['invoice_number']}", 'fee_reminder', $result, $invoice['id'], 'invoice');
                
                if ($result['success']) {
                    $sent++;
                } else {
                    $failed++;
                }
                
                // Small delay to avoid rate limiting
                usleep(100000); // 100ms
            }
            
            echo json_encode([
                'success' => true,
                'total' => count($invoices),
                'sent' => $sent,
                'failed' => $failed
            ]);
            break;

        case 'get_logs':
            // Get email logs
            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $type = $_GET['type'] ?? null;
            
            $sql = "SELECT * FROM email_logs";
            $params = [];
            
            if ($type) {
                $sql .= " WHERE email_type = ?";
                $params[] = $type;
            }
            
            $sql .= " ORDER BY created_at DESC LIMIT " . intval($limit);
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'logs' => $logs]);
            break;

        case 'get_stats':
            // Get email statistics
            $stmt = $pdo->query("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
                FROM email_logs
            ");
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->query("
                SELECT email_type, COUNT(*) as count
                FROM email_logs
                GROUP BY email_type
                ORDER BY count DESC
            ");
            $byType = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'stats' => $stats,
                'by_type' => $byType
            ]);
            break;

        case 'test':
            // Test email configuration
            if (empty($data['email'])) {
                throw new Exception('Test email address required');
            }
            
            $result = $emailService->send(
                $data['email'],
                'McSMS Email Test',
                '<h1>Email Configuration Test</h1><p>If you received this email, your email configuration is working correctly!</p><p>Sent at: ' . date('Y-m-d H:i:s') . '</p>'
            );
            
            logEmail($pdo, $data['email'], 'McSMS Email Test', 'test', $result, null, null);
            
            echo json_encode($result);
            break;

        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action. Available actions: send_welcome, send_invoice, send_payment_confirmation, send_attendance_alert, send_report_card, send_fee_reminder, send_bulk_fee_reminders, get_logs, get_stats, test']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Log email send attempt
 */
function logEmail($pdo, $email, $subject, $type, $result, $relatedId = null, $relatedType = null) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO email_logs (recipient_email, subject, email_type, status, error_message, related_id, related_type, sent_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $email,
            $subject,
            $type,
            $result['success'] ? 'sent' : 'failed',
            $result['error'] ?? null,
            $relatedId,
            $relatedType,
            $result['success'] ? date('Y-m-d H:i:s') : null
        ]);
    } catch (Exception $e) {
        error_log("Failed to log email: " . $e->getMessage());
    }
}

<?php
/**
 * Cron Job: Process Appointment Reminders
 * Run this every 5-10 minutes via cron: php process_reminders.php
 * 
 * Example crontab entry:
 * Run every 5 minutes: /usr/bin/php /path/to/McSMS/backend/cron/process_reminders.php
 */

require_once __DIR__ . '/../../config/database.php';

// Load email/SMS configuration if exists
$emailConfig = [];
$smsConfig = [];

$configFile = __DIR__ . '/../../config/notifications.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Get pending reminders that are due
    $stmt = $pdo->prepare("
        SELECT ar.*, ea.selected_date, ea.location, ea.room, ea.appointment_type, ea.subjects,
               sa.first_name, sa.last_name, u.name as parent_name
        FROM appointment_reminders ar
        JOIN exam_appointments ea ON ar.appointment_id = ea.id
        JOIN student_applications sa ON ea.application_id = sa.id
        LEFT JOIN users u ON ar.recipient_id = u.id
        WHERE ar.status = 'pending' 
        AND ar.scheduled_for <= NOW()
        AND ea.status IN ('scheduled', 'confirmed')
        ORDER BY ar.scheduled_for ASC
        LIMIT 50
    ");
    $stmt->execute();
    $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $processed = 0;
    $errors = 0;

    foreach ($reminders as $reminder) {
        try {
            $success = false;
            $errorMsg = null;

            switch ($reminder['reminder_type']) {
                case 'email':
                    $result = sendEmailReminder($reminder);
                    $success = $result['success'];
                    $errorMsg = $result['error'] ?? null;
                    break;

                case 'sms':
                    $result = sendSmsReminder($reminder);
                    $success = $result['success'];
                    $errorMsg = $result['error'] ?? null;
                    break;

                case 'in_app':
                    $result = sendInAppReminder($pdo, $reminder);
                    $success = $result['success'];
                    $errorMsg = $result['error'] ?? null;
                    break;

                default:
                    $errorMsg = "Unknown reminder type: {$reminder['reminder_type']}";
            }

            // Update reminder status
            $stmt = $pdo->prepare("
                UPDATE appointment_reminders 
                SET status = ?, sent_at = NOW(), error_message = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $success ? 'sent' : 'failed',
                $errorMsg,
                $reminder['id']
            ]);

            if ($success) {
                $processed++;
            } else {
                $errors++;
            }

        } catch (Exception $e) {
            $stmt = $pdo->prepare("
                UPDATE appointment_reminders 
                SET status = 'failed', error_message = ?
                WHERE id = ?
            ");
            $stmt->execute([$e->getMessage(), $reminder['id']]);
            $errors++;
        }
    }

    echo json_encode([
        'success' => true,
        'processed' => $processed,
        'errors' => $errors,
        'total' => count($reminders)
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit(1);
}

function sendEmailReminder($reminder) {
    $to = $reminder['recipient_contact'];
    $studentName = $reminder['first_name'] . ' ' . $reminder['last_name'];
    $appointmentDate = date('F j, Y \a\t g:i A', strtotime($reminder['selected_date']));
    $appointmentType = ucfirst($reminder['appointment_type']);
    
    $subject = "Reminder: {$appointmentType} Appointment for {$studentName}";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
            .highlight { color: #6366f1; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>📅 Appointment Reminder</h2>
            </div>
            <div class='content'>
                <p>Dear {$reminder['parent_name']},</p>
                <p>This is a reminder about the upcoming <span class='highlight'>{$appointmentType}</span> appointment for <strong>{$studentName}</strong>.</p>
                
                <div class='details'>
                    <p><strong>📅 Date & Time:</strong> {$appointmentDate}</p>
                    <p><strong>📍 Location:</strong> {$reminder['location']}</p>
                    " . ($reminder['room'] ? "<p><strong>🚪 Room:</strong> {$reminder['room']}</p>" : "") . "
                    " . ($reminder['subjects'] ? "<p><strong>📚 Subjects:</strong> {$reminder['subjects']}</p>" : "") . "
                </div>
                
                <p>Please arrive 15 minutes early. Bring any required documents.</p>
                <p>If you need to reschedule, please contact us as soon as possible.</p>
            </div>
            <div class='footer'>
                <p>This is an automated reminder from McSMS School Management System</p>
            </div>
        </div>
    </body>
    </html>
    ";

    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: McSMS <noreply@mcaforo.com>',
        'X-Mailer: PHP/' . phpversion()
    ];

    // Try to send email
    $sent = @mail($to, $subject, $message, implode("\r\n", $headers));
    
    if ($sent) {
        return ['success' => true];
    } else {
        return ['success' => false, 'error' => 'Failed to send email'];
    }
}

function sendSmsReminder($reminder) {
    $phone = $reminder['recipient_contact'];
    $studentName = $reminder['first_name'] . ' ' . $reminder['last_name'];
    $appointmentDate = date('M j, Y g:i A', strtotime($reminder['selected_date']));
    $appointmentType = ucfirst($reminder['appointment_type']);
    
    $message = "REMINDER: {$appointmentType} for {$studentName} on {$appointmentDate} at {$reminder['location']}. Please arrive 15 mins early. -McSMS";
    
    // Check for SMS gateway configuration
    global $smsConfig;
    
    if (empty($smsConfig) || empty($smsConfig['api_key'])) {
        // Log the SMS for manual sending or future integration
        error_log("SMS Reminder (no gateway configured): To: {$phone}, Message: {$message}");
        return ['success' => true, 'error' => 'SMS logged (no gateway configured)'];
    }
    
    // Example: Hubtel SMS Gateway (Ghana)
    // Modify this section based on your SMS provider
    try {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $smsConfig['api_url'] ?? 'https://sms.hubtel.com/v1/messages/send',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'From' => $smsConfig['sender_id'] ?? 'McSMS',
                'To' => $phone,
                'Content' => $message
            ]),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Basic ' . base64_encode($smsConfig['api_key'] . ':' . $smsConfig['api_secret'])
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true];
        } else {
            return ['success' => false, 'error' => "SMS API error: HTTP {$httpCode}"];
        }
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function sendInAppReminder($pdo, $reminder) {
    $studentName = $reminder['first_name'] . ' ' . $reminder['last_name'];
    $appointmentDate = date('F j, Y \a\t g:i A', strtotime($reminder['selected_date']));
    $appointmentType = ucfirst($reminder['appointment_type']);
    
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, title, message, type, created_at)
        VALUES (?, ?, ?, 'appointment_reminder', NOW())
    ");
    $stmt->execute([
        $reminder['recipient_id'],
        "⏰ Upcoming {$appointmentType}",
        "Reminder: {$appointmentType} for {$studentName} is scheduled for {$appointmentDate} at {$reminder['location']}."
    ]);
    
    return ['success' => true];
}

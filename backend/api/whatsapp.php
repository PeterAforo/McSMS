<?php
/**
 * WhatsApp Messaging API
 * Integration with WhatsApp Business API / Cloud API
 * 
 * Supports:
 * - Direct WhatsApp Web links (free, opens WhatsApp)
 * - WhatsApp Business API (requires Meta Business account)
 * - Third-party providers (Twilio, MessageBird, etc.)
 */

header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create required tables
    try {
        // Create whatsapp_messages table if not exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS whatsapp_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recipient_phone VARCHAR(20) NOT NULL,
                recipient_name VARCHAR(100),
                recipient_type ENUM('parent', 'teacher', 'student', 'other') DEFAULT 'parent',
                message TEXT NOT NULL,
                template_name VARCHAR(100),
                status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending',
                sent_by INT,
                sent_at TIMESTAMP NULL,
                delivered_at TIMESTAMP NULL,
                read_at TIMESTAMP NULL,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_phone (recipient_phone),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        // Create whatsapp_templates table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS whatsapp_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                category ENUM('fee_reminder', 'attendance', 'exam', 'general', 'admission', 'event') NOT NULL,
                message_template TEXT NOT NULL,
                variables JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        // Create school_settings table if not exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS school_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) NOT NULL UNIQUE,
                setting_value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    } catch (Exception $e) {
        // Tables might already exist with different structure, continue
        error_log("WhatsApp table creation: " . $e->getMessage());
    }

    // Insert default templates if not exist
    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM whatsapp_templates");
        if ($stmt->fetchColumn() == 0) {
            $pdo->exec("
                INSERT INTO whatsapp_templates (name, category, message_template, variables) VALUES
                ('fee_reminder', 'fee_reminder', 'Dear {parent_name}, this is a reminder that the school fees of {amount} for {student_name} is due on {due_date}. Please make payment to avoid late fees. Thank you.', '[\"parent_name\", \"amount\", \"student_name\", \"due_date\"]'),
                ('fee_receipt', 'fee_reminder', 'Dear {parent_name}, we have received your payment of {amount} for {student_name}. Receipt No: {receipt_no}. Thank you for your prompt payment.', '[\"parent_name\", \"amount\", \"student_name\", \"receipt_no\"]'),
                ('attendance_absent', 'attendance', 'Dear {parent_name}, we noticed that {student_name} was absent from school today ({date}). Please inform us if there are any concerns. Thank you.', '[\"parent_name\", \"student_name\", \"date\"]'),
                ('exam_reminder', 'exam', 'Dear {parent_name}, this is a reminder that {student_name} has {exam_name} scheduled for {exam_date}. Please ensure they are well prepared. Good luck!', '[\"parent_name\", \"student_name\", \"exam_name\", \"exam_date\"]'),
                ('exam_results', 'exam', 'Dear {parent_name}, the results for {exam_name} are now available. {student_name} scored {score}% with grade {grade}. View full report on the parent portal.', '[\"parent_name\", \"exam_name\", \"student_name\", \"score\", \"grade\"]'),
                ('admission_offer', 'admission', 'Dear {parent_name}, congratulations! Your application for {student_name} has been accepted. Please log in to the parent portal to accept the offer and complete enrollment.', '[\"parent_name\", \"student_name\"]'),
                ('entrance_exam', 'admission', 'Dear {parent_name}, an entrance exam has been scheduled for {student_name} on {exam_date}. Subjects: {subjects}. Please arrive 30 minutes early.', '[\"parent_name\", \"student_name\", \"exam_date\", \"subjects\"]'),
                ('general_announcement', 'general', 'Dear Parent, {message}. For more information, please contact the school office or check the parent portal.', '[\"message\"]'),
                ('event_reminder', 'event', 'Dear {parent_name}, reminder: {event_name} is scheduled for {event_date} at {event_time}. {additional_info}', '[\"parent_name\", \"event_name\", \"event_date\", \"event_time\", \"additional_info\"]'),
                ('homework_reminder', 'general', 'Dear {parent_name}, {student_name} has pending homework in {subject} due on {due_date}. Please ensure it is completed on time.', '[\"parent_name\", \"student_name\", \"subject\", \"due_date\"]')
            ");
        }
    } catch (Exception $e) {
        // Templates might already exist, continue
        error_log("WhatsApp templates insert: " . $e->getMessage());
    }

    switch ($method) {
        case 'GET':
            if ($action === 'templates') {
                // Get all templates
                $stmt = $pdo->query("SELECT * FROM whatsapp_templates WHERE is_active = TRUE ORDER BY category, name");
                $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'templates' => $templates]);
            } 
            elseif ($action === 'history') {
                // Get message history
                $limit = min((int)($_GET['limit'] ?? 50), 200);
                $status = $_GET['status'] ?? '';
                
                $sql = "SELECT * FROM whatsapp_messages WHERE 1=1";
                $params = [];
                
                if ($status) {
                    $sql .= " AND status = ?";
                    $params[] = $status;
                }
                
                $sql .= " ORDER BY created_at DESC LIMIT " . (int)$limit;
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'messages' => $messages]);
            }
            elseif ($action === 'stats') {
                // Get messaging stats
                $stmt = $pdo->query("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
                    FROM whatsapp_messages
                ");
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'stats' => $stats]);
            }
            elseif ($action === 'generate_link') {
                // Generate WhatsApp Web link (free method)
                $phone = $_GET['phone'] ?? '';
                $message = $_GET['message'] ?? '';
                
                // Clean phone number (remove spaces, dashes, etc.)
                $phone = preg_replace('/[^0-9]/', '', $phone);
                
                // Add country code if not present (default Ghana +233)
                if (strlen($phone) == 10 && $phone[0] == '0') {
                    $phone = '233' . substr($phone, 1);
                } elseif (strlen($phone) == 9) {
                    $phone = '233' . $phone;
                }
                
                $encodedMessage = urlencode($message);
                $link = "https://wa.me/{$phone}?text={$encodedMessage}";
                
                echo json_encode(['success' => true, 'link' => $link, 'phone' => $phone]);
            }
            else {
                // Get WhatsApp settings
                $stmt = $pdo->query("SELECT * FROM school_settings WHERE setting_key LIKE 'whatsapp_%'");
                $settings = [];
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    $key = str_replace('whatsapp_', '', $row['setting_key']);
                    $settings[$key] = $row['setting_value'];
                }
                echo json_encode(['success' => true, 'settings' => $settings]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'send') {
                // Send WhatsApp message
                $phone = $data['phone'] ?? '';
                $message = $data['message'] ?? '';
                $recipientName = $data['recipient_name'] ?? '';
                $recipientType = $data['recipient_type'] ?? 'parent';
                $templateName = $data['template_name'] ?? null;
                $sentBy = $data['sent_by'] ?? null;
                $useApi = $data['use_api'] ?? true; // Default to using API
                
                if (!$phone || !$message) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Phone and message are required']);
                    exit;
                }
                
                // Clean phone number
                $phone = preg_replace('/[^0-9]/', '', $phone);
                if (strlen($phone) == 10 && $phone[0] == '0') {
                    $phone = '233' . substr($phone, 1);
                } elseif (strlen($phone) == 9) {
                    $phone = '233' . $phone;
                }
                
                // Log the message initially as pending
                $stmt = $pdo->prepare("
                    INSERT INTO whatsapp_messages (recipient_phone, recipient_name, recipient_type, message, template_name, sent_by, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'pending')
                ");
                $stmt->execute([$phone, $recipientName, $recipientType, $message, $templateName, $sentBy]);
                $messageId = $pdo->lastInsertId();
                
                // Generate WhatsApp link as fallback
                $encodedMessage = urlencode($message);
                $link = "https://wa.me/{$phone}?text={$encodedMessage}";
                
                // Try to send via WhatsApp Business API
                $apiResult = sendViaWhatsAppAPI($pdo, $phone, $message);
                
                if ($apiResult['success']) {
                    // API send successful
                    $stmt = $pdo->prepare("UPDATE whatsapp_messages SET status = 'sent', sent_at = NOW() WHERE id = ?");
                    $stmt->execute([$messageId]);
                    
                    echo json_encode([
                        'success' => true, 
                        'message_id' => $messageId,
                        'phone' => $phone,
                        'sent_via' => 'api',
                        'wa_message_id' => $apiResult['message_id'] ?? null
                    ]);
                } else if (isset($apiResult['needs_config']) && $apiResult['needs_config']) {
                    // API not configured - return link for manual sending
                    $stmt = $pdo->prepare("UPDATE whatsapp_messages SET status = 'pending', error_message = ? WHERE id = ?");
                    $stmt->execute(['API not configured - manual send required', $messageId]);
                    
                    echo json_encode([
                        'success' => true, 
                        'message_id' => $messageId,
                        'link' => $link,
                        'phone' => $phone,
                        'sent_via' => 'link',
                        'needs_config' => true,
                        'config_message' => $apiResult['error']
                    ]);
                } else {
                    // API send failed
                    $stmt = $pdo->prepare("UPDATE whatsapp_messages SET status = 'failed', error_message = ? WHERE id = ?");
                    $stmt->execute([$apiResult['error'], $messageId]);
                    
                    echo json_encode([
                        'success' => false, 
                        'message_id' => $messageId,
                        'error' => $apiResult['error'],
                        'link' => $link,
                        'phone' => $phone
                    ]);
                }
            }
            elseif ($action === 'send_bulk') {
                // Send bulk WhatsApp messages
                $recipients = $data['recipients'] ?? [];
                $message = $data['message'] ?? '';
                $templateName = $data['template_name'] ?? null;
                $sentBy = $data['sent_by'] ?? null;
                
                if (empty($recipients) || !$message) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Recipients and message are required']);
                    exit;
                }
                
                $results = [];
                foreach ($recipients as $recipient) {
                    $phone = preg_replace('/[^0-9]/', '', $recipient['phone'] ?? '');
                    if (strlen($phone) == 10 && $phone[0] == '0') {
                        $phone = '233' . substr($phone, 1);
                    } elseif (strlen($phone) == 9) {
                        $phone = '233' . $phone;
                    }
                    
                    // Replace template variables
                    $personalizedMessage = $message;
                    foreach ($recipient as $key => $value) {
                        $personalizedMessage = str_replace('{' . $key . '}', $value, $personalizedMessage);
                    }
                    
                    // Log the message
                    $stmt = $pdo->prepare("
                        INSERT INTO whatsapp_messages (recipient_phone, recipient_name, recipient_type, message, template_name, sent_by, status, sent_at)
                        VALUES (?, ?, ?, ?, ?, ?, 'sent', NOW())
                    ");
                    $stmt->execute([
                        $phone, 
                        $recipient['name'] ?? '', 
                        $recipient['type'] ?? 'parent',
                        $personalizedMessage, 
                        $templateName, 
                        $sentBy
                    ]);
                    
                    $encodedMessage = urlencode($personalizedMessage);
                    $results[] = [
                        'phone' => $phone,
                        'name' => $recipient['name'] ?? '',
                        'link' => "https://wa.me/{$phone}?text={$encodedMessage}",
                        'status' => 'sent'
                    ];
                }
                
                echo json_encode([
                    'success' => true,
                    'sent_count' => count($results),
                    'results' => $results
                ]);
            }
            elseif ($action === 'save_template') {
                // Save or update template
                $name = $data['name'] ?? '';
                $category = $data['category'] ?? 'general';
                $template = $data['message_template'] ?? '';
                $variables = $data['variables'] ?? [];
                
                $stmt = $pdo->prepare("
                    INSERT INTO whatsapp_templates (name, category, message_template, variables)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        category = VALUES(category),
                        message_template = VALUES(message_template),
                        variables = VALUES(variables)
                ");
                $stmt->execute([$name, $category, $template, json_encode($variables)]);
                
                echo json_encode(['success' => true, 'message' => 'Template saved']);
            }
            elseif ($action === 'save_settings') {
                // Save WhatsApp settings
                foreach ($data as $key => $value) {
                    $settingKey = 'whatsapp_' . $key;
                    $stmt = $pdo->prepare("
                        INSERT INTO school_settings (setting_key, setting_value)
                        VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
                    ");
                    $stmt->execute([$settingKey, $value]);
                }
                echo json_encode(['success' => true, 'message' => 'Settings saved']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

/**
 * Send message via WhatsApp Business Cloud API
 * 
 * @param PDO $pdo Database connection
 * @param string $phone Recipient phone number
 * @param string $message Message to send
 * @return array Result with success status
 */
function sendViaWhatsAppAPI($pdo, $phone, $message) {
    // Get API settings from database
    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM school_settings WHERE setting_key IN ('whatsapp_api_token', 'whatsapp_phone_number_id', 'whatsapp_business_account_id')");
    $stmt->execute();
    $settings = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $key = str_replace('whatsapp_', '', $row['setting_key']);
        $settings[$key] = $row['setting_value'];
    }
    
    $apiToken = $settings['api_token'] ?? '';
    $phoneNumberId = $settings['phone_number_id'] ?? '';
    
    if (!$apiToken || !$phoneNumberId) {
        return [
            'success' => false, 
            'error' => 'WhatsApp Business API not configured. Please add API Token and Phone Number ID in settings.',
            'needs_config' => true
        ];
    }
    
    // Clean phone number - ensure it has country code
    $phone = preg_replace('/[^0-9]/', '', $phone);
    if (strlen($phone) == 10 && $phone[0] == '0') {
        $phone = '233' . substr($phone, 1); // Ghana default
    } elseif (strlen($phone) == 9) {
        $phone = '233' . $phone;
    }
    
    // WhatsApp Cloud API endpoint
    $url = "https://graph.facebook.com/v18.0/{$phoneNumberId}/messages";
    
    $data = [
        'messaging_product' => 'whatsapp',
        'recipient_type' => 'individual',
        'to' => $phone,
        'type' => 'text',
        'text' => [
            'preview_url' => false,
            'body' => $message
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        return ['success' => false, 'error' => 'Connection error: ' . $curlError];
    }
    
    $responseData = json_decode($response, true);
    
    if ($httpCode == 200 && isset($responseData['messages'])) {
        return [
            'success' => true, 
            'message_id' => $responseData['messages'][0]['id'] ?? null,
            'wa_id' => $responseData['contacts'][0]['wa_id'] ?? $phone
        ];
    } else {
        $errorMsg = $responseData['error']['message'] ?? $response;
        return ['success' => false, 'error' => $errorMsg];
    }
}

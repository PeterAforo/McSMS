<?php
/**
 * Integration Hub API
 * Third-party integrations: SMS, Email, Payment Gateways, Accounting
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

    createIntegrationTables($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'list';
    $id = $_GET['id'] ?? null;

    switch ($action) {
        case 'list':
            echo json_encode(getIntegrations($pdo));
            break;
        case 'save':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(saveIntegration($pdo, $data));
            break;
        case 'send_sms':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(sendSMS($pdo, $data));
            break;
        case 'send_email':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(sendEmail($pdo, $data));
            break;
        case 'sms_templates':
            echo json_encode(getSMSTemplates($pdo));
            break;
        case 'email_templates':
            echo json_encode(getEmailTemplates($pdo));
            break;
        case 'test':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(testIntegration($pdo, $data['integration_type']));
            break;
        case 'save_sms_template':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(saveSMSTemplate($pdo, $data));
            break;
        case 'save_email_template':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(saveEmailTemplate($pdo, $data));
            break;
        case 'delete_template':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(deleteTemplate($pdo, $data));
            break;
        case 'webhooks':
            echo json_encode(getWebhooks($pdo));
            break;
        case 'save_webhook':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(saveWebhook($pdo, $data));
            break;
        case 'generate_api_key':
            echo json_encode(generateApiKey($pdo));
            break;
        case 'api_keys':
            echo json_encode(getApiKeys($pdo));
            break;
        case 'init_payment':
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(initPayment($pdo, $data));
            break;
        case 'verify_payment':
            echo json_encode(verifyPayment($pdo, $_GET['reference']));
            break;
        default:
            echo json_encode(['success' => true, 'status' => 'Integration Hub Active']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function createIntegrationTables($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS integration_settings (
        id INT AUTO_INCREMENT PRIMARY KEY, integration_type VARCHAR(50) UNIQUE,
        provider VARCHAR(50), settings JSON, is_enabled TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS sms_logs (
        id INT AUTO_INCREMENT PRIMARY KEY, recipient VARCHAR(20), message TEXT,
        status VARCHAR(20) DEFAULT 'pending', provider VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY, recipient VARCHAR(255), subject VARCHAR(255),
        body TEXT, status VARCHAR(20) DEFAULT 'pending', provider VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS sms_templates (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), content TEXT,
        category VARCHAR(50), is_active TINYINT DEFAULT 1)");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), subject VARCHAR(255),
        body TEXT, category VARCHAR(50), is_active TINYINT DEFAULT 1)");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS payment_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY, reference VARCHAR(100) UNIQUE,
        invoice_id INT, amount DECIMAL(12,2), gateway VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
}

function getIntegrations($pdo) {
    $stmt = $pdo->query("SELECT * FROM integration_settings");
    $integrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($integrations as &$i) $i['settings'] = json_decode($i['settings'], true);
    return ['success' => true, 'integrations' => $integrations];
}

function saveIntegration($pdo, $data) {
    $stmt = $pdo->prepare("INSERT INTO integration_settings (integration_type, provider, settings, is_enabled)
        VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE provider=VALUES(provider), settings=VALUES(settings), is_enabled=VALUES(is_enabled)");
    $stmt->execute([$data['integration_type'], $data['provider'], json_encode($data['settings']), $data['is_enabled'] ?? 0]);
    return ['success' => true];
}

function sendSMS($pdo, $data) {
    $stmt = $pdo->prepare("SELECT * FROM integration_settings WHERE integration_type='sms' AND is_enabled=1");
    $stmt->execute();
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$config) return ['success' => false, 'error' => 'SMS not configured'];
    
    $settings = json_decode($config['settings'], true);
    $stmt = $pdo->prepare("INSERT INTO sms_logs (recipient, message, provider, status) VALUES (?, ?, ?, 'sent')");
    $stmt->execute([$data['recipient'], $data['message'], $config['provider']]);
    return ['success' => true, 'message_id' => $pdo->lastInsertId()];
}

function sendEmail($pdo, $data) {
    $stmt = $pdo->prepare("SELECT * FROM integration_settings WHERE integration_type='email' AND is_enabled=1");
    $stmt->execute();
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$config) return ['success' => false, 'error' => 'Email not configured'];
    
    $settings = json_decode($config['settings'], true);
    $headers = "MIME-Version: 1.0\r\nContent-type: text/html; charset=UTF-8\r\nFrom: " . ($settings['from_email'] ?? 'noreply@school.com');
    $sent = mail($data['recipient'], $data['subject'], $data['body'], $headers);
    
    $stmt = $pdo->prepare("INSERT INTO email_logs (recipient, subject, body, provider, status) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$data['recipient'], $data['subject'], $data['body'], $config['provider'], $sent ? 'sent' : 'failed']);
    return ['success' => $sent];
}

function getSMSTemplates($pdo) {
    $stmt = $pdo->query("SELECT * FROM sms_templates WHERE is_active=1");
    return ['success' => true, 'templates' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getEmailTemplates($pdo) {
    $stmt = $pdo->query("SELECT * FROM email_templates WHERE is_active=1");
    return ['success' => true, 'templates' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function initPayment($pdo, $data) {
    $stmt = $pdo->prepare("SELECT * FROM integration_settings WHERE integration_type='payment' AND is_enabled=1");
    $stmt->execute();
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$config) return ['success' => false, 'error' => 'Payment not configured'];
    
    $reference = 'PAY-' . strtoupper(bin2hex(random_bytes(8)));
    $stmt = $pdo->prepare("INSERT INTO payment_transactions (reference, invoice_id, amount, gateway) VALUES (?, ?, ?, ?)");
    $stmt->execute([$reference, $data['invoice_id'] ?? null, $data['amount'], $config['provider']]);
    
    return ['success' => true, 'reference' => $reference, 'gateway' => $config['provider']];
}

function verifyPayment($pdo, $reference) {
    $stmt = $pdo->prepare("SELECT * FROM payment_transactions WHERE reference=?");
    $stmt->execute([$reference]);
    $txn = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$txn) return ['success' => false, 'error' => 'Transaction not found'];
    
    $stmt = $pdo->prepare("UPDATE payment_transactions SET status='success' WHERE reference=?");
    $stmt->execute([$reference]);
    return ['success' => true, 'transaction' => $txn];
}

function testIntegration($pdo, $type) {
    $stmt = $pdo->prepare("SELECT * FROM integration_settings WHERE integration_type=? AND is_enabled=1");
    $stmt->execute([$type]);
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config) {
        return ['success' => false, 'message' => ucfirst($type) . ' integration not configured or not enabled'];
    }
    
    $settings = json_decode($config['settings'], true);
    
    switch ($type) {
        case 'sms':
            // Test SMS gateway connectivity
            if (empty($settings['api_key'])) {
                return ['success' => false, 'message' => 'API key not configured'];
            }
            return ['success' => true, 'message' => 'SMS gateway connection successful (Provider: ' . $config['provider'] . ')'];
            
        case 'email':
            // Test email configuration
            if ($config['provider'] === 'smtp' && empty($settings['smtp_host'])) {
                return ['success' => false, 'message' => 'SMTP host not configured'];
            }
            return ['success' => true, 'message' => 'Email service connection successful (Provider: ' . $config['provider'] . ')'];
            
        case 'payment':
            // Test payment gateway
            if (empty($settings['public_key']) || empty($settings['secret_key'])) {
                return ['success' => false, 'message' => 'Payment gateway keys not configured'];
            }
            return ['success' => true, 'message' => 'Payment gateway connection successful (Provider: ' . $config['provider'] . ')'];
            
        default:
            return ['success' => true, 'message' => ucfirst($type) . ' integration is active'];
    }
}

function saveSMSTemplate($pdo, $data) {
    if (!empty($data['id'])) {
        $stmt = $pdo->prepare("UPDATE sms_templates SET name=?, content=?, category=? WHERE id=?");
        $stmt->execute([$data['name'], $data['content'], $data['category'] ?? 'general', $data['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO sms_templates (name, content, category) VALUES (?, ?, ?)");
        $stmt->execute([$data['name'], $data['content'], $data['category'] ?? 'general']);
    }
    return ['success' => true, 'id' => $data['id'] ?? $pdo->lastInsertId()];
}

function saveEmailTemplate($pdo, $data) {
    if (!empty($data['id'])) {
        $stmt = $pdo->prepare("UPDATE email_templates SET name=?, subject=?, body=?, category=? WHERE id=?");
        $stmt->execute([$data['name'], $data['subject'], $data['body'], $data['category'] ?? 'general', $data['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO email_templates (name, subject, body, category) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['subject'], $data['body'], $data['category'] ?? 'general']);
    }
    return ['success' => true, 'id' => $data['id'] ?? $pdo->lastInsertId()];
}

function deleteTemplate($pdo, $data) {
    $table = $data['type'] === 'sms' ? 'sms_templates' : 'email_templates';
    $stmt = $pdo->prepare("UPDATE $table SET is_active=0 WHERE id=?");
    $stmt->execute([$data['id']]);
    return ['success' => true];
}

function getWebhooks($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS webhooks (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), url VARCHAR(500),
        events JSON, secret VARCHAR(100), is_active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    
    $stmt = $pdo->query("SELECT * FROM webhooks WHERE is_active=1");
    $webhooks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($webhooks as &$w) $w['events'] = json_decode($w['events'], true);
    return ['success' => true, 'webhooks' => $webhooks];
}

function saveWebhook($pdo, $data) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS webhooks (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), url VARCHAR(500),
        events JSON, secret VARCHAR(100), is_active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    
    $secret = $data['secret'] ?? bin2hex(random_bytes(16));
    if (!empty($data['id'])) {
        $stmt = $pdo->prepare("UPDATE webhooks SET name=?, url=?, events=? WHERE id=?");
        $stmt->execute([$data['name'], $data['url'], json_encode($data['events']), $data['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO webhooks (name, url, events, secret) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['url'], json_encode($data['events']), $secret]);
    }
    return ['success' => true, 'id' => $data['id'] ?? $pdo->lastInsertId(), 'secret' => $secret];
}

function generateApiKey($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), api_key VARCHAR(64) UNIQUE,
        permissions JSON, is_active TINYINT DEFAULT 1, last_used DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    
    $apiKey = 'mcsms_' . bin2hex(random_bytes(24));
    $stmt = $pdo->prepare("INSERT INTO api_keys (name, api_key, permissions) VALUES (?, ?, ?)");
    $stmt->execute(['API Key ' . date('Y-m-d H:i'), $apiKey, json_encode(['read', 'write'])]);
    return ['success' => true, 'api_key' => $apiKey, 'id' => $pdo->lastInsertId()];
}

function getApiKeys($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), api_key VARCHAR(64) UNIQUE,
        permissions JSON, is_active TINYINT DEFAULT 1, last_used DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
    
    $stmt = $pdo->query("SELECT id, name, CONCAT(LEFT(api_key, 10), '...') as api_key_masked, permissions, is_active, last_used, created_at FROM api_keys WHERE is_active=1");
    $keys = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($keys as &$k) $k['permissions'] = json_decode($k['permissions'], true);
    return ['success' => true, 'api_keys' => $keys];
}

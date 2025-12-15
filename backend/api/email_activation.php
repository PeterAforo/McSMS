<?php
/**
 * Email Activation API
 * Handles sending activation emails and verifying activation tokens
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

// Email configuration - update these for your SMTP server
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', ''); // Set in system_settings
define('SMTP_PASS', ''); // Set in system_settings
define('FROM_EMAIL', ''); // Set in system_settings
define('FROM_NAME', ''); // Set in system_settings

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create activation_tokens table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS activation_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(64) NOT NULL UNIQUE,
            token_type ENUM('email_activation', 'password_reset', 'email_change') DEFAULT 'email_activation',
            expires_at DATETIME NOT NULL,
            used_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_user_id (user_id),
            INDEX idx_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;

    switch ($method) {
        case 'GET':
            if ($action === 'verify') {
                handleVerifyToken($pdo);
            } elseif ($action === 'resend') {
                handleResendActivation($pdo);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
            }
            break;
            
        case 'POST':
            if ($action === 'send') {
                handleSendActivation($pdo);
            } elseif ($action === 'activate') {
                handleActivateAccount($pdo);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
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
 * Generate activation token for a user
 */
function generateActivationToken($pdo, $userId, $type = 'email_activation') {
    // Invalidate any existing tokens
    $stmt = $pdo->prepare("UPDATE activation_tokens SET used_at = NOW() WHERE user_id = ? AND token_type = ? AND used_at IS NULL");
    $stmt->execute([$userId, $type]);
    
    // Generate new token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    $stmt = $pdo->prepare("
        INSERT INTO activation_tokens (user_id, token, token_type, expires_at)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $token, $type, $expiresAt]);
    
    return $token;
}

/**
 * Get email settings from database
 */
function getEmailSettings($pdo) {
    $settings = [
        'smtp_host' => SMTP_HOST,
        'smtp_port' => SMTP_PORT,
        'smtp_user' => SMTP_USER,
        'smtp_pass' => SMTP_PASS,
        'from_email' => FROM_EMAIL,
        'from_name' => FROM_NAME,
        'school_name' => 'School Management System'
    ];
    
    try {
        // Try to get settings from system_settings table
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'from_email', 'from_name', 'school_name')");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!empty($row['setting_value'])) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
        }
        
        // Also try system_config
        $stmt = $pdo->query("SELECT school_name, school_email FROM system_config LIMIT 1");
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($config) {
            if (!empty($config['school_name'])) $settings['school_name'] = $config['school_name'];
            if (!empty($config['school_email'])) $settings['from_email'] = $config['school_email'];
        }
    } catch (Exception $e) {
        // Use defaults
    }
    
    return $settings;
}

/**
 * Send activation email
 */
function sendActivationEmail($pdo, $userId, $email, $name, $token) {
    $settings = getEmailSettings($pdo);
    $baseUrl = 'https://eea.mcaforo.com';
    $activationLink = $baseUrl . '/activate?token=' . $token;
    
    $subject = "Activate Your Account - " . $settings['school_name'];
    
    $htmlBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #1d4ed8; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .link { color: #2563eb; word-break: break-all; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1 style='margin: 0;'>{$settings['school_name']}</h1>
                <p style='margin: 10px 0 0 0; opacity: 0.9;'>Account Activation</p>
            </div>
            <div class='content'>
                <h2>Welcome, {$name}!</h2>
                <p>Thank you for registering with {$settings['school_name']}. To complete your registration and activate your account, please click the button below:</p>
                
                <div style='text-align: center;'>
                    <a href='{$activationLink}' class='button'>Activate My Account</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p class='link'>{$activationLink}</p>
                
                <p><strong>This link will expire in 24 hours.</strong></p>
                
                <p>Once activated, you will be able to:</p>
                <ul>
                    <li>Access the parent/guardian portal</li>
                    <li>View your children's academic progress</li>
                    <li>Communicate with teachers</li>
                    <li>Receive important notifications</li>
                </ul>
                
                <p>If you did not create this account, please ignore this email.</p>
            </div>
            <div class='footer'>
                <p>&copy; " . date('Y') . " {$settings['school_name']}. All rights reserved.</p>
                <p>This is an automated message, please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $textBody = "
Welcome, {$name}!

Thank you for registering with {$settings['school_name']}.

To activate your account, please visit this link:
{$activationLink}

This link will expire in 24 hours.

If you did not create this account, please ignore this email.

{$settings['school_name']}
    ";
    
    // Try to send email using PHP mail() or configured SMTP
    $fromEmail = $settings['from_email'] ?: 'noreply@' . parse_url($baseUrl, PHP_URL_HOST);
    $fromName = $settings['from_name'] ?: $settings['school_name'];
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . $fromName . ' <' . $fromEmail . '>',
        'Reply-To: ' . $fromEmail,
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // Use PHP mail() function
    $sent = @mail($email, $subject, $htmlBody, implode("\r\n", $headers));
    
    // Log the attempt
    try {
        $pdo->prepare("
            INSERT INTO activity_logs (user_id, action, description, created_at)
            VALUES (?, 'activation_email', ?, NOW())
        ")->execute([$userId, $sent ? 'Activation email sent to ' . $email : 'Failed to send activation email to ' . $email]);
    } catch (Exception $e) {
        // Ignore logging errors
    }
    
    return $sent;
}

/**
 * Handle sending activation email
 */
function handleSendActivation($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        return;
    }
    
    // Get user details
    $stmt = $pdo->prepare("SELECT id, name, email, status FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    if ($user['status'] === 'active') {
        echo json_encode(['success' => true, 'message' => 'Account is already active']);
        return;
    }
    
    // Generate token and send email
    $token = generateActivationToken($pdo, $user['id']);
    $sent = sendActivationEmail($pdo, $user['id'], $user['email'], $user['name'], $token);
    
    if ($sent) {
        echo json_encode([
            'success' => true,
            'message' => 'Activation email sent successfully'
        ]);
    } else {
        // Even if email fails, return success with token for manual activation
        echo json_encode([
            'success' => true,
            'message' => 'Activation token generated. Email delivery may be delayed.',
            'token' => $token // Only for debugging - remove in production
        ]);
    }
}

/**
 * Handle verifying activation token (GET request to check if token is valid)
 */
function handleVerifyToken($pdo) {
    $token = $_GET['token'] ?? null;
    
    if (!$token) {
        http_response_code(400);
        echo json_encode(['error' => 'Token is required']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT at.*, u.name, u.email 
        FROM activation_tokens at
        JOIN users u ON at.user_id = u.id
        WHERE at.token = ? AND at.token_type = 'email_activation'
    ");
    $stmt->execute([$token]);
    $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tokenData) {
        http_response_code(400);
        echo json_encode(['valid' => false, 'error' => 'Invalid activation token']);
        return;
    }
    
    if ($tokenData['used_at']) {
        echo json_encode(['valid' => false, 'error' => 'This activation link has already been used', 'already_activated' => true]);
        return;
    }
    
    if (strtotime($tokenData['expires_at']) < time()) {
        echo json_encode(['valid' => false, 'error' => 'This activation link has expired. Please request a new one.', 'expired' => true]);
        return;
    }
    
    echo json_encode([
        'valid' => true,
        'user_name' => $tokenData['name'],
        'user_email' => $tokenData['email']
    ]);
}

/**
 * Handle account activation
 */
function handleActivateAccount($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $token = $data['token'] ?? $_GET['token'] ?? null;
    
    if (!$token) {
        http_response_code(400);
        echo json_encode(['error' => 'Token is required']);
        return;
    }
    
    // Get token data
    $stmt = $pdo->prepare("
        SELECT at.*, u.id as user_id, u.status as user_status
        FROM activation_tokens at
        JOIN users u ON at.user_id = u.id
        WHERE at.token = ? AND at.token_type = 'email_activation'
    ");
    $stmt->execute([$token]);
    $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tokenData) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid activation token']);
        return;
    }
    
    if ($tokenData['used_at']) {
        echo json_encode(['success' => false, 'error' => 'This activation link has already been used']);
        return;
    }
    
    if (strtotime($tokenData['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'This activation link has expired']);
        return;
    }
    
    // Activate the user
    $pdo->beginTransaction();
    try {
        // Update user status
        $stmt = $pdo->prepare("UPDATE users SET status = 'active', email_verified_at = NOW() WHERE id = ?");
        $stmt->execute([$tokenData['user_id']]);
        
        // Mark token as used
        $stmt = $pdo->prepare("UPDATE activation_tokens SET used_at = NOW() WHERE id = ?");
        $stmt->execute([$tokenData['id']]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Your account has been activated successfully! You can now log in.'
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to activate account']);
    }
}

/**
 * Handle resending activation email
 */
function handleResendActivation($pdo) {
    $email = $_GET['email'] ?? null;
    
    if (!$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Email is required']);
        return;
    }
    
    // Get user
    $stmt = $pdo->prepare("SELECT id, name, email, status FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        // Don't reveal if email exists
        echo json_encode(['success' => true, 'message' => 'If this email is registered, an activation link will be sent.']);
        return;
    }
    
    if ($user['status'] === 'active') {
        echo json_encode(['success' => true, 'message' => 'This account is already active. Please log in.']);
        return;
    }
    
    // Generate new token and send email
    $token = generateActivationToken($pdo, $user['id']);
    sendActivationEmail($pdo, $user['id'], $user['email'], $user['name'], $token);
    
    echo json_encode([
        'success' => true,
        'message' => 'If this email is registered, an activation link will be sent.'
    ]);
}

<?php
/**
 * Authentication API
 * Handles login, logout, and user session management
 */

// Set CORS headers only if not already set by .htaccess
if (!headers_sent()) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
}

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

    // Create login_history table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS login_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            device_type VARCHAR(20),
            browser VARCHAR(50),
            os VARCHAR(50),
            status VARCHAR(20) DEFAULT 'success',
            failure_reason VARCHAR(255),
            login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_login_time (login_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    switch ($method) {
        case 'POST':
            if ($action === 'register') {
                handleRegister($pdo);
            } elseif ($action === 'logout') {
                handleLogout($pdo);
            } elseif ($action === 'forgot_password') {
                handleForgotPassword($pdo);
            } elseif ($action === 'reset_password') {
                handleResetPassword($pdo);
            } else {
                handleLogin($pdo);
            }
            break;
            
        case 'GET':
            if ($action === 'me') {
                handleMe($pdo);
            } elseif ($action === 'sessions') {
                handleSessions($pdo);
            } else {
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

function handleLogin($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        return;
    }
    
    // Find user by email
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        return;
    }
    
    // Check if account is active
    if ($user['status'] === 'pending_activation') {
        logLoginAttempt($pdo, $user['id'], 'failed', 'Pending activation');
        http_response_code(401);
        echo json_encode(['error' => 'Your account is pending activation. Please wait for admin approval or check your email for activation link.']);
        return;
    }
    
    if ($user['status'] !== 'active') {
        logLoginAttempt($pdo, $user['id'], 'failed', 'Account inactive');
        http_response_code(401);
        echo json_encode(['error' => 'Account is not active. Please contact administrator.']);
        return;
    }
    
    // Verify password
    if (!password_verify($data['password'], $user['password'])) {
        logLoginAttempt($pdo, $user['id'], 'failed', 'Invalid password');
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        return;
    }
    
    // Log successful login
    logLoginAttempt($pdo, $user['id'], 'success');
    
    // Check if this is first login (last_login is null)
    $isFirstLogin = empty($user['last_login']);
    
    // Update last login
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Log activity
    logActivity($pdo, $user['id'], 'login', 'auth', 'User logged in: ' . $user['email']);
    
    // Create welcome notification for first login or login notification
    try {
        // Create notifications table if not exists
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
        
        if ($isFirstLogin) {
            // Welcome notification for first login
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                VALUES (?, 'Welcome to McSMS!', 'Welcome to the school management system. Explore the dashboard to get started.', 'success', NULL, 0, NOW())
            ");
            $stmt->execute([$user['id']]);
        } else {
            // Login notification
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
                VALUES (?, 'Login Successful', ?, 'info', NULL, 0, NOW())
            ");
            $stmt->execute([$user['id'], 'You logged in at ' . date('M j, Y g:i A')]);
        }
    } catch (Exception $e) {
        // Ignore notification errors - don't break login
        error_log("Notification creation failed: " . $e->getMessage());
    }
    
    // Generate token (simple implementation - in production use JWT)
    $token = bin2hex(random_bytes(32));
    
    // Remove password from response
    unset($user['password']);
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'token' => $token
    ]);
}

function handleRegister($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, email and password are required']);
        return;
    }
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Email already registered']);
        return;
    }
    
    // Hash password
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    // Insert user - default to parent role with pending_activation status
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, password, phone, user_type, status, created_at)
        VALUES (?, ?, ?, ?, 'parent', 'pending_activation', NOW())
    ");
    $stmt->execute([
        $data['name'],
        $data['email'],
        $hashedPassword,
        $data['phone'] ?? null
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Log activity
    logActivity($pdo, $userId, 'register', 'auth', 'New user registered: ' . $data['email']);
    
    // Send activation email
    $activationSent = false;
    
    // Generate activation token
    try {
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
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        // Generate token
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $stmt = $pdo->prepare("INSERT INTO activation_tokens (user_id, token, token_type, expires_at) VALUES (?, ?, 'email_activation', ?)");
        $stmt->execute([$userId, $token, $expiresAt]);
        
        // Send activation email
        $baseUrl = 'https://eea.mcaforo.com';
        $activationLink = $baseUrl . '/activate?token=' . $token;
        
        // Get school name
        $schoolName = 'School Management System';
        try {
            $stmt = $pdo->query("SELECT school_name FROM system_config LIMIT 1");
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($config && !empty($config['school_name'])) {
                $schoolName = $config['school_name'];
            }
        } catch (Exception $e) {}
        
        $subject = "Activate Your Account - " . $schoolName;
        $htmlBody = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;'>
                    <h1 style='margin: 0;'>{$schoolName}</h1>
                </div>
                <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;'>
                    <h2>Welcome, {$data['name']}!</h2>
                    <p>Thank you for registering. Please click the button below to activate your account:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$activationLink}' style='display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Activate My Account</a>
                    </div>
                    <p>Or copy this link: <a href='{$activationLink}'>{$activationLink}</a></p>
                    <p><strong>This link expires in 24 hours.</strong></p>
                </div>
            </div>
        </body>
        </html>";
        
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . $schoolName . ' <noreply@eea.mcaforo.com>'
        ];
        
        $activationSent = @mail($data['email'], $subject, $htmlBody, implode("\r\n", $headers));
    } catch (Exception $e) {
        // Token generation or email failed
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful! Please check your email to activate your account.',
        'user_id' => $userId,
        'activation_email_sent' => $activationSent
    ]);
}

function handleLogout($pdo) {
    // In a real implementation, you would invalidate the token
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

function handleMe($pdo) {
    // In a real implementation, you would verify the token and return user data
    // For now, return an error since we don't have session management
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
}

function handleSessions($pdo) {
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['success' => true, 'sessions' => []]);
        return;
    }
    
    try {
        // Get recent login sessions from login_history
        $stmt = $pdo->prepare("
            SELECT id, device_type, browser, os, ip_address, login_time as last_active,
                   CASE WHEN login_time > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 ELSE 0 END as current
            FROM login_history 
            WHERE user_id = ? AND status = 'success'
            ORDER BY login_time DESC 
            LIMIT 10
        ");
        $stmt->execute([$userId]);
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format sessions
        $formattedSessions = array_map(function($s) {
            return [
                'id' => $s['id'],
                'device' => $s['browser'] . ' on ' . $s['os'],
                'location' => 'IP: ' . ($s['ip_address'] ?: 'Unknown'),
                'last_active' => $s['last_active'],
                'current' => (bool)$s['current']
            ];
        }, $sessions);
        
        echo json_encode(['success' => true, 'sessions' => $formattedSessions]);
    } catch (Exception $e) {
        echo json_encode(['success' => true, 'sessions' => []]);
    }
}

function logLoginAttempt($pdo, $userId, $status, $failureReason = null) {
    try {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
        
        // Detect device type
        $deviceType = 'unknown';
        if (preg_match('/Mobile|Android|iPhone|iPad/i', $userAgent)) {
            $deviceType = preg_match('/iPad|Tablet/i', $userAgent) ? 'tablet' : 'mobile';
        } elseif (preg_match('/Windows|Macintosh|Linux/i', $userAgent)) {
            $deviceType = 'desktop';
        }
        
        // Detect browser
        $browser = 'Unknown';
        if (preg_match('/Chrome/i', $userAgent)) $browser = 'Chrome';
        elseif (preg_match('/Firefox/i', $userAgent)) $browser = 'Firefox';
        elseif (preg_match('/Safari/i', $userAgent)) $browser = 'Safari';
        elseif (preg_match('/Edge/i', $userAgent)) $browser = 'Edge';
        
        // Detect OS
        $os = 'Unknown';
        if (preg_match('/Windows/i', $userAgent)) $os = 'Windows';
        elseif (preg_match('/Macintosh|Mac OS/i', $userAgent)) $os = 'macOS';
        elseif (preg_match('/Linux/i', $userAgent)) $os = 'Linux';
        elseif (preg_match('/Android/i', $userAgent)) $os = 'Android';
        elseif (preg_match('/iPhone|iPad/i', $userAgent)) $os = 'iOS';
        
        $stmt = $pdo->prepare("
            INSERT INTO login_history (user_id, ip_address, user_agent, device_type, browser, os, status, failure_reason, login_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $ipAddress, $userAgent, $deviceType, $browser, $os, $status, $failureReason]);
    } catch (Exception $e) {
        // Silently fail - don't break login if logging fails
        error_log("Login history error: " . $e->getMessage());
    }
}

function handleForgotPassword($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['email']) || empty(trim($data['email']))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email address is required']);
        return;
    }
    
    $email = trim($data['email']);
    
    // Find user by email
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Always return success to prevent email enumeration
    if (!$user) {
        echo json_encode(['success' => true, 'message' => 'If an account exists with this email, a password reset link has been sent.']);
        return;
    }
    
    // Create password_resets table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS password_resets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(100) NOT NULL,
            expires_at DATETIME NOT NULL,
            used TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Generate reset token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Invalidate any existing tokens for this user
    $stmt = $pdo->prepare("UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0");
    $stmt->execute([$user['id']]);
    
    // Store new token
    $stmt = $pdo->prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], $token, $expiresAt]);
    
    // Get school settings for email
    $schoolName = 'School Management System';
    try {
        $stmt = $pdo->query("SELECT school_name FROM system_config WHERE id = 1");
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($config && !empty($config['school_name'])) {
            $schoolName = $config['school_name'];
        }
    } catch (Exception $e) {}
    
    // Build reset URL
    $resetUrl = "https://eea.mcaforo.com/reset-password?token=" . $token;
    
    // Try to send email
    $emailSent = false;
    try {
        // Get SMTP settings
        $stmt = $pdo->query("SELECT smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email, smtp_from_name, smtp_enabled FROM system_config WHERE id = 1");
        $smtpConfig = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($smtpConfig && $smtpConfig['smtp_enabled']) {
            // TODO: Implement actual SMTP email sending
            // For now, log the reset link
            error_log("Password reset link for {$email}: {$resetUrl}");
        }
        
        // For development/testing, just log it
        error_log("Password reset requested for: {$email}, Token: {$token}");
        $emailSent = true;
    } catch (Exception $e) {
        error_log("Email sending error: " . $e->getMessage());
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'If an account exists with this email, a password reset link has been sent.',
        // Include token in dev mode for testing (remove in production)
        'debug_token' => $token,
        'debug_url' => $resetUrl
    ]);
}

function handleResetPassword($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['token']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Token and new password are required']);
        return;
    }
    
    $token = trim($data['token']);
    $password = $data['password'];
    
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
        return;
    }
    
    // Find valid token
    $stmt = $pdo->prepare("
        SELECT pr.*, u.email, u.name 
        FROM password_resets pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.token = ? AND pr.used = 0 AND pr.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    $reset = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$reset) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or expired reset token']);
        return;
    }
    
    // Update password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->execute([$hashedPassword, $reset['user_id']]);
    
    // Mark token as used
    $stmt = $pdo->prepare("UPDATE password_resets SET used = 1 WHERE id = ?");
    $stmt->execute([$reset['id']]);
    
    // Log activity
    logActivity($pdo, $reset['user_id'], 'password_reset', 'auth', 'Password reset completed');
    
    echo json_encode(['success' => true, 'message' => 'Password has been reset successfully. You can now login with your new password.']);
}

function logActivity($pdo, $userId, $actionType, $module, $description) {
    try {
        // Create table if not exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS user_activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action_type VARCHAR(50),
                module VARCHAR(50),
                description TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        $stmt = $pdo->prepare("
            INSERT INTO user_activity_logs (user_id, action_type, module, description, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $actionType,
            $module,
            $description,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    } catch (Exception $e) {
        // Silently fail
        error_log("Activity log error: " . $e->getMessage());
    }
}

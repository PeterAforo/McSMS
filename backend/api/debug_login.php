<?php
/**
 * Debug Login - Test the login directly
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../config/database.php';

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Connect to database
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    // Find user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'User not found', 'email' => $data['email']]);
        exit;
    }
    
    // Verify password
    $passwordMatch = password_verify($data['password'], $user['password']);
    
    if (!$passwordMatch) {
        // Log failed login attempt
        logLoginAttempt($pdo, $user['id'], 'failed', 'Invalid password');
        http_response_code(401);
        echo json_encode([
            'error' => 'Invalid password',
            'debug' => [
                'provided_password' => $data['password'],
                'hash_in_db' => substr($user['password'], 0, 20) . '...'
            ]
        ]);
        exit;
    }
    
    // Log successful login
    logLoginAttempt($pdo, $user['id'], 'success');
    
    // Update last login
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Log activity
    logActivity($pdo, $user['id'], 'login', 'auth', 'User logged in: ' . $user['email']);
    
    // Success
    unset($user['password']);
    echo json_encode([
        'success' => true,
        'user' => $user,
        'token' => 'test-token-' . time()
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}

// Helper function to log login attempts
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
        // Silently fail
    }
}

// Helper function to log activity
function logActivity($pdo, $userId, $actionType, $module, $description) {
    try {
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
    }
}

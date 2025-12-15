<?php
/**
 * Mobile API v1 - Authentication
 * JWT-based authentication for mobile apps
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/database.php';

// Simple JWT implementation
class JWT {
    private static $secret = 'your-secret-key-change-in-production'; // Change in production
    
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
    
    public static function decode($jwt) {
        $tokenParts = explode('.', $jwt);
        if (count($tokenParts) !== 3) {
            return false;
        }
        
        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
        $signatureProvided = $tokenParts[2];
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if ($base64UrlSignature !== $signatureProvided) {
            return false;
        }
        
        return json_decode($payload, true);
    }
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $action = $_GET['action'] ?? '';
    $data = json_decode(file_get_contents('php://input'), true);

    switch ($action) {
        case 'login':
            $email = $data['email'] ?? null;
            $password = $data['password'] ?? null;
            $deviceId = $data['device_id'] ?? null;
            
            if (!$email || !$password) {
                throw new Exception('Email and password required');
            }
            
            // Find user
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND status = 'active'");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user || !password_verify($password, $user['password'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
                exit;
            }
            
            // Generate JWT token
            $payload = [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'user_type' => $user['user_type'],
                'exp' => time() + (30 * 24 * 60 * 60) // 30 days
            ];
            
            $token = JWT::encode($payload);
            
            // Save device token
            if ($deviceId) {
                $stmt = $pdo->prepare("
                    INSERT INTO user_devices (user_id, device_id, device_token, last_login, created_at)
                    VALUES (?, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE device_token = VALUES(device_token), last_login = NOW()
                ");
                $stmt->execute([$user['id'], $deviceId, $token]);
            }
            
            // Remove password from response
            unset($user['password']);
            
            echo json_encode([
                'success' => true,
                'token' => $token,
                'user' => $user,
                'expires_at' => date('Y-m-d H:i:s', $payload['exp'])
            ]);
            break;

        case 'register':
            $name = $data['name'] ?? null;
            $email = $data['email'] ?? null;
            $password = $data['password'] ?? null;
            $phone = $data['phone'] ?? null;
            $userType = $data['user_type'] ?? 'parent';
            
            if (!$name || !$email || !$password) {
                throw new Exception('Name, email, and password required');
            }
            
            // Check if email exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                throw new Exception('Email already registered');
            }
            
            // Create user
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("
                INSERT INTO users (name, email, password, phone, user_type, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', NOW())
            ");
            $stmt->execute([$name, $email, $hashedPassword, $phone, $userType]);
            
            $userId = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Registration successful. Awaiting admin approval.',
                'user_id' => $userId
            ]);
            break;

        case 'refresh':
            $token = $data['token'] ?? null;
            
            if (!$token) {
                throw new Exception('Token required');
            }
            
            $payload = JWT::decode($token);
            
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Invalid token']);
                exit;
            }
            
            // Check if token expired
            if ($payload['exp'] < time()) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Token expired']);
                exit;
            }
            
            // Generate new token
            $newPayload = [
                'user_id' => $payload['user_id'],
                'email' => $payload['email'],
                'user_type' => $payload['user_type'],
                'exp' => time() + (30 * 24 * 60 * 60)
            ];
            
            $newToken = JWT::encode($newPayload);
            
            echo json_encode([
                'success' => true,
                'token' => $newToken,
                'expires_at' => date('Y-m-d H:i:s', $newPayload['exp'])
            ]);
            break;

        case 'verify':
            $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $token = str_replace('Bearer ', '', $token);
            
            if (!$token) {
                throw new Exception('Token required');
            }
            
            $payload = JWT::decode($token);
            
            if (!$payload || $payload['exp'] < time()) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
                exit;
            }
            
            // Get user data
            $stmt = $pdo->prepare("SELECT id, name, email, user_type, status FROM users WHERE id = ?");
            $stmt->execute([$payload['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'User not found']);
                exit;
            }
            
            echo json_encode([
                'success' => true,
                'user' => $user,
                'valid' => true
            ]);
            break;

        case 'logout':
            $deviceId = $data['device_id'] ?? null;
            $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $token = str_replace('Bearer ', '', $token);
            
            if ($token) {
                $payload = JWT::decode($token);
                if ($payload && $deviceId) {
                    // Remove device token
                    $stmt = $pdo->prepare("DELETE FROM user_devices WHERE user_id = ? AND device_id = ?");
                    $stmt->execute([$payload['user_id'], $deviceId]);
                }
            }
            
            echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
            break;

        case 'change_password':
            $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $token = str_replace('Bearer ', '', $token);
            $oldPassword = $data['old_password'] ?? null;
            $newPassword = $data['new_password'] ?? null;
            
            if (!$token || !$oldPassword || !$newPassword) {
                throw new Exception('Token, old password, and new password required');
            }
            
            $payload = JWT::decode($token);
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Invalid token']);
                exit;
            }
            
            // Verify old password
            $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$payload['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!password_verify($oldPassword, $user['password'])) {
                throw new Exception('Incorrect old password');
            }
            
            // Update password
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$hashedPassword, $payload['user_id']]);
            
            echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
            break;

        case 'forgot_password':
            $email = $data['email'] ?? null;
            
            if (!$email) {
                throw new Exception('Email required');
            }
            
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                // Don't reveal if email exists
                echo json_encode(['success' => true, 'message' => 'If email exists, reset link sent']);
                exit;
            }
            
            // Generate reset token
            $resetToken = bin2hex(random_bytes(32));
            $expiry = date('Y-m-d H:i:s', time() + 3600); // 1 hour
            
            $stmt = $pdo->prepare("
                INSERT INTO password_resets (user_id, token, expires_at, created_at)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$user['id'], $resetToken, $expiry]);
            
            // TODO: Send email with reset link
            
            echo json_encode([
                'success' => true,
                'message' => 'Password reset link sent to email',
                'reset_token' => $resetToken // Remove in production
            ]);
            break;

        case 'reset_password':
            $token = $data['token'] ?? null;
            $newPassword = $data['new_password'] ?? null;
            
            if (!$token || !$newPassword) {
                throw new Exception('Token and new password required');
            }
            
            // Verify reset token
            $stmt = $pdo->prepare("
                SELECT user_id FROM password_resets
                WHERE token = ? AND expires_at > NOW() AND used = 0
            ");
            $stmt->execute([$token]);
            $reset = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$reset) {
                throw new Exception('Invalid or expired reset token');
            }
            
            // Update password
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$hashedPassword, $reset['user_id']]);
            
            // Mark token as used
            $stmt = $pdo->prepare("UPDATE password_resets SET used = 1 WHERE token = ?");
            $stmt->execute([$token]);
            
            echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
            break;

        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

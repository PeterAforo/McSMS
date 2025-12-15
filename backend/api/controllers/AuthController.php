<?php
/**
 * Authentication API Controller
 * Handles login, logout, and token management
 */

class ApiAuthController {
    
    public function handleRequest($action, $method) {
        switch ($action) {
            case 'login':
                if ($method === 'POST') {
                    $this->login();
                } else {
                    $this->methodNotAllowed();
                }
                break;
                
            case 'logout':
                if ($method === 'POST') {
                    $this->logout();
                } else {
                    $this->methodNotAllowed();
                }
                break;
                
            case 'me':
                if ($method === 'GET') {
                    $this->getCurrentUser();
                } else {
                    $this->methodNotAllowed();
                }
                break;
                
            default:
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
        }
    }
    
    private function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password are required']);
            return;
        }
        
        try {
            $db = DB::getInstance()->getConnection();
            
            // Find user by email
            $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND status = 'active'");
            $stmt->execute([$data['email']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                return;
            }
            
            // Verify password
            if (!password_verify($data['password'], $user['password'])) {
                // Log failed login attempt
                $this->logLoginAttempt($db, $user['id'], 'failed', 'Invalid password');
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                return;
            }
            
            // Generate JWT token (simple version - in production use a library)
            $token = $this->generateToken($user['id'], $user['user_type']);
            
            // Log successful login
            $this->logLoginAttempt($db, $user['id'], 'success');
            
            // Update last login
            $stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            // Log activity
            $this->logActivity($db, $user['id'], 'login', 'auth', 'User logged in');
            
            // Remove password from response
            unset($user['password']);
            
            // Return user and token
            echo json_encode([
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Login failed', 'message' => $e->getMessage()]);
        }
    }
    
    private function logout() {
        // In a real app, you'd invalidate the token here
        echo json_encode(['message' => 'Logout successful']);
    }
    
    private function getCurrentUser() {
        $user = $this->verifyToken();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        
        try {
            $db = DB::getInstance()->getConnection();
            $stmt = $db->prepare("SELECT id, name, email, user_type, phone, status, created_at FROM users WHERE id = ?");
            $stmt->execute([$user['user_id']]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$userData) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                return;
            }
            
            echo json_encode(['user' => $userData]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch user']);
        }
    }
    
    private function generateToken($userId, $userType) {
        // Simple token generation (in production, use Firebase JWT or similar)
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'user_id' => $userId,
            'user_type' => $userType,
            'exp' => time() + (86400 * 7) // 7 days
        ]));
        
        $secret = 'your-secret-key-change-this-in-production';
        $signature = hash_hmac('sha256', "$header.$payload", $secret, true);
        $signature = base64_encode($signature);
        
        return "$header.$payload.$signature";
    }
    
    private function verifyToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        
        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        
        $token = $matches[1];
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return null;
        }
        
        [$header, $payload, $signature] = $parts;
        
        // Verify signature
        $secret = 'your-secret-key-change-this-in-production';
        $expectedSignature = base64_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
        
        if ($signature !== $expectedSignature) {
            return null;
        }
        
        // Decode payload
        $payloadData = json_decode(base64_decode($payload), true);
        
        // Check expiration
        if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
            return null;
        }
        
        return $payloadData;
    }
    
    private function methodNotAllowed() {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
    private function logLoginAttempt($db, $userId, $status, $failureReason = null) {
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
            elseif (preg_match('/MSIE|Trident/i', $userAgent)) $browser = 'Internet Explorer';
            
            // Detect OS
            $os = 'Unknown';
            if (preg_match('/Windows/i', $userAgent)) $os = 'Windows';
            elseif (preg_match('/Macintosh|Mac OS/i', $userAgent)) $os = 'macOS';
            elseif (preg_match('/Linux/i', $userAgent)) $os = 'Linux';
            elseif (preg_match('/Android/i', $userAgent)) $os = 'Android';
            elseif (preg_match('/iPhone|iPad/i', $userAgent)) $os = 'iOS';
            
            $stmt = $db->prepare("
                INSERT INTO login_history (user_id, ip_address, user_agent, device_type, browser, os, status, failure_reason, login_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$userId, $ipAddress, $userAgent, $deviceType, $browser, $os, $status, $failureReason]);
        } catch (Exception $e) {
            // Silently fail - don't break login
            error_log("Failed to log login attempt: " . $e->getMessage());
        }
    }
    
    private function logActivity($db, $userId, $actionType, $module, $description) {
        try {
            $stmt = $db->prepare("
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
            // Silently fail - don't break main operation
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }
}

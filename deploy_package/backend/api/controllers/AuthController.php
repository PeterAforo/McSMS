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
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                return;
            }
            
            // Generate JWT token (simple version - in production use a library)
            $token = $this->generateToken($user['id'], $user['user_type']);
            
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
}

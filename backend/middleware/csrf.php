<?php
/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for form submissions
 */

require_once __DIR__ . '/../config/env.php';

class CSRF {
    private static $tokenName = 'csrf_token';
    private static $headerName = 'X-CSRF-Token';
    
    /**
     * Generate a new CSRF token
     */
    public static function generateToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $secret = Env::get('CSRF_SECRET', 'default-csrf-secret-change-me');
        $token = bin2hex(random_bytes(32));
        $hash = hash_hmac('sha256', $token, $secret);
        
        $_SESSION[self::$tokenName] = $hash;
        $_SESSION['csrf_token_time'] = time();
        
        return $token;
    }
    
    /**
     * Get the current token or generate a new one
     */
    public static function getToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Check if token exists and is not expired (1 hour)
        if (isset($_SESSION[self::$tokenName]) && isset($_SESSION['csrf_token_time'])) {
            if (time() - $_SESSION['csrf_token_time'] < 3600) {
                return $_SESSION[self::$tokenName];
            }
        }
        
        return self::generateToken();
    }
    
    /**
     * Validate a CSRF token
     */
    public static function validateToken($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (empty($token) || !isset($_SESSION[self::$tokenName])) {
            return false;
        }
        
        $secret = Env::get('CSRF_SECRET', 'default-csrf-secret-change-me');
        $hash = hash_hmac('sha256', $token, $secret);
        
        return hash_equals($_SESSION[self::$tokenName], $hash);
    }
    
    /**
     * Middleware to check CSRF token on POST/PUT/DELETE requests
     * Returns true if valid, sends error response if invalid
     */
    public static function check() {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // Only check for state-changing methods
        if (!in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            return true;
        }
        
        // Skip CSRF check for API requests with Bearer token (they use JWT auth)
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (strpos($authHeader, 'Bearer ') === 0) {
            return true;
        }
        
        // Get token from header or body
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        if (!$token) {
            $input = json_decode(file_get_contents('php://input'), true);
            $token = $input['_csrf_token'] ?? $_POST['_csrf_token'] ?? null;
        }
        
        if (!self::validateToken($token)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid or missing CSRF token'
            ]);
            exit;
        }
        
        return true;
    }
    
    /**
     * Get token for API response (to be included in forms)
     */
    public static function getTokenForResponse() {
        return [
            'csrf_token' => self::getToken(),
            'csrf_header' => self::$headerName
        ];
    }
}

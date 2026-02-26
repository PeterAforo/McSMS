<?php
/**
 * Security Headers Middleware
 * Adds security headers to all API responses
 */

class SecurityHeaders {
    
    /**
     * Apply all security headers
     */
    public static function apply() {
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');
        
        // Prevent clickjacking
        header('X-Frame-Options: DENY');
        
        // Enable XSS protection (legacy browsers)
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer policy - don't leak URLs
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Permissions policy - restrict browser features
        header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');
        
        // Content Security Policy for API responses
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
        
        // Strict Transport Security (HTTPS only)
        if (self::isHTTPS()) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        
        // Cache control for sensitive data
        header('Cache-Control: no-store, no-cache, must-revalidate, private');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    
    /**
     * Apply CORS headers with strict origin checking
     */
    public static function applyCORS($allowedOrigins = []) {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Default allowed origins
        if (empty($allowedOrigins)) {
            $allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:3000',
                'http://127.0.0.1:5173',
                'https://eea.mcaforo.com',
            ];
            
            // Add from environment if set
            $envOrigin = getenv('FRONTEND_URL') ?: ($_ENV['FRONTEND_URL'] ?? '');
            if ($envOrigin) {
                $allowedOrigins[] = rtrim($envOrigin, '/');
            }
        }
        
        // Check if origin is allowed
        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
        header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
    
    /**
     * Check if request is over HTTPS
     */
    private static function isHTTPS() {
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            return true;
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            return true;
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on') {
            return true;
        }
        return false;
    }
    
    /**
     * Sanitize output to prevent XSS
     */
    public static function sanitizeOutput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeOutput'], $data);
        }
        if (is_string($data)) {
            return htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        return $data;
    }
}

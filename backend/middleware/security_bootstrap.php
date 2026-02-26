<?php
/**
 * Security Bootstrap
 * Include this file at the top of API endpoints to apply all security measures
 */

require_once __DIR__ . '/security_headers.php';
require_once __DIR__ . '/rate_limiter.php';
require_once __DIR__ . '/csrf.php';
require_once __DIR__ . '/input_validator.php';
require_once __DIR__ . '/debug_protection.php';

class SecurityBootstrap {
    
    private static $initialized = false;
    
    /**
     * Initialize all security measures
     * @param array $options Configuration options
     */
    public static function init($options = []) {
        if (self::$initialized) {
            return;
        }
        
        $defaults = [
            'cors' => true,
            'headers' => true,
            'csrf' => false,  // Disabled by default for API (uses JWT)
            'rateLimit' => false,
            'rateLimitKey' => null,
            'rateLimitMax' => 60,
            'rateLimitWindow' => 60,
        ];
        
        $options = array_merge($defaults, $options);
        
        // Apply security headers
        if ($options['headers']) {
            SecurityHeaders::apply();
        }
        
        // Apply CORS
        if ($options['cors']) {
            SecurityHeaders::applyCORS();
        }
        
        // Apply rate limiting
        if ($options['rateLimit']) {
            $key = $options['rateLimitKey'] ?? RateLimiter::getClientIP();
            if (!RateLimiter::check($key, $options['rateLimitMax'], $options['rateLimitWindow'])) {
                exit; // Rate limiter already sent response
            }
        }
        
        // Apply CSRF protection
        if ($options['csrf']) {
            CSRF::check();
        }
        
        self::$initialized = true;
    }
    
    /**
     * Initialize for authentication endpoints (stricter rate limiting)
     */
    public static function initAuth() {
        self::init([
            'rateLimit' => true,
            'rateLimitMax' => 5,      // 5 attempts
            'rateLimitWindow' => 300, // per 5 minutes
        ]);
    }
    
    /**
     * Initialize for sensitive endpoints (CSRF + rate limiting)
     */
    public static function initSensitive() {
        self::init([
            'csrf' => true,
            'rateLimit' => true,
            'rateLimitMax' => 30,
            'rateLimitWindow' => 60,
        ]);
    }
    
    /**
     * Initialize for public endpoints (no auth required)
     */
    public static function initPublic() {
        self::init([
            'rateLimit' => true,
            'rateLimitMax' => 100,
            'rateLimitWindow' => 60,
        ]);
    }
    
    /**
     * Initialize for debug endpoints
     */
    public static function initDebug() {
        DebugProtection::check();
        self::init([
            'rateLimit' => true,
            'rateLimitMax' => 10,
            'rateLimitWindow' => 60,
        ]);
    }
    
    /**
     * Record failed authentication attempt
     */
    public static function recordAuthFailure($identifier = null) {
        $key = $identifier ?? RateLimiter::getClientIP();
        RateLimiter::recordAttempt('auth:' . $key);
    }
    
    /**
     * Clear authentication attempts on success
     */
    public static function clearAuthAttempts($identifier = null) {
        $key = $identifier ?? RateLimiter::getClientIP();
        RateLimiter::clear('auth:' . $key);
    }
    
    /**
     * Get sanitized JSON input
     */
    public static function getInput() {
        return InputValidator::getJsonInput();
    }
    
    /**
     * Validate required fields and return errors
     */
    public static function validateRequired($data, $fields) {
        $missing = InputValidator::validateRequired($data, $fields);
        
        if (!empty($missing)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Missing required fields: ' . implode(', ', $missing)
            ]);
            exit;
        }
        
        return true;
    }
    
    /**
     * Send secure JSON response
     */
    public static function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Send error response
     */
    public static function errorResponse($message, $statusCode = 400) {
        self::jsonResponse([
            'success' => false,
            'error' => $message
        ], $statusCode);
    }
}

<?php
/**
 * Rate Limiter Middleware
 * Prevents brute force attacks on authentication endpoints
 */

class RateLimiter {
    private static $cacheDir;
    
    private static function getCacheDir() {
        if (self::$cacheDir === null) {
            self::$cacheDir = __DIR__ . '/../../cache/rate_limit';
            if (!is_dir(self::$cacheDir)) {
                mkdir(self::$cacheDir, 0755, true);
            }
        }
        return self::$cacheDir;
    }
    
    /**
     * Check if request should be rate limited
     * @param string $key Unique identifier (e.g., IP address, user ID)
     * @param int $maxAttempts Maximum attempts allowed
     * @param int $windowSeconds Time window in seconds
     * @return bool True if allowed, false if rate limited
     */
    public static function check($key, $maxAttempts = 5, $windowSeconds = 300) {
        $cacheFile = self::getCacheDir() . '/' . md5($key) . '.json';
        
        $data = ['attempts' => [], 'blocked_until' => 0];
        
        if (file_exists($cacheFile)) {
            $data = json_decode(file_get_contents($cacheFile), true) ?: $data;
        }
        
        $now = time();
        
        // Check if currently blocked
        if ($data['blocked_until'] > $now) {
            $remainingSeconds = $data['blocked_until'] - $now;
            self::sendRateLimitResponse($remainingSeconds);
            return false;
        }
        
        // Clean old attempts outside the window
        $data['attempts'] = array_filter($data['attempts'], function($timestamp) use ($now, $windowSeconds) {
            return ($now - $timestamp) < $windowSeconds;
        });
        
        // Check if over limit
        if (count($data['attempts']) >= $maxAttempts) {
            // Block for increasing duration based on attempts
            $blockDuration = min(3600, 60 * pow(2, count($data['attempts']) - $maxAttempts));
            $data['blocked_until'] = $now + $blockDuration;
            file_put_contents($cacheFile, json_encode($data), LOCK_EX);
            
            self::sendRateLimitResponse($blockDuration);
            return false;
        }
        
        return true;
    }
    
    /**
     * Record an attempt
     */
    public static function recordAttempt($key) {
        $cacheFile = self::getCacheDir() . '/' . md5($key) . '.json';
        
        $data = ['attempts' => [], 'blocked_until' => 0];
        
        if (file_exists($cacheFile)) {
            $data = json_decode(file_get_contents($cacheFile), true) ?: $data;
        }
        
        $data['attempts'][] = time();
        file_put_contents($cacheFile, json_encode($data), LOCK_EX);
    }
    
    /**
     * Clear attempts for a key (e.g., after successful login)
     */
    public static function clear($key) {
        $cacheFile = self::getCacheDir() . '/' . md5($key) . '.json';
        if (file_exists($cacheFile)) {
            unlink($cacheFile);
        }
    }
    
    /**
     * Get client IP address
     */
    public static function getClientIP() {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                // Handle comma-separated IPs (X-Forwarded-For)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return '0.0.0.0';
    }
    
    /**
     * Send rate limit exceeded response
     */
    private static function sendRateLimitResponse($retryAfter) {
        http_response_code(429);
        header('Retry-After: ' . $retryAfter);
        echo json_encode([
            'success' => false,
            'error' => 'Too many requests. Please try again later.',
            'retry_after' => $retryAfter
        ]);
        exit;
    }
}

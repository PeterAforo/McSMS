<?php
/**
 * Debug Endpoint Protection
 * Restricts access to debug endpoints in production
 */

require_once __DIR__ . '/../config/env.php';

class DebugProtection {
    
    /**
     * Check if debug endpoints should be accessible
     * Returns true if allowed, exits with 403 if not
     */
    public static function check() {
        // Allow in development mode
        if (!Env::isProduction()) {
            return true;
        }
        
        // In production, require debug key
        $debugKey = Env::get('DEBUG_ACCESS_KEY', '');
        $providedKey = $_GET['debug_key'] ?? $_SERVER['HTTP_X_DEBUG_KEY'] ?? '';
        
        if (empty($debugKey) || $providedKey !== $debugKey) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Debug endpoints are disabled in production'
            ]);
            exit;
        }
        
        return true;
    }
    
    /**
     * Log debug access attempts
     */
    public static function logAccess($endpoint) {
        if (Env::isProduction()) {
            $logFile = __DIR__ . '/../../logs/debug_access.log';
            $logDir = dirname($logFile);
            
            if (!is_dir($logDir)) {
                mkdir($logDir, 0755, true);
            }
            
            $logEntry = sprintf(
                "[%s] IP: %s | Endpoint: %s | User-Agent: %s\n",
                date('Y-m-d H:i:s'),
                $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                $endpoint,
                $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            );
            
            file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
        }
    }
}

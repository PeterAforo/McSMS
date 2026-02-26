<?php
/**
 * Audit Middleware
 * Automatically logs API requests and responses
 */

require_once __DIR__ . '/../src/Audit/AuditLogService.php';

use McSMS\Audit\AuditLogService;

class AuditMiddleware {
    
    private static $startTime;
    private static $userId;
    private static $userEmail;
    private static $userRole;
    
    /**
     * Set current user context for audit logging
     */
    public static function setUserContext($userId, $email = null, $role = null) {
        self::$userId = $userId;
        self::$userEmail = $email;
        self::$userRole = $role;
    }
    
    /**
     * Get current user context
     */
    public static function getUserContext() {
        return [
            'user_id' => self::$userId,
            'user_email' => self::$userEmail,
            'user_role' => self::$userRole,
        ];
    }
    
    /**
     * Log a create action
     */
    public static function logCreate($entityType, $entityId, $entityName = null, $newValues = null, $description = null) {
        return self::log(
            AuditLogService::ACTION_CREATE,
            $entityType,
            $entityId,
            $entityName,
            null,
            $newValues,
            $description
        );
    }
    
    /**
     * Log an update action
     */
    public static function logUpdate($entityType, $entityId, $entityName = null, $oldValues = null, $newValues = null, $description = null) {
        return self::log(
            AuditLogService::ACTION_UPDATE,
            $entityType,
            $entityId,
            $entityName,
            $oldValues,
            $newValues,
            $description
        );
    }
    
    /**
     * Log a delete action
     */
    public static function logDelete($entityType, $entityId, $entityName = null, $oldValues = null, $description = null) {
        return self::log(
            AuditLogService::ACTION_DELETE,
            $entityType,
            $entityId,
            $entityName,
            $oldValues,
            null,
            $description
        );
    }
    
    /**
     * Log a read/view action
     */
    public static function logRead($entityType, $entityId, $entityName = null, $description = null) {
        return self::log(
            AuditLogService::ACTION_READ,
            $entityType,
            $entityId,
            $entityName,
            null,
            null,
            $description
        );
    }
    
    /**
     * Log a login action
     */
    public static function logLogin($userId, $email, $role) {
        self::setUserContext($userId, $email, $role);
        
        return self::log(
            AuditLogService::ACTION_LOGIN,
            AuditLogService::ENTITY_USER,
            $userId,
            $email,
            null,
            null,
            "User logged in successfully"
        );
    }
    
    /**
     * Log a failed login attempt
     */
    public static function logLoginFailed($email, $reason = null) {
        return self::log(
            AuditLogService::ACTION_LOGIN_FAILED,
            AuditLogService::ENTITY_USER,
            null,
            $email,
            null,
            null,
            $reason ?? "Failed login attempt",
            AuditLogService::SEVERITY_HIGH
        );
    }
    
    /**
     * Log a logout action
     */
    public static function logLogout($userId = null, $email = null) {
        $userId = $userId ?? self::$userId;
        $email = $email ?? self::$userEmail;
        
        return self::log(
            AuditLogService::ACTION_LOGOUT,
            AuditLogService::ENTITY_USER,
            $userId,
            $email,
            null,
            null,
            "User logged out"
        );
    }
    
    /**
     * Log a password change
     */
    public static function logPasswordChange($userId, $email = null) {
        return self::log(
            AuditLogService::ACTION_PASSWORD_CHANGE,
            AuditLogService::ENTITY_USER,
            $userId,
            $email,
            null,
            null,
            "Password changed",
            AuditLogService::SEVERITY_HIGH
        );
    }
    
    /**
     * Log a password reset
     */
    public static function logPasswordReset($userId, $email = null) {
        return self::log(
            AuditLogService::ACTION_PASSWORD_RESET,
            AuditLogService::ENTITY_USER,
            $userId,
            $email,
            null,
            null,
            "Password reset requested",
            AuditLogService::SEVERITY_HIGH
        );
    }
    
    /**
     * Log an export action
     */
    public static function logExport($entityType, $description = null, $metadata = null) {
        return self::log(
            AuditLogService::ACTION_EXPORT,
            $entityType,
            null,
            null,
            null,
            null,
            $description ?? "Data exported",
            AuditLogService::SEVERITY_MEDIUM,
            $metadata
        );
    }
    
    /**
     * Log an import action
     */
    public static function logImport($entityType, $description = null, $metadata = null) {
        return self::log(
            AuditLogService::ACTION_IMPORT,
            $entityType,
            null,
            null,
            null,
            null,
            $description ?? "Data imported",
            AuditLogService::SEVERITY_MEDIUM,
            $metadata
        );
    }
    
    /**
     * Log a settings change
     */
    public static function logSettingsChange($settingName, $oldValue = null, $newValue = null) {
        return self::log(
            AuditLogService::ACTION_SETTINGS_CHANGE,
            AuditLogService::ENTITY_SETTINGS,
            $settingName,
            $settingName,
            $oldValue ? ['value' => $oldValue] : null,
            $newValue ? ['value' => $newValue] : null,
            "Setting '{$settingName}' changed",
            AuditLogService::SEVERITY_HIGH
        );
    }
    
    /**
     * Log a permission change
     */
    public static function logPermissionChange($userId, $email, $oldPermissions = null, $newPermissions = null) {
        return self::log(
            AuditLogService::ACTION_PERMISSION_CHANGE,
            AuditLogService::ENTITY_USER,
            $userId,
            $email,
            $oldPermissions ? ['permissions' => $oldPermissions] : null,
            $newPermissions ? ['permissions' => $newPermissions] : null,
            "User permissions changed",
            AuditLogService::SEVERITY_CRITICAL
        );
    }
    
    /**
     * Core logging function
     */
    private static function log($action, $entityType, $entityId, $entityName, $oldValues, $newValues, $description, $severity = null, $metadata = null) {
        try {
            $auditService = AuditLogService::getInstance();
            
            return $auditService->log($action, $entityType, [
                'user_id' => self::$userId,
                'user_email' => self::$userEmail,
                'user_role' => self::$userRole,
                'entity_id' => $entityId,
                'entity_name' => $entityName,
                'description' => $description,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'severity' => $severity,
                'metadata' => $metadata,
            ]);
        } catch (Exception $e) {
            // Don't fail the main operation if audit logging fails
            error_log("Audit middleware error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Calculate changes between old and new values
     */
    public static function calculateChanges($oldValues, $newValues) {
        $changes = [];
        
        if (!is_array($oldValues) || !is_array($newValues)) {
            return $changes;
        }
        
        foreach ($newValues as $key => $newValue) {
            $oldValue = $oldValues[$key] ?? null;
            
            if ($oldValue !== $newValue) {
                $changes[$key] = [
                    'old' => $oldValue,
                    'new' => $newValue,
                ];
            }
        }
        
        return $changes;
    }
    
    /**
     * Filter sensitive fields from values
     */
    public static function filterSensitiveFields($values, $sensitiveFields = ['password', 'token', 'secret', 'api_key']) {
        if (!is_array($values)) {
            return $values;
        }
        
        $filtered = [];
        foreach ($values as $key => $value) {
            $lowerKey = strtolower($key);
            $isSensitive = false;
            
            foreach ($sensitiveFields as $field) {
                if (strpos($lowerKey, $field) !== false) {
                    $isSensitive = true;
                    break;
                }
            }
            
            $filtered[$key] = $isSensitive ? '[REDACTED]' : $value;
        }
        
        return $filtered;
    }
}

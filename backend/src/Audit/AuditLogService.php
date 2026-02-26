<?php
/**
 * Audit Log Service
 * Comprehensive audit trail for tracking user actions
 */

namespace McSMS\Audit;

require_once __DIR__ . '/../../config/env.php';

class AuditLogService {
    
    private $pdo;
    private static $instance = null;
    
    // Action types
    const ACTION_CREATE = 'create';
    const ACTION_READ = 'read';
    const ACTION_UPDATE = 'update';
    const ACTION_DELETE = 'delete';
    const ACTION_LOGIN = 'login';
    const ACTION_LOGOUT = 'logout';
    const ACTION_LOGIN_FAILED = 'login_failed';
    const ACTION_PASSWORD_CHANGE = 'password_change';
    const ACTION_PASSWORD_RESET = 'password_reset';
    const ACTION_EXPORT = 'export';
    const ACTION_IMPORT = 'import';
    const ACTION_BACKUP = 'backup';
    const ACTION_RESTORE = 'restore';
    const ACTION_PERMISSION_CHANGE = 'permission_change';
    const ACTION_SETTINGS_CHANGE = 'settings_change';
    
    // Entity types
    const ENTITY_USER = 'user';
    const ENTITY_STUDENT = 'student';
    const ENTITY_TEACHER = 'teacher';
    const ENTITY_PARENT = 'parent';
    const ENTITY_CLASS = 'class';
    const ENTITY_SUBJECT = 'subject';
    const ENTITY_GRADE = 'grade';
    const ENTITY_ATTENDANCE = 'attendance';
    const ENTITY_FEE = 'fee';
    const ENTITY_PAYMENT = 'payment';
    const ENTITY_INVOICE = 'invoice';
    const ENTITY_TIMETABLE = 'timetable';
    const ENTITY_EXAM = 'exam';
    const ENTITY_ASSIGNMENT = 'assignment';
    const ENTITY_MESSAGE = 'message';
    const ENTITY_NOTIFICATION = 'notification';
    const ENTITY_REPORT = 'report';
    const ENTITY_SETTINGS = 'settings';
    const ENTITY_BACKUP = 'backup';
    const ENTITY_SYSTEM = 'system';
    
    // Severity levels
    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';
    const SEVERITY_CRITICAL = 'critical';
    
    public function __construct() {
        $this->connect();
        $this->ensureTableExists();
    }
    
    /**
     * Get singleton instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Connect to database
     */
    private function connect() {
        $host = \Env::get('DB_HOST', 'localhost');
        $database = \Env::get('DB_NAME', 'school_management_system');
        $username = \Env::get('DB_USER', 'root');
        $password = \Env::get('DB_PASS', '');
        
        try {
            $this->pdo = new \PDO(
                "mysql:host={$host};dbname={$database};charset=utf8mb4",
                $username,
                $password,
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
        } catch (\PDOException $e) {
            throw new \Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    /**
     * Ensure audit_logs table exists
     */
    private function ensureTableExists() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                user_email VARCHAR(255),
                user_role VARCHAR(50),
                action VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id VARCHAR(100),
                entity_name VARCHAR(255),
                description TEXT,
                old_values JSON,
                new_values JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                request_method VARCHAR(10),
                request_uri TEXT,
                severity VARCHAR(20) DEFAULT 'low',
                metadata JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_entity_type (entity_type),
                INDEX idx_entity_id (entity_id),
                INDEX idx_severity (severity),
                INDEX idx_created_at (created_at),
                INDEX idx_user_action (user_id, action),
                INDEX idx_entity (entity_type, entity_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }
    
    /**
     * Log an action
     */
    public function log($action, $entityType, $data = []) {
        $defaults = [
            'user_id' => null,
            'user_email' => null,
            'user_role' => null,
            'entity_id' => null,
            'entity_name' => null,
            'description' => null,
            'old_values' => null,
            'new_values' => null,
            'severity' => self::SEVERITY_LOW,
            'metadata' => null,
        ];
        
        $data = array_merge($defaults, $data);
        
        // Auto-detect severity based on action
        if ($data['severity'] === self::SEVERITY_LOW) {
            $data['severity'] = $this->detectSeverity($action, $entityType);
        }
        
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO audit_logs (
                    user_id, user_email, user_role, action, entity_type,
                    entity_id, entity_name, description, old_values, new_values,
                    ip_address, user_agent, request_method, request_uri,
                    severity, metadata
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?
                )
            ");
            
            $stmt->execute([
                $data['user_id'],
                $data['user_email'],
                $data['user_role'],
                $action,
                $entityType,
                $data['entity_id'],
                $data['entity_name'],
                $data['description'],
                $data['old_values'] ? json_encode($data['old_values']) : null,
                $data['new_values'] ? json_encode($data['new_values']) : null,
                $this->getClientIP(),
                $_SERVER['HTTP_USER_AGENT'] ?? null,
                $_SERVER['REQUEST_METHOD'] ?? null,
                $_SERVER['REQUEST_URI'] ?? null,
                $data['severity'],
                $data['metadata'] ? json_encode($data['metadata']) : null,
            ]);
            
            return $this->pdo->lastInsertId();
        } catch (\PDOException $e) {
            // Log error but don't fail the main operation
            error_log("Audit log failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Auto-detect severity based on action and entity
     */
    private function detectSeverity($action, $entityType) {
        // Critical actions
        $criticalActions = [
            self::ACTION_DELETE,
            self::ACTION_RESTORE,
            self::ACTION_PERMISSION_CHANGE,
        ];
        
        $criticalEntities = [
            self::ENTITY_USER,
            self::ENTITY_BACKUP,
            self::ENTITY_SETTINGS,
        ];
        
        if (in_array($action, $criticalActions) && in_array($entityType, $criticalEntities)) {
            return self::SEVERITY_CRITICAL;
        }
        
        // High severity
        $highActions = [
            self::ACTION_DELETE,
            self::ACTION_PASSWORD_CHANGE,
            self::ACTION_PASSWORD_RESET,
            self::ACTION_LOGIN_FAILED,
        ];
        
        if (in_array($action, $highActions)) {
            return self::SEVERITY_HIGH;
        }
        
        // Medium severity
        $mediumActions = [
            self::ACTION_CREATE,
            self::ACTION_UPDATE,
            self::ACTION_EXPORT,
            self::ACTION_IMPORT,
        ];
        
        if (in_array($action, $mediumActions)) {
            return self::SEVERITY_MEDIUM;
        }
        
        return self::SEVERITY_LOW;
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP() {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
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
     * Get audit logs with filtering
     */
    public function getLogs($filters = [], $page = 1, $limit = 50) {
        $where = ['1=1'];
        $params = [];
        
        if (!empty($filters['user_id'])) {
            $where[] = 'user_id = ?';
            $params[] = $filters['user_id'];
        }
        
        if (!empty($filters['action'])) {
            $where[] = 'action = ?';
            $params[] = $filters['action'];
        }
        
        if (!empty($filters['entity_type'])) {
            $where[] = 'entity_type = ?';
            $params[] = $filters['entity_type'];
        }
        
        if (!empty($filters['entity_id'])) {
            $where[] = 'entity_id = ?';
            $params[] = $filters['entity_id'];
        }
        
        if (!empty($filters['severity'])) {
            $where[] = 'severity = ?';
            $params[] = $filters['severity'];
        }
        
        if (!empty($filters['date_from'])) {
            $where[] = 'created_at >= ?';
            $params[] = $filters['date_from'] . ' 00:00:00';
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = 'created_at <= ?';
            $params[] = $filters['date_to'] . ' 23:59:59';
        }
        
        if (!empty($filters['search'])) {
            $where[] = '(description LIKE ? OR entity_name LIKE ? OR user_email LIKE ?)';
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $where);
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $countStmt = $this->pdo->prepare("SELECT COUNT(*) FROM audit_logs WHERE {$whereClause}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();
        
        // Get logs
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->pdo->prepare("
            SELECT * FROM audit_logs 
            WHERE {$whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $logs = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Parse JSON fields
        foreach ($logs as &$log) {
            $log['old_values'] = $log['old_values'] ? json_decode($log['old_values'], true) : null;
            $log['new_values'] = $log['new_values'] ? json_decode($log['new_values'], true) : null;
            $log['metadata'] = $log['metadata'] ? json_decode($log['metadata'], true) : null;
        }
        
        return [
            'logs' => $logs,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($total / $limit),
        ];
    }
    
    /**
     * Get single log entry
     */
    public function getLog($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM audit_logs WHERE id = ?");
        $stmt->execute([$id]);
        $log = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($log) {
            $log['old_values'] = $log['old_values'] ? json_decode($log['old_values'], true) : null;
            $log['new_values'] = $log['new_values'] ? json_decode($log['new_values'], true) : null;
            $log['metadata'] = $log['metadata'] ? json_decode($log['metadata'], true) : null;
        }
        
        return $log;
    }
    
    /**
     * Get audit statistics
     */
    public function getStatistics($days = 30) {
        $dateFrom = date('Y-m-d', strtotime("-{$days} days"));
        
        // Total logs
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM audit_logs WHERE created_at >= ?");
        $stmt->execute([$dateFrom]);
        $totalLogs = (int) $stmt->fetchColumn();
        
        // Logs by action
        $stmt = $this->pdo->prepare("
            SELECT action, COUNT(*) as count 
            FROM audit_logs 
            WHERE created_at >= ?
            GROUP BY action 
            ORDER BY count DESC
        ");
        $stmt->execute([$dateFrom]);
        $byAction = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Logs by entity type
        $stmt = $this->pdo->prepare("
            SELECT entity_type, COUNT(*) as count 
            FROM audit_logs 
            WHERE created_at >= ?
            GROUP BY entity_type 
            ORDER BY count DESC
        ");
        $stmt->execute([$dateFrom]);
        $byEntity = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Logs by severity
        $stmt = $this->pdo->prepare("
            SELECT severity, COUNT(*) as count 
            FROM audit_logs 
            WHERE created_at >= ?
            GROUP BY severity 
            ORDER BY FIELD(severity, 'critical', 'high', 'medium', 'low')
        ");
        $stmt->execute([$dateFrom]);
        $bySeverity = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Daily activity
        $stmt = $this->pdo->prepare("
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM audit_logs 
            WHERE created_at >= ?
            GROUP BY DATE(created_at) 
            ORDER BY date
        ");
        $stmt->execute([$dateFrom]);
        $dailyActivity = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Top users
        $stmt = $this->pdo->prepare("
            SELECT user_id, user_email, COUNT(*) as count 
            FROM audit_logs 
            WHERE created_at >= ? AND user_id IS NOT NULL
            GROUP BY user_id, user_email 
            ORDER BY count DESC 
            LIMIT 10
        ");
        $stmt->execute([$dateFrom]);
        $topUsers = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Recent critical/high severity
        $stmt = $this->pdo->prepare("
            SELECT * FROM audit_logs 
            WHERE severity IN ('critical', 'high') AND created_at >= ?
            ORDER BY created_at DESC 
            LIMIT 10
        ");
        $stmt->execute([$dateFrom]);
        $recentCritical = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return [
            'total_logs' => $totalLogs,
            'by_action' => $byAction,
            'by_entity' => $byEntity,
            'by_severity' => $bySeverity,
            'daily_activity' => $dailyActivity,
            'top_users' => $topUsers,
            'recent_critical' => $recentCritical,
            'period_days' => $days,
        ];
    }
    
    /**
     * Get entity history
     */
    public function getEntityHistory($entityType, $entityId, $limit = 50) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM audit_logs 
            WHERE entity_type = ? AND entity_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$entityType, $entityId, $limit]);
        $logs = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($logs as &$log) {
            $log['old_values'] = $log['old_values'] ? json_decode($log['old_values'], true) : null;
            $log['new_values'] = $log['new_values'] ? json_decode($log['new_values'], true) : null;
            $log['metadata'] = $log['metadata'] ? json_decode($log['metadata'], true) : null;
        }
        
        return $logs;
    }
    
    /**
     * Get user activity
     */
    public function getUserActivity($userId, $limit = 50) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM audit_logs 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$userId, $limit]);
        $logs = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($logs as &$log) {
            $log['old_values'] = $log['old_values'] ? json_decode($log['old_values'], true) : null;
            $log['new_values'] = $log['new_values'] ? json_decode($log['new_values'], true) : null;
            $log['metadata'] = $log['metadata'] ? json_decode($log['metadata'], true) : null;
        }
        
        return $logs;
    }
    
    /**
     * Cleanup old logs
     */
    public function cleanup($retentionDays = 365) {
        $cutoffDate = date('Y-m-d', strtotime("-{$retentionDays} days"));
        
        $stmt = $this->pdo->prepare("DELETE FROM audit_logs WHERE created_at < ?");
        $stmt->execute([$cutoffDate]);
        
        return $stmt->rowCount();
    }
    
    /**
     * Export logs to CSV
     */
    public function exportToCSV($filters = [], $filename = null) {
        $result = $this->getLogs($filters, 1, 10000);
        $logs = $result['logs'];
        
        if (!$filename) {
            $filename = 'audit_logs_' . date('Y-m-d_H-i-s') . '.csv';
        }
        
        $output = fopen('php://temp', 'r+');
        
        // Header row
        fputcsv($output, [
            'ID', 'Date', 'User ID', 'User Email', 'User Role',
            'Action', 'Entity Type', 'Entity ID', 'Entity Name',
            'Description', 'Severity', 'IP Address'
        ]);
        
        // Data rows
        foreach ($logs as $log) {
            fputcsv($output, [
                $log['id'],
                $log['created_at'],
                $log['user_id'],
                $log['user_email'],
                $log['user_role'],
                $log['action'],
                $log['entity_type'],
                $log['entity_id'],
                $log['entity_name'],
                $log['description'],
                $log['severity'],
                $log['ip_address'],
            ]);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return [
            'filename' => $filename,
            'content' => $csv,
            'mime' => 'text/csv',
        ];
    }
}

/**
 * Helper function for quick logging
 */
function audit_log($action, $entityType, $data = []) {
    return AuditLogService::getInstance()->log($action, $entityType, $data);
}

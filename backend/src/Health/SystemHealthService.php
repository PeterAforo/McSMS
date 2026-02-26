<?php
/**
 * System Health Monitoring Service
 * Monitors server health, database, disk space, memory, and application metrics
 */

namespace McSMS\Health;

require_once __DIR__ . '/../../config/env.php';

class SystemHealthService {
    
    private $pdo;
    private $metricsDir;
    
    // Health status constants
    const STATUS_HEALTHY = 'healthy';
    const STATUS_WARNING = 'warning';
    const STATUS_CRITICAL = 'critical';
    const STATUS_UNKNOWN = 'unknown';
    
    public function __construct() {
        $this->metricsDir = __DIR__ . '/../../logs/metrics';
        
        if (!is_dir($this->metricsDir)) {
            mkdir($this->metricsDir, 0755, true);
        }
        
        $this->connect();
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
            $this->pdo = null;
        }
    }
    
    /**
     * Get complete system health status
     */
    public function getHealthStatus() {
        $checks = [
            'database' => $this->checkDatabase(),
            'disk' => $this->checkDiskSpace(),
            'memory' => $this->checkMemory(),
            'php' => $this->checkPHP(),
            'cache' => $this->checkCache(),
            'uploads' => $this->checkUploads(),
            'logs' => $this->checkLogs(),
        ];
        
        // Determine overall status
        $statuses = array_column($checks, 'status');
        
        if (in_array(self::STATUS_CRITICAL, $statuses)) {
            $overallStatus = self::STATUS_CRITICAL;
        } elseif (in_array(self::STATUS_WARNING, $statuses)) {
            $overallStatus = self::STATUS_WARNING;
        } elseif (in_array(self::STATUS_UNKNOWN, $statuses)) {
            $overallStatus = self::STATUS_WARNING;
        } else {
            $overallStatus = self::STATUS_HEALTHY;
        }
        
        return [
            'status' => $overallStatus,
            'timestamp' => date('Y-m-d H:i:s'),
            'checks' => $checks,
            'server' => $this->getServerInfo(),
        ];
    }
    
    /**
     * Check database health
     */
    public function checkDatabase() {
        if (!$this->pdo) {
            return [
                'name' => 'Database',
                'status' => self::STATUS_CRITICAL,
                'message' => 'Database connection failed',
                'details' => null,
            ];
        }
        
        try {
            // Check connection
            $start = microtime(true);
            $this->pdo->query('SELECT 1');
            $responseTime = round((microtime(true) - $start) * 1000, 2);
            
            // Get database size
            $stmt = $this->pdo->query("
                SELECT 
                    SUM(data_length + index_length) as size,
                    COUNT(*) as tables
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
            ");
            $dbInfo = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            // Get connection count
            $stmt = $this->pdo->query("SHOW STATUS LIKE 'Threads_connected'");
            $connections = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            // Get max connections
            $stmt = $this->pdo->query("SHOW VARIABLES LIKE 'max_connections'");
            $maxConnections = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            $connectionPercent = 0;
            if ($maxConnections && $connections) {
                $connectionPercent = round(($connections['Value'] / $maxConnections['Value']) * 100, 1);
            }
            
            $status = self::STATUS_HEALTHY;
            $message = 'Database is healthy';
            
            if ($responseTime > 100) {
                $status = self::STATUS_WARNING;
                $message = 'Database response time is slow';
            }
            
            if ($connectionPercent > 80) {
                $status = self::STATUS_WARNING;
                $message = 'High number of database connections';
            }
            
            return [
                'name' => 'Database',
                'status' => $status,
                'message' => $message,
                'details' => [
                    'response_time_ms' => $responseTime,
                    'size_bytes' => (int) $dbInfo['size'],
                    'size_formatted' => $this->formatBytes((int) $dbInfo['size']),
                    'tables' => (int) $dbInfo['tables'],
                    'connections' => (int) ($connections['Value'] ?? 0),
                    'max_connections' => (int) ($maxConnections['Value'] ?? 0),
                    'connection_percent' => $connectionPercent,
                ],
            ];
        } catch (\Exception $e) {
            return [
                'name' => 'Database',
                'status' => self::STATUS_CRITICAL,
                'message' => 'Database check failed: ' . $e->getMessage(),
                'details' => null,
            ];
        }
    }
    
    /**
     * Check disk space
     */
    public function checkDiskSpace() {
        $path = __DIR__ . '/../../';
        
        $total = @disk_total_space($path);
        $free = @disk_free_space($path);
        
        if ($total === false || $free === false) {
            return [
                'name' => 'Disk Space',
                'status' => self::STATUS_UNKNOWN,
                'message' => 'Unable to check disk space',
                'details' => null,
            ];
        }
        
        $used = $total - $free;
        $usedPercent = round(($used / $total) * 100, 1);
        
        $status = self::STATUS_HEALTHY;
        $message = 'Disk space is adequate';
        
        if ($usedPercent > 90) {
            $status = self::STATUS_CRITICAL;
            $message = 'Disk space critically low';
        } elseif ($usedPercent > 80) {
            $status = self::STATUS_WARNING;
            $message = 'Disk space running low';
        }
        
        return [
            'name' => 'Disk Space',
            'status' => $status,
            'message' => $message,
            'details' => [
                'total_bytes' => $total,
                'total_formatted' => $this->formatBytes($total),
                'free_bytes' => $free,
                'free_formatted' => $this->formatBytes($free),
                'used_bytes' => $used,
                'used_formatted' => $this->formatBytes($used),
                'used_percent' => $usedPercent,
            ],
        ];
    }
    
    /**
     * Check memory usage
     */
    public function checkMemory() {
        $memoryLimit = ini_get('memory_limit');
        $memoryUsage = memory_get_usage(true);
        $peakUsage = memory_get_peak_usage(true);
        
        // Convert memory limit to bytes
        $limitBytes = $this->convertToBytes($memoryLimit);
        $usedPercent = $limitBytes > 0 ? round(($memoryUsage / $limitBytes) * 100, 1) : 0;
        
        $status = self::STATUS_HEALTHY;
        $message = 'Memory usage is normal';
        
        if ($usedPercent > 90) {
            $status = self::STATUS_CRITICAL;
            $message = 'Memory usage critically high';
        } elseif ($usedPercent > 75) {
            $status = self::STATUS_WARNING;
            $message = 'Memory usage is high';
        }
        
        return [
            'name' => 'Memory',
            'status' => $status,
            'message' => $message,
            'details' => [
                'limit' => $memoryLimit,
                'limit_bytes' => $limitBytes,
                'usage_bytes' => $memoryUsage,
                'usage_formatted' => $this->formatBytes($memoryUsage),
                'peak_bytes' => $peakUsage,
                'peak_formatted' => $this->formatBytes($peakUsage),
                'used_percent' => $usedPercent,
            ],
        ];
    }
    
    /**
     * Check PHP configuration
     */
    public function checkPHP() {
        $version = phpversion();
        $minVersion = '7.4.0';
        
        $extensions = [
            'pdo' => extension_loaded('pdo'),
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'json' => extension_loaded('json'),
            'mbstring' => extension_loaded('mbstring'),
            'curl' => extension_loaded('curl'),
            'gd' => extension_loaded('gd'),
            'zip' => extension_loaded('zip'),
        ];
        
        $missingExtensions = array_keys(array_filter($extensions, function($v) { return !$v; }));
        
        $status = self::STATUS_HEALTHY;
        $message = 'PHP configuration is optimal';
        
        if (version_compare($version, $minVersion, '<')) {
            $status = self::STATUS_WARNING;
            $message = "PHP version {$version} is below recommended {$minVersion}";
        }
        
        if (!empty($missingExtensions)) {
            $status = self::STATUS_WARNING;
            $message = 'Missing PHP extensions: ' . implode(', ', $missingExtensions);
        }
        
        return [
            'name' => 'PHP',
            'status' => $status,
            'message' => $message,
            'details' => [
                'version' => $version,
                'min_version' => $minVersion,
                'extensions' => $extensions,
                'missing_extensions' => $missingExtensions,
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size'),
            ],
        ];
    }
    
    /**
     * Check cache directory
     */
    public function checkCache() {
        $cacheDir = __DIR__ . '/../../cache';
        
        if (!is_dir($cacheDir)) {
            return [
                'name' => 'Cache',
                'status' => self::STATUS_WARNING,
                'message' => 'Cache directory does not exist',
                'details' => ['path' => $cacheDir],
            ];
        }
        
        $writable = is_writable($cacheDir);
        $size = $this->getDirectorySize($cacheDir);
        
        $status = $writable ? self::STATUS_HEALTHY : self::STATUS_WARNING;
        $message = $writable ? 'Cache is operational' : 'Cache directory is not writable';
        
        return [
            'name' => 'Cache',
            'status' => $status,
            'message' => $message,
            'details' => [
                'path' => $cacheDir,
                'writable' => $writable,
                'size_bytes' => $size,
                'size_formatted' => $this->formatBytes($size),
            ],
        ];
    }
    
    /**
     * Check uploads directory
     */
    public function checkUploads() {
        $uploadsDir = __DIR__ . '/../../uploads';
        
        if (!is_dir($uploadsDir)) {
            return [
                'name' => 'Uploads',
                'status' => self::STATUS_WARNING,
                'message' => 'Uploads directory does not exist',
                'details' => ['path' => $uploadsDir],
            ];
        }
        
        $writable = is_writable($uploadsDir);
        $size = $this->getDirectorySize($uploadsDir);
        $fileCount = $this->countFiles($uploadsDir);
        
        $status = $writable ? self::STATUS_HEALTHY : self::STATUS_CRITICAL;
        $message = $writable ? 'Uploads directory is operational' : 'Uploads directory is not writable';
        
        return [
            'name' => 'Uploads',
            'status' => $status,
            'message' => $message,
            'details' => [
                'path' => $uploadsDir,
                'writable' => $writable,
                'size_bytes' => $size,
                'size_formatted' => $this->formatBytes($size),
                'file_count' => $fileCount,
            ],
        ];
    }
    
    /**
     * Check logs directory
     */
    public function checkLogs() {
        $logsDir = __DIR__ . '/../../logs';
        
        if (!is_dir($logsDir)) {
            @mkdir($logsDir, 0755, true);
        }
        
        $writable = is_writable($logsDir);
        $size = $this->getDirectorySize($logsDir);
        
        $status = self::STATUS_HEALTHY;
        $message = 'Logs directory is operational';
        
        if (!$writable) {
            $status = self::STATUS_WARNING;
            $message = 'Logs directory is not writable';
        }
        
        // Check if logs are too large (> 100MB)
        if ($size > 100 * 1024 * 1024) {
            $status = self::STATUS_WARNING;
            $message = 'Log files are taking up significant space';
        }
        
        return [
            'name' => 'Logs',
            'status' => $status,
            'message' => $message,
            'details' => [
                'path' => $logsDir,
                'writable' => $writable,
                'size_bytes' => $size,
                'size_formatted' => $this->formatBytes($size),
            ],
        ];
    }
    
    /**
     * Get server information
     */
    public function getServerInfo() {
        return [
            'hostname' => gethostname(),
            'os' => PHP_OS,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'server_time' => date('Y-m-d H:i:s'),
            'timezone' => date_default_timezone_get(),
            'uptime' => $this->getUptime(),
        ];
    }
    
    /**
     * Get application metrics
     */
    public function getApplicationMetrics() {
        if (!$this->pdo) {
            return null;
        }
        
        try {
            $metrics = [];
            
            // User counts
            $stmt = $this->pdo->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
            $metrics['users_by_role'] = $stmt->fetchAll(\PDO::FETCH_KEY_PAIR);
            
            // Total users
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM users");
            $metrics['total_users'] = (int) $stmt->fetchColumn();
            
            // Active sessions (last 24 hours)
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE last_login > DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            $metrics['active_users_24h'] = (int) $stmt->fetchColumn();
            
            // Student count
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM students");
            $metrics['total_students'] = (int) $stmt->fetchColumn();
            
            // Recent logins
            $stmt = $this->pdo->query("
                SELECT COUNT(*) as count, DATE(login_time) as date 
                FROM login_history 
                WHERE login_time > DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(login_time)
                ORDER BY date
            ");
            $metrics['login_trend'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Error count (from audit logs)
            $stmt = $this->pdo->query("
                SELECT COUNT(*) FROM audit_logs 
                WHERE severity IN ('critical', 'high') 
                AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $metrics['errors_24h'] = (int) $stmt->fetchColumn();
            
            return $metrics;
        } catch (\Exception $e) {
            return null;
        }
    }
    
    /**
     * Get recent errors from logs
     */
    public function getRecentErrors($limit = 20) {
        $errors = [];
        $errorLogFile = __DIR__ . '/../../logs/error.log';
        
        if (file_exists($errorLogFile)) {
            $lines = file($errorLogFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $lines = array_slice($lines, -$limit);
            $errors = array_reverse($lines);
        }
        
        // Also get from audit logs
        if ($this->pdo) {
            try {
                $stmt = $this->pdo->prepare("
                    SELECT * FROM audit_logs 
                    WHERE severity IN ('critical', 'high')
                    ORDER BY created_at DESC
                    LIMIT ?
                ");
                $stmt->execute([$limit]);
                $auditErrors = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                
                return [
                    'file_errors' => $errors,
                    'audit_errors' => $auditErrors,
                ];
            } catch (\Exception $e) {
                return ['file_errors' => $errors, 'audit_errors' => []];
            }
        }
        
        return ['file_errors' => $errors, 'audit_errors' => []];
    }
    
    /**
     * Record a metric
     */
    public function recordMetric($name, $value, $tags = []) {
        $metric = [
            'name' => $name,
            'value' => $value,
            'tags' => $tags,
            'timestamp' => time(),
        ];
        
        $filename = $this->metricsDir . '/' . date('Y-m-d') . '.json';
        
        $metrics = [];
        if (file_exists($filename)) {
            $metrics = json_decode(file_get_contents($filename), true) ?: [];
        }
        
        $metrics[] = $metric;
        
        file_put_contents($filename, json_encode($metrics), LOCK_EX);
        
        return true;
    }
    
    /**
     * Get metrics for a time range
     */
    public function getMetrics($name = null, $days = 7) {
        $metrics = [];
        
        for ($i = 0; $i < $days; $i++) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $filename = $this->metricsDir . '/' . $date . '.json';
            
            if (file_exists($filename)) {
                $dayMetrics = json_decode(file_get_contents($filename), true) ?: [];
                
                if ($name) {
                    $dayMetrics = array_filter($dayMetrics, function($m) use ($name) {
                        return $m['name'] === $name;
                    });
                }
                
                $metrics = array_merge($metrics, $dayMetrics);
            }
        }
        
        return $metrics;
    }
    
    /**
     * Get server uptime
     */
    private function getUptime() {
        if (PHP_OS === 'Linux') {
            $uptime = @file_get_contents('/proc/uptime');
            if ($uptime) {
                $seconds = (int) explode(' ', $uptime)[0];
                return $this->formatUptime($seconds);
            }
        }
        
        return 'Unknown';
    }
    
    /**
     * Format uptime
     */
    private function formatUptime($seconds) {
        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        
        $parts = [];
        if ($days > 0) $parts[] = "{$days}d";
        if ($hours > 0) $parts[] = "{$hours}h";
        if ($minutes > 0) $parts[] = "{$minutes}m";
        
        return implode(' ', $parts) ?: '< 1m';
    }
    
    /**
     * Format bytes to human readable
     */
    private function formatBytes($bytes) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
    
    /**
     * Convert memory string to bytes
     */
    private function convertToBytes($value) {
        $value = trim($value);
        $unit = strtolower(substr($value, -1));
        $bytes = (int) $value;
        
        switch ($unit) {
            case 'g': $bytes *= 1024;
            case 'm': $bytes *= 1024;
            case 'k': $bytes *= 1024;
        }
        
        return $bytes;
    }
    
    /**
     * Get directory size
     */
    private function getDirectorySize($path) {
        $size = 0;
        
        if (!is_dir($path)) {
            return 0;
        }
        
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }
        
        return $size;
    }
    
    /**
     * Count files in directory
     */
    private function countFiles($path) {
        if (!is_dir($path)) {
            return 0;
        }
        
        $count = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $count++;
            }
        }
        
        return $count;
    }
}

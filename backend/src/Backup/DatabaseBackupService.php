<?php
/**
 * Database Backup Service
 * Handles database backup and restore operations
 */

namespace McSMS\Backup;

require_once __DIR__ . '/../../config/env.php';

class DatabaseBackupService {
    
    private $host;
    private $database;
    private $username;
    private $password;
    private $backupDir;
    private $maxBackups;
    private $pdo;
    
    public function __construct() {
        $this->host = \Env::get('DB_HOST', 'localhost');
        $this->database = \Env::get('DB_NAME', 'school_management_system');
        $this->username = \Env::get('DB_USER', 'root');
        $this->password = \Env::get('DB_PASS', '');
        $this->backupDir = __DIR__ . '/../../backups';
        $this->maxBackups = (int) \Env::get('MAX_BACKUPS', 10);
        
        // Ensure backup directory exists
        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }
        
        // Create .htaccess to protect backups
        $htaccess = $this->backupDir . '/.htaccess';
        if (!file_exists($htaccess)) {
            file_put_contents($htaccess, "Deny from all\n");
        }
        
        $this->connect();
    }
    
    /**
     * Connect to database
     */
    private function connect() {
        try {
            $this->pdo = new \PDO(
                "mysql:host={$this->host};dbname={$this->database};charset=utf8mb4",
                $this->username,
                $this->password,
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
        } catch (\PDOException $e) {
            throw new \Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    /**
     * Create a full database backup
     * @param string $description Optional description for the backup
     * @return array Backup info
     */
    public function createBackup($description = '') {
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "backup_{$this->database}_{$timestamp}.sql";
        $filepath = $this->backupDir . '/' . $filename;
        
        $sql = $this->generateBackupSQL();
        
        // Compress the backup
        $compressedFilename = $filename . '.gz';
        $compressedFilepath = $this->backupDir . '/' . $compressedFilename;
        
        $gzFile = gzopen($compressedFilepath, 'w9');
        if (!$gzFile) {
            throw new \Exception("Failed to create backup file");
        }
        
        gzwrite($gzFile, $sql);
        gzclose($gzFile);
        
        // Create metadata file
        $metadata = [
            'filename' => $compressedFilename,
            'database' => $this->database,
            'created_at' => date('Y-m-d H:i:s'),
            'timestamp' => $timestamp,
            'size' => filesize($compressedFilepath),
            'size_formatted' => $this->formatBytes(filesize($compressedFilepath)),
            'description' => $description,
            'tables' => $this->getTableCount(),
            'rows' => $this->getTotalRows(),
            'checksum' => md5_file($compressedFilepath),
        ];
        
        $metadataFile = $this->backupDir . '/' . $filename . '.json';
        file_put_contents($metadataFile, json_encode($metadata, JSON_PRETTY_PRINT));
        
        // Clean up old backups
        $this->cleanupOldBackups();
        
        // Log the backup
        $this->logBackup('create', $compressedFilename, true);
        
        return $metadata;
    }
    
    /**
     * Generate SQL backup content
     */
    private function generateBackupSQL() {
        $sql = "-- McSMS Database Backup\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $sql .= "-- Database: {$this->database}\n";
        $sql .= "-- Host: {$this->host}\n\n";
        
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n";
        $sql .= "SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';\n";
        $sql .= "SET AUTOCOMMIT=0;\n";
        $sql .= "START TRANSACTION;\n\n";
        
        // Get all tables
        $tables = $this->getTables();
        
        foreach ($tables as $table) {
            $sql .= $this->backupTable($table);
        }
        
        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        $sql .= "COMMIT;\n";
        
        return $sql;
    }
    
    /**
     * Backup a single table
     */
    private function backupTable($table) {
        $sql = "\n-- --------------------------------------------------------\n";
        $sql .= "-- Table structure for `{$table}`\n";
        $sql .= "-- --------------------------------------------------------\n\n";
        
        // Get CREATE TABLE statement
        $stmt = $this->pdo->query("SHOW CREATE TABLE `{$table}`");
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";
        $sql .= $row['Create Table'] . ";\n\n";
        
        // Get table data
        $stmt = $this->pdo->query("SELECT * FROM `{$table}`");
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        if (count($rows) > 0) {
            $sql .= "-- Dumping data for table `{$table}`\n\n";
            
            $columns = array_keys($rows[0]);
            $columnList = '`' . implode('`, `', $columns) . '`';
            
            // Batch inserts for better performance
            $batchSize = 100;
            $batches = array_chunk($rows, $batchSize);
            
            foreach ($batches as $batch) {
                $values = [];
                foreach ($batch as $row) {
                    $rowValues = [];
                    foreach ($row as $value) {
                        if ($value === null) {
                            $rowValues[] = 'NULL';
                        } else {
                            $rowValues[] = $this->pdo->quote($value);
                        }
                    }
                    $values[] = '(' . implode(', ', $rowValues) . ')';
                }
                $sql .= "INSERT INTO `{$table}` ({$columnList}) VALUES\n";
                $sql .= implode(",\n", $values) . ";\n\n";
            }
        }
        
        return $sql;
    }
    
    /**
     * Restore database from backup
     * @param string $filename Backup filename
     * @return bool Success status
     */
    public function restoreBackup($filename) {
        $filepath = $this->backupDir . '/' . $filename;
        
        if (!file_exists($filepath)) {
            throw new \Exception("Backup file not found: {$filename}");
        }
        
        // Verify checksum if metadata exists
        $metadataFile = str_replace('.gz', '.json', $filepath);
        if (file_exists($metadataFile)) {
            $metadata = json_decode(file_get_contents($metadataFile), true);
            if (isset($metadata['checksum'])) {
                $currentChecksum = md5_file($filepath);
                if ($currentChecksum !== $metadata['checksum']) {
                    throw new \Exception("Backup file integrity check failed");
                }
            }
        }
        
        // Read and decompress backup
        $sql = '';
        $gzFile = gzopen($filepath, 'r');
        if (!$gzFile) {
            throw new \Exception("Failed to open backup file");
        }
        
        while (!gzeof($gzFile)) {
            $sql .= gzread($gzFile, 10240);
        }
        gzclose($gzFile);
        
        // Execute restore
        try {
            $this->pdo->exec("SET FOREIGN_KEY_CHECKS=0");
            
            // Split SQL into statements
            $statements = $this->splitSQLStatements($sql);
            
            foreach ($statements as $statement) {
                $statement = trim($statement);
                if (!empty($statement) && !$this->isComment($statement)) {
                    $this->pdo->exec($statement);
                }
            }
            
            $this->pdo->exec("SET FOREIGN_KEY_CHECKS=1");
            
            // Log the restore
            $this->logBackup('restore', $filename, true);
            
            return true;
        } catch (\PDOException $e) {
            $this->logBackup('restore', $filename, false, $e->getMessage());
            throw new \Exception("Restore failed: " . $e->getMessage());
        }
    }
    
    /**
     * Split SQL into individual statements
     */
    private function splitSQLStatements($sql) {
        $statements = [];
        $current = '';
        $inString = false;
        $stringChar = '';
        
        for ($i = 0; $i < strlen($sql); $i++) {
            $char = $sql[$i];
            $prev = $i > 0 ? $sql[$i - 1] : '';
            
            if (!$inString && ($char === '"' || $char === "'")) {
                $inString = true;
                $stringChar = $char;
            } elseif ($inString && $char === $stringChar && $prev !== '\\') {
                $inString = false;
            }
            
            if (!$inString && $char === ';') {
                $statements[] = $current;
                $current = '';
            } else {
                $current .= $char;
            }
        }
        
        if (!empty(trim($current))) {
            $statements[] = $current;
        }
        
        return $statements;
    }
    
    /**
     * Check if statement is a comment
     */
    private function isComment($statement) {
        $statement = trim($statement);
        return strpos($statement, '--') === 0 || strpos($statement, '/*') === 0;
    }
    
    /**
     * List all available backups
     */
    public function listBackups() {
        $backups = [];
        $files = glob($this->backupDir . '/*.sql.gz');
        
        foreach ($files as $file) {
            $filename = basename($file);
            $metadataFile = str_replace('.gz', '.json', $file);
            
            if (file_exists($metadataFile)) {
                $metadata = json_decode(file_get_contents($metadataFile), true);
            } else {
                $metadata = [
                    'filename' => $filename,
                    'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                    'size' => filesize($file),
                    'size_formatted' => $this->formatBytes(filesize($file)),
                ];
            }
            
            $backups[] = $metadata;
        }
        
        // Sort by date descending
        usort($backups, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        return $backups;
    }
    
    /**
     * Delete a backup
     */
    public function deleteBackup($filename) {
        $filepath = $this->backupDir . '/' . $filename;
        $metadataFile = str_replace('.gz', '.json', $filepath);
        
        if (!file_exists($filepath)) {
            throw new \Exception("Backup file not found");
        }
        
        unlink($filepath);
        if (file_exists($metadataFile)) {
            unlink($metadataFile);
        }
        
        $this->logBackup('delete', $filename, true);
        
        return true;
    }
    
    /**
     * Download backup file
     */
    public function downloadBackup($filename) {
        $filepath = $this->backupDir . '/' . $filename;
        
        if (!file_exists($filepath)) {
            throw new \Exception("Backup file not found");
        }
        
        return [
            'filepath' => $filepath,
            'filename' => $filename,
            'size' => filesize($filepath),
            'mime' => 'application/gzip',
        ];
    }
    
    /**
     * Clean up old backups beyond max limit
     */
    private function cleanupOldBackups() {
        $backups = $this->listBackups();
        
        if (count($backups) > $this->maxBackups) {
            $toDelete = array_slice($backups, $this->maxBackups);
            foreach ($toDelete as $backup) {
                try {
                    $this->deleteBackup($backup['filename']);
                } catch (\Exception $e) {
                    // Log but don't fail
                }
            }
        }
    }
    
    /**
     * Get list of tables
     */
    private function getTables() {
        $stmt = $this->pdo->query("SHOW TABLES");
        return $stmt->fetchAll(\PDO::FETCH_COLUMN);
    }
    
    /**
     * Get table count
     */
    private function getTableCount() {
        return count($this->getTables());
    }
    
    /**
     * Get total row count across all tables
     */
    private function getTotalRows() {
        $total = 0;
        foreach ($this->getTables() as $table) {
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM `{$table}`");
            $total += (int) $stmt->fetchColumn();
        }
        return $total;
    }
    
    /**
     * Format bytes to human readable
     */
    private function formatBytes($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
    
    /**
     * Log backup operations
     */
    private function logBackup($action, $filename, $success, $error = null) {
        try {
            // Create backup_logs table if not exists
            $this->pdo->exec("
                CREATE TABLE IF NOT EXISTS backup_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    action VARCHAR(20) NOT NULL,
                    filename VARCHAR(255) NOT NULL,
                    success TINYINT(1) DEFAULT 1,
                    error_message TEXT,
                    user_id INT,
                    ip_address VARCHAR(45),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");
            
            $stmt = $this->pdo->prepare("
                INSERT INTO backup_logs (action, filename, success, error_message, ip_address)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $action,
                $filename,
                $success ? 1 : 0,
                $error,
                $_SERVER['REMOTE_ADDR'] ?? null,
            ]);
        } catch (\Exception $e) {
            // Silently fail logging
        }
    }
    
    /**
     * Get backup logs
     */
    public function getBackupLogs($limit = 50) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM backup_logs 
                ORDER BY created_at DESC 
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            return [];
        }
    }
    
    /**
     * Get backup statistics
     */
    public function getStatistics() {
        $backups = $this->listBackups();
        $totalSize = 0;
        
        foreach ($backups as $backup) {
            $totalSize += $backup['size'] ?? 0;
        }
        
        return [
            'total_backups' => count($backups),
            'total_size' => $totalSize,
            'total_size_formatted' => $this->formatBytes($totalSize),
            'max_backups' => $this->maxBackups,
            'latest_backup' => !empty($backups) ? $backups[0] : null,
            'database' => $this->database,
            'tables' => $this->getTableCount(),
            'total_rows' => $this->getTotalRows(),
        ];
    }
}

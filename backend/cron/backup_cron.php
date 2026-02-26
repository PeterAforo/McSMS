<?php
/**
 * Scheduled Database Backup Cron Job
 * 
 * Run this script via cron to create automatic backups.
 * 
 * Example crontab entry (daily at 2 AM):
 * 0 2 * * * php /path/to/McSMS/backend/cron/backup_cron.php
 * 
 * Example crontab entry (weekly on Sunday at 3 AM):
 * 0 3 * * 0 php /path/to/McSMS/backend/cron/backup_cron.php weekly
 */

// Prevent web access
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo "This script can only be run from the command line.";
    exit(1);
}

require_once __DIR__ . '/../src/Backup/DatabaseBackupService.php';

use McSMS\Backup\DatabaseBackupService;

// Get backup type from command line argument
$backupType = $argv[1] ?? 'daily';

echo "Starting {$backupType} backup at " . date('Y-m-d H:i:s') . "\n";

try {
    $backupService = new DatabaseBackupService();
    
    $description = ucfirst($backupType) . " automated backup";
    $backup = $backupService->createBackup($description);
    
    echo "Backup created successfully!\n";
    echo "Filename: {$backup['filename']}\n";
    echo "Size: {$backup['size_formatted']}\n";
    echo "Tables: {$backup['tables']}\n";
    echo "Rows: {$backup['rows']}\n";
    echo "Checksum: {$backup['checksum']}\n";
    
    // Get statistics
    $stats = $backupService->getStatistics();
    echo "\nBackup Statistics:\n";
    echo "Total backups: {$stats['total_backups']}\n";
    echo "Total size: {$stats['total_size_formatted']}\n";
    
    exit(0);
} catch (Exception $e) {
    echo "Backup failed: " . $e->getMessage() . "\n";
    
    // Log error to file
    $logFile = __DIR__ . '/../logs/backup_errors.log';
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logEntry = sprintf(
        "[%s] Backup failed: %s\n",
        date('Y-m-d H:i:s'),
        $e->getMessage()
    );
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    
    exit(1);
}

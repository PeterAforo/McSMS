<?php
require_once __DIR__ . '/../../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $sql = file_get_contents(__DIR__ . '/add_academic_calendar.sql');
    
    // Split by DELIMITER statements and execute each
    $statements = explode('DELIMITER //', $sql);
    
    foreach ($statements as $statement) {
        if (empty(trim($statement))) continue;
        
        // Remove DELIMITER ; if present
        $statement = str_replace('DELIMITER ;', '', $statement);
        
        // Split by semicolons but ignore those in procedures
        $parts = preg_split('/(?<=[;])\s*(?=DROP|CREATE|ALTER|INSERT)/', $statement);
        
        foreach ($parts as $part) {
            $part = trim($part);
            if (empty($part) || $part === ';') continue;
            
            // Remove trailing semicolon
            $part = rtrim($part, ';');
            
            if (!empty($part)) {
                try {
                    $pdo->exec($part);
                    echo "Executed: " . substr($part, 0, 50) . "...\n";
                } catch (Exception $e) {
                    // Ignore errors for IF NOT EXISTS and duplicate checks
                    if (strpos($e->getMessage(), 'already exists') === false && 
                        strpos($e->getMessage(), 'Duplicate') === false) {
                        echo "Error: " . $e->getMessage() . "\n";
                    }
                }
            }
        }
    }
    
    echo "\nAcademic Calendar Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}

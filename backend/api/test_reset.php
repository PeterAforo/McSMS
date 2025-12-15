<?php
/**
 * Test system_reset.php functionality
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Enable full error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Step 1: Starting...\n";

try {
    echo "Step 2: Loading config...\n";
    require_once __DIR__ . '/../../config/database.php';
    
    echo "Step 3: Connecting to database...\n";
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "Step 4: Database connected.\n";
    
    // Test the getResetPreview logic
    $tables = [
        'students' => 'Student records',
        'teachers' => 'Teacher records',
    ];
    
    $preview = [];
    foreach ($tables as $table => $description) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $result = $stmt->fetch();
            $preview[] = [
                'table' => $table,
                'description' => $description,
                'record_count' => (int)$result['count']
            ];
        } catch (PDOException $e) {
            echo "Error on table $table: " . $e->getMessage() . "\n";
        }
    }
    
    echo "Step 5: Preview generated.\n";
    echo json_encode(['success' => true, 'preview' => $preview], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

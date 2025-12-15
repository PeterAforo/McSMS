<?php
/**
 * Migration Runner
 * Run this in your browser to execute the migration
 * URL: http://localhost/McSMS/backend/run_migration.php
 */

// Set execution time limit
set_time_limit(300); // 5 minutes

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>HR Migration Runner</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .success { color: #28a745; background: #d4edda; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .error { color: #dc3545; background: #f8d7da; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .info { color: #0c5460; background: #d1ecf1; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .step { margin: 15px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; }
        .query { background: #f4f4f4; padding: 10px; margin: 5px 0; font-family: monospace; font-size: 12px; overflow-x: auto; }
        .button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .button:hover { background: #0056b3; }
        .warning { color: #856404; background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 4px; }
        pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 HR System Migration Runner</h1>
        
<?php
if (!isset($_POST['confirm'])) {
    ?>
    <div class="warning">
        <strong>⚠️ WARNING:</strong> This will modify your database structure!
        <ul>
            <li>Backup will be created automatically</li>
            <li>New columns will be added to employees table</li>
            <li>Auto-increment trigger will be created</li>
            <li>Users will be synced to employees</li>
        </ul>
    </div>
    
    <form method="POST">
        <input type="hidden" name="confirm" value="1">
        <button type="submit" class="button">✅ Run Migration</button>
    </form>
    <?php
    exit;
}

// Run the migration
require_once __DIR__ . '/../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true  // FIX: Enable buffered queries
        ]
    );
    
    echo "<div class='info'><strong>✅ Database connected successfully!</strong></div>";
    
    // Read the migration file
    $migrationFile = __DIR__ . '/../database/migrations/step_by_step_hr_migration.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    echo "<div class='info'><strong>📄 Migration file loaded</strong></div>";
    
    // Split into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($stmt) {
            return !empty($stmt) && 
                   !preg_match('/^--/', $stmt) && 
                   !preg_match('/^\/\*/', $stmt);
        }
    );
    
    echo "<div class='info'><strong>📊 Found " . count($statements) . " SQL statements</strong></div>";
    
    $successCount = 0;
    $errorCount = 0;
    $currentStep = '';
    
    foreach ($statements as $index => $statement) {
        // Check if this is a step marker
        if (preg_match("/SELECT '(STEP.*?)' as/i", $statement, $matches)) {
            $currentStep = $matches[1];
            echo "<div class='step'><strong>$currentStep</strong></div>";
        }
        
        try {
            // Skip DELIMITER statements
            if (stripos($statement, 'DELIMITER') !== false) {
                continue;
            }
            
            // Execute the statement
            $pdo->exec($statement);
            $successCount++;
            
            // Show query for important operations
            if (stripos($statement, 'ALTER TABLE') !== false || 
                stripos($statement, 'CREATE TRIGGER') !== false ||
                stripos($statement, 'INSERT INTO') !== false) {
                $shortQuery = substr($statement, 0, 100) . (strlen($statement) > 100 ? '...' : '');
                echo "<div class='success'>✅ Executed: " . htmlspecialchars($shortQuery) . "</div>";
            }
            
        } catch (PDOException $e) {
            $errorCount++;
            $errorMsg = $e->getMessage();
            
            // Check if it's a harmless error
            if (stripos($errorMsg, 'Duplicate column') !== false ||
                stripos($errorMsg, 'already exists') !== false ||
                stripos($errorMsg, 'check that column/key exists') !== false) {
                echo "<div class='warning'>⚠️ Skipped (already exists): " . htmlspecialchars(substr($statement, 0, 80)) . "...</div>";
            } else {
                echo "<div class='error'>";
                echo "<strong>❌ Error in statement " . ($index + 1) . ":</strong><br>";
                echo htmlspecialchars($errorMsg) . "<br>";
                echo "<div class='query'>" . htmlspecialchars(substr($statement, 0, 200)) . "...</div>";
                echo "</div>";
            }
        }
    }
    
    echo "<hr>";
    echo "<div class='success'><h2>✅ Migration Complete!</h2></div>";
    echo "<div class='info'>";
    echo "<strong>Summary:</strong><br>";
    echo "✅ Successful: $successCount<br>";
    echo "❌ Errors: $errorCount<br>";
    echo "</div>";
    
    // Run verification
    echo "<hr><h2>🔍 Verification</h2>";
    
    // Check employees table
    $stmt = $pdo->query("DESCRIBE employees");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "<div class='info'><strong>Employees table:</strong> " . count($columns) . " columns</div>";
    
    // Check employee numbers
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM employees WHERE employee_number LIKE 'EMP%'");
    $empCount = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<div class='info'><strong>Employees with auto-generated numbers:</strong> " . $empCount['count'] . "</div>";
    
    // Check user sync
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM users u 
        WHERE u.user_type IN ('admin', 'teacher')
        AND EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id)
    ");
    $syncCount = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<div class='info'><strong>Users synced to employees:</strong> " . $syncCount['count'] . "</div>";
    
    echo "<hr>";
    echo "<div class='success'>";
    echo "<h3>🎉 Next Steps:</h3>";
    echo "<ol>";
    echo "<li>Test the migration: <a href='test_hr_migration.php' target='_blank'>Run Tests</a></li>";
    echo "<li>Go to HR & Payroll page and test features</li>";
    echo "<li>Try adding a new employee</li>";
    echo "</ol>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='error'>";
    echo "<h2>❌ Fatal Error</h2>";
    echo "<strong>Message:</strong> " . htmlspecialchars($e->getMessage()) . "<br>";
    echo "<strong>File:</strong> " . $e->getFile() . "<br>";
    echo "<strong>Line:</strong> " . $e->getLine() . "<br>";
    echo "</div>";
}
?>
    </div>
</body>
</html>

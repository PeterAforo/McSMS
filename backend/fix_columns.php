<?php
/**
 * Fix Missing Columns
 * Run this to add the missing columns
 */

set_time_limit(300);
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Fix Missing Columns</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .success { color: #28a745; background: #d4edda; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .error { color: #dc3545; background: #f8d7da; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .info { color: #0c5460; background: #d1ecf1; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Fix Missing Columns</h1>
        
<?php
if (!isset($_POST['confirm'])) {
    ?>
    <div class="info">This will add all missing columns to complete the migration.</div>
    <form method="POST">
        <input type="hidden" name="confirm" value="1">
        <button type="submit" class="button">✅ Fix Columns</button>
    </form>
    <?php
    exit;
}

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "<div class='info'><strong>✅ Connected</strong></div>";
    
    $fixFile = __DIR__ . '/../database/migrations/fix_missing_columns.sql';
    $sql = file_get_contents($fixFile);
    
    // Split by semicolon but handle DELIMITER
    $sql = str_replace('DELIMITER //', '-- DELIMITER', $sql);
    $sql = str_replace('DELIMITER ;', '-- DELIMITER', $sql);
    
    // Split into statements
    $statements = explode(';', $sql);
    $statements = array_filter(array_map('trim', $statements), function($stmt) {
        return !empty($stmt) && !preg_match('/^--/', $stmt);
    });
    
    $successCount = 0;
    $errorCount = 0;
    
    // Handle trigger separately
    $triggerSQL = '';
    $inTrigger = false;
    $regularStatements = [];
    
    foreach ($statements as $stmt) {
        if (stripos($stmt, 'CREATE TRIGGER') !== false) {
            $inTrigger = true;
            $triggerSQL = $stmt;
        } elseif ($inTrigger && stripos($stmt, 'END') !== false) {
            $triggerSQL .= '; ' . $stmt;
            $inTrigger = false;
            // Execute trigger
            try {
                $pdo->exec($triggerSQL);
                echo "<div class='success'>✅ Trigger created</div>";
                $successCount++;
            } catch (PDOException $e) {
                echo "<div class='error'>❌ Trigger error: " . $e->getMessage() . "</div>";
                $errorCount++;
            }
            $triggerSQL = '';
        } elseif ($inTrigger) {
            $triggerSQL .= '; ' . $stmt;
        } else {
            $regularStatements[] = $stmt;
        }
    }
    
    // Execute regular statements
    foreach ($regularStatements as $statement) {
        try {
            if (stripos(trim($statement), 'SELECT') === 0) {
                $result = $pdo->query($statement);
                if ($result) {
                    $data = $result->fetchAll();
                    $result->closeCursor();
                    if (!empty($data)) {
                        echo "<div class='success'>" . htmlspecialchars($data[0][0] ?? '') . "</div>";
                    }
                }
            } else {
                $pdo->exec($statement);
                if (stripos($statement, 'ALTER TABLE') !== false) {
                    echo "<div class='success'>✅ Column added</div>";
                }
            }
            $successCount++;
        } catch (PDOException $e) {
            $msg = $e->getMessage();
            if (stripos($msg, 'Duplicate') !== false || stripos($msg, 'already exists') !== false) {
                // Skip duplicate errors
            } else {
                echo "<div class='error'>❌ " . htmlspecialchars($msg) . "</div>";
                $errorCount++;
            }
        }
    }
    
    echo "<hr>";
    echo "<div class='success'><h2>✅ Fix Complete!</h2></div>";
    echo "<div class='info'>Success: $successCount | Errors: $errorCount</div>";
    
    // Verify
    $stmt = $pdo->query("DESCRIBE employees");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $stmt->closeCursor();
    echo "<div class='info'><strong>Employees table now has:</strong> " . count($columns) . " columns</div>";
    
    echo "<div class='success'>";
    echo "<h3>🎉 Next: <a href='test_hr_migration.php'>Run Tests</a></h3>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='error'><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</div>";
}
?>
    </div>
</body>
</html>

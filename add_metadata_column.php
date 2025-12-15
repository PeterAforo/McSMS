<?php
/**
 * Add metadata column to invoice_items table
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Adding metadata column to invoice_items</h2>";
    
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM invoice_items LIKE 'metadata'");
    
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: orange;'>⚠ metadata column already exists</p>";
    } else {
        // Add metadata column
        $pdo->exec("ALTER TABLE invoice_items ADD metadata JSON NULL AFTER amount");
        echo "<p style='color: green;'>✓ metadata column added successfully!</p>";
    }
    
    echo "<h3 style='color: green;'>✓ Complete!</h3>";
    echo "<p><a href='http://localhost/McSMS/public/index.php?c=parent&a=children' style='padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Parent Portal →</a></p>";
    echo "<p style='color: red;'><strong>Note:</strong> Delete this file after running.</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Add Metadata Column</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h2 { color: #3F51B5; }
    </style>
</head>
<body>
</body>
</html>

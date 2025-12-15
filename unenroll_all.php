<?php
/**
 * Unenroll All Students - Reset for Testing
 * This will delete all term enrollments and related draft/pending invoices
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Unenrolling All Students</h2>";
    
    $pdo->beginTransaction();
    
    // Check what exists first
    echo "<h3>Current Status:</h3>";
    $stmt = $pdo->query("SELECT COUNT(*) FROM term_enrollments");
    $enrollCount = $stmt->fetchColumn();
    echo "<p>Term Enrollments: <strong>{$enrollCount}</strong></p>";
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM invoices WHERE workflow_status IN ('draft', 'pending_finance')");
    $draftCount = $stmt->fetchColumn();
    echo "<p>Draft/Pending Invoices: <strong>{$draftCount}</strong></p>";
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM invoices");
    $totalInvoices = $stmt->fetchColumn();
    echo "<p>Total Invoices: <strong>{$totalInvoices}</strong></p>";
    
    echo "<h3>Cleaning Up:</h3>";
    
    // 1. Delete ALL invoice items (not just draft/pending)
    echo "<p>Deleting ALL invoice items...</p>";
    $stmt = $pdo->query("SELECT COUNT(*) FROM invoice_items");
    $count = $stmt->fetchColumn();
    $pdo->exec("DELETE FROM invoice_items");
    echo "<p style='color: green;'>✓ Deleted {$count} invoice items</p>";
    
    // 2. Delete ALL optional services selected
    echo "<p>Deleting ALL optional services selections...</p>";
    $stmt = $pdo->query("SELECT COUNT(*) FROM optional_services_selected");
    $count = $stmt->fetchColumn();
    $pdo->exec("DELETE FROM optional_services_selected");
    echo "<p style='color: green;'>✓ Deleted {$count} optional services selections</p>";
    
    // 3. Delete ALL term enrollments
    echo "<p>Deleting ALL term enrollments...</p>";
    $pdo->exec("DELETE FROM term_enrollments");
    echo "<p style='color: green;'>✓ Deleted {$enrollCount} term enrollments</p>";
    
    // 4. Delete ALL invoices
    echo "<p>Deleting ALL invoices...</p>";
    $pdo->exec("DELETE FROM invoices");
    echo "<p style='color: green;'>✓ Deleted {$totalInvoices} invoices</p>";
    
    // 5. Reset auto-increment
    $pdo->exec("ALTER TABLE invoices AUTO_INCREMENT = 1");
    $pdo->exec("ALTER TABLE term_enrollments AUTO_INCREMENT = 1");
    
    $pdo->commit();
    
    echo "<h3 style='color: green;'>✓ All Students Unenrolled Successfully!</h3>";
    echo "<p><strong>You can now test the enrollment process from scratch.</strong></p>";
    echo "<p><a href='http://localhost/McSMS/public/index.php?c=parent&a=children' style='padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Parent Portal →</a></p>";
    echo "<p style='color: red;'><strong>Note:</strong> Delete this file after running.</p>";
    
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Unenroll All Students</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h2 { color: #3F51B5; }
        h3 { color: #666; margin-top: 20px; }
    </style>
</head>
<body>
</body>
</html>

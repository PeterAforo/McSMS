<?php
/**
 * Create Test Parent Account
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Creating Test Parent Account</h2>";
    
    // Check if parent already exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE email = 'parent@test.com'");
    if ($stmt->fetchColumn() > 0) {
        echo "<p style='color: orange;'>Test parent already exists. Updating password...</p>";
        $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = 'parent@test.com'");
        $stmt->execute([$hashedPassword]);
    } else {
        // Create parent user
        $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, phone, user_type, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute(['Test Parent', 'parent@test.com', $hashedPassword, '1234567890', 'parent', 'active']);
        $userId = $pdo->lastInsertId();
        
        // Create parent profile
        $stmt = $pdo->prepare("INSERT INTO parents (user_id, address, occupation) VALUES (?, ?, ?)");
        $stmt->execute([$userId, '123 Test Street, Test City', 'Software Engineer']);
        
        echo "<p style='color: green;'>✓ Test parent account created!</p>";
    }
    
    echo "<div style='background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
    echo "<h3>Test Parent Login:</h3>";
    echo "<p><strong>Email:</strong> parent@test.com</p>";
    echo "<p><strong>Password:</strong> password</p>";
    echo "<p><a href='http://localhost/McSMS/public/index.php?c=auth&a=login' style='padding: 12px 24px; background: #3F51B5; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>Login as Parent →</a></p>";
    echo "</div>";
    
    echo "<p style='color: red;'><strong>Note:</strong> Delete this file after use.</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>
<!DOCTYPE html>
<html><head><title>Create Test Parent</title></head><body style="font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px;"></body></html>

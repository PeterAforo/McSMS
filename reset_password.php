<?php
/**
 * Standalone Password Reset Script
 * Run this once: http://localhost/McSMS/reset_password.php
 */

// Database credentials
$host = 'localhost';
$dbname = 'school_management_system';
$username = 'root';
$password = '';

try {
    // Connect to database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    // New password
    $newPassword = 'admin123';
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update admin user
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = 'admin@school.com'");
    $result = $stmt->execute([$hashedPassword]);
    
    if ($result) {
        echo "<div style='font-family: Arial; padding: 20px; max-width: 600px; margin: 50px auto; border: 2px solid #4CAF50; border-radius: 10px;'>";
        echo "<h2 style='color: #4CAF50;'>✅ Password Reset Successful!</h2>";
        echo "<p><strong>Email:</strong> admin@school.com</p>";
        echo "<p><strong>New Password:</strong> admin123</p>";
        echo "<hr>";
        echo "<p style='color: #F44336;'><strong>⚠️ IMPORTANT:</strong> Delete this file (reset_password.php) immediately for security!</p>";
        echo "<p>You can now login to the React app with these credentials.</p>";
        echo "</div>";
    } else {
        echo "<p style='color: red;'>Failed to update password.</p>";
    }
    
} catch (PDOException $e) {
    echo "<div style='font-family: Arial; padding: 20px; max-width: 600px; margin: 50px auto; border: 2px solid #F44336; border-radius: 10px;'>";
    echo "<h2 style='color: #F44336;'>❌ Error</h2>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}
?>

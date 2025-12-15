<?php
/**
 * Reset Admin Password Script
 * Run this once to reset the admin password to: admin123
 */

require_once __DIR__ . '/../../config/database.php';

try {
    // Create direct PDO connection
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    // New password
    $newPassword = 'admin123';
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update admin user
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = 'admin@school.com'");
    $stmt->execute([$hashedPassword]);
    
    echo "<h2>Password reset successful!</h2>";
    echo "<p><strong>Email:</strong> admin@school.com</p>";
    echo "<p><strong>Password:</strong> admin123</p>";
    echo "<p style='color: red;'><strong>IMPORTANT:</strong> Delete this file (reset_admin_password.php) for security!</p>";
    
} catch (Exception $e) {
    echo "<h2>Error:</h2>";
    echo "<p>" . $e->getMessage() . "</p>";
}

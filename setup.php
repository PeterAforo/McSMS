<?php
/**
 * Database Setup Script
 * Run this file once to set up the database
 */

// Check PHP version
echo "<h2>System Information</h2>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>Password Hash Algorithm:</strong> " . (defined('PASSWORD_BCRYPT') ? 'PASSWORD_BCRYPT (Available)' : 'Not Available') . "</p>";

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

echo "<h2>Database Setup</h2>";

try {
    // Connect to MySQL (without selecting database)
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color: green;'>✓ Connected to MySQL server</p>";
    
    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p style='color: green;'>✓ Database '$database' created/verified</p>";
    
    // Connect to the database
    $pdo->exec("USE `$database`");
    
    // Read and execute schema file
    $schemaFile = __DIR__ . '/database/schema.sql';
    
    if (!file_exists($schemaFile)) {
        throw new Exception("Schema file not found: $schemaFile");
    }
    
    $sql = file_get_contents($schemaFile);
    
    // Remove USE database statement as we're already connected
    $sql = preg_replace('/USE\s+`?school_management_system`?;/i', '', $sql);
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            $successCount++;
        } catch (PDOException $e) {
            // Ignore "table already exists" errors
            if (strpos($e->getMessage(), 'already exists') === false) {
                echo "<p style='color: orange;'>⚠ Warning: " . htmlspecialchars($e->getMessage()) . "</p>";
                $errorCount++;
            }
        }
    }
    
    echo "<p style='color: green;'>✓ Executed $successCount SQL statements</p>";
    if ($errorCount > 0) {
        echo "<p style='color: orange;'>⚠ $errorCount statements had warnings (likely tables already exist)</p>";
    }
    
    // Create admin user with proper password hash for current PHP version
    echo "<h3>Creating Admin User</h3>";
    
    // Check if admin already exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE email = 'admin@school.com'");
    $adminExists = $stmt->fetchColumn() > 0;
    
    if ($adminExists) {
        echo "<p style='color: orange;'>⚠ Admin user already exists. Updating password...</p>";
        
        // Update admin password
        $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = 'admin@school.com'");
        $stmt->execute([$hashedPassword]);
        
        echo "<p style='color: green;'>✓ Admin password updated</p>";
    } else {
        echo "<p style='color: blue;'>Creating new admin user...</p>";
        
        $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, user_type, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['System Administrator', 'admin@school.com', $hashedPassword, 'admin', 'active']);
        
        echo "<p style='color: green;'>✓ Admin user created</p>";
    }
    
    // Verify the password hash
    $stmt = $pdo->query("SELECT password FROM users WHERE email = 'admin@school.com'");
    $storedHash = $stmt->fetchColumn();
    
    echo "<p><strong>Stored Password Hash:</strong> " . substr($storedHash, 0, 50) . "...</p>";
    echo "<p><strong>Hash Length:</strong> " . strlen($storedHash) . " characters</p>";
    
    // Test password verification
    if (password_verify('password', $storedHash)) {
        echo "<p style='color: green;'>✓ Password verification test PASSED</p>";
    } else {
        echo "<p style='color: red;'>✗ Password verification test FAILED</p>";
    }
    
    echo "<h2>Setup Complete!</h2>";
    echo "<div style='background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
    echo "<h3>Login Credentials:</h3>";
    echo "<p><strong>URL:</strong> <a href='http://localhost/McSMS/public/'>http://localhost/McSMS/public/</a></p>";
    echo "<p><strong>Email:</strong> admin@school.com</p>";
    echo "<p><strong>Password:</strong> password</p>";
    echo "</div>";
    
    echo "<p style='color: red;'><strong>IMPORTANT:</strong> Delete this setup.php file after successful setup for security reasons.</p>";
    
    // Show all users for debugging
    echo "<h3>All Users in Database:</h3>";
    $stmt = $pdo->query("SELECT id, name, email, user_type, status FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($users) > 0) {
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Type</th><th>Status</th></tr>";
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($user['id']) . "</td>";
            echo "<td>" . htmlspecialchars($user['name']) . "</td>";
            echo "<td>" . htmlspecialchars($user['email']) . "</td>";
            echo "<td>" . htmlspecialchars($user['user_type']) . "</td>";
            echo "<td>" . htmlspecialchars($user['status']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No users found in database.</p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Database Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Please check your database configuration in config/database.php</p>";
} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}

?>

<!DOCTYPE html>
<html>
<head>
    <title>Database Setup - School Management System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h2 {
            color: #3F51B5;
            border-bottom: 2px solid #3F51B5;
            padding-bottom: 10px;
        }
        h3 {
            color: #607D8B;
        }
        table {
            width: 100%;
            background: white;
            margin: 20px 0;
        }
        th {
            background: #3F51B5;
            color: white;
            padding: 10px;
        }
        td {
            padding: 8px;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
    </style>
</head>
<body>
</body>
</html>

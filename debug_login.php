<?php
/**
 * Login Debug Script
 * This will help diagnose login issues
 */

// Database configuration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

echo "<h2>Login Debug Information</h2>";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color: green;'>✓ Connected to database</p>";
    
    // Get admin user
    $stmt = $pdo->query("SELECT * FROM users WHERE email = 'admin@school.com'");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "<h3>Admin User Found:</h3>";
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
        echo "<tr><th>Field</th><th>Value</th></tr>";
        echo "<tr><td>ID</td><td>" . htmlspecialchars($user['id']) . "</td></tr>";
        echo "<tr><td>Name</td><td>" . htmlspecialchars($user['name']) . "</td></tr>";
        echo "<tr><td>Email</td><td>" . htmlspecialchars($user['email']) . "</td></tr>";
        echo "<tr><td>User Type</td><td>" . htmlspecialchars($user['user_type']) . "</td></tr>";
        echo "<tr><td>Status</td><td>" . htmlspecialchars($user['status']) . "</td></tr>";
        echo "<tr><td>Password Hash</td><td>" . substr($user['password'], 0, 60) . "...</td></tr>";
        echo "<tr><td>Hash Length</td><td>" . strlen($user['password']) . " characters</td></tr>";
        echo "</table>";
        
        // Test password verification
        echo "<h3>Password Verification Test:</h3>";
        $testPassword = 'password';
        
        echo "<p><strong>Test Password:</strong> '$testPassword'</p>";
        echo "<p><strong>Stored Hash:</strong> " . substr($user['password'], 0, 60) . "...</p>";
        
        if (password_verify($testPassword, $user['password'])) {
            echo "<p style='color: green; font-size: 18px; font-weight: bold;'>✓ PASSWORD VERIFICATION SUCCESSFUL!</p>";
            echo "<p>The password 'password' matches the stored hash. Login should work.</p>";
        } else {
            echo "<p style='color: red; font-size: 18px; font-weight: bold;'>✗ PASSWORD VERIFICATION FAILED!</p>";
            echo "<p>The password 'password' does NOT match the stored hash.</p>";
            
            // Try to fix it
            echo "<h3>Attempting to Fix Password:</h3>";
            $newHash = password_hash($testPassword, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = 'admin@school.com'");
            $stmt->execute([$newHash]);
            
            echo "<p style='color: green;'>✓ Password has been reset. Please try logging in again.</p>";
            echo "<p><strong>New Hash:</strong> " . substr($newHash, 0, 60) . "...</p>";
            
            // Verify the new hash
            if (password_verify($testPassword, $newHash)) {
                echo "<p style='color: green;'>✓ New password hash verified successfully!</p>";
            }
        }
        
    } else {
        echo "<p style='color: red;'>✗ Admin user not found in database!</p>";
        echo "<p>Creating admin user now...</p>";
        
        $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, user_type, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['System Administrator', 'admin@school.com', $hashedPassword, 'admin', 'active']);
        
        echo "<p style='color: green;'>✓ Admin user created successfully!</p>";
    }
    
    // Show all users
    echo "<h3>All Users in Database:</h3>";
    $stmt = $pdo->query("SELECT id, name, email, user_type, status, LENGTH(password) as pwd_length FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($users) > 0) {
        echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Type</th><th>Status</th><th>Password Length</th></tr>";
        foreach ($users as $u) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($u['id']) . "</td>";
            echo "<td>" . htmlspecialchars($u['name']) . "</td>";
            echo "<td>" . htmlspecialchars($u['email']) . "</td>";
            echo "<td>" . htmlspecialchars($u['user_type']) . "</td>";
            echo "<td>" . htmlspecialchars($u['status']) . "</td>";
            echo "<td>" . htmlspecialchars($u['pwd_length']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // Test form submission
    echo "<h3>Test Login Form:</h3>";
    echo "<form method='POST' action='debug_login.php' style='background: #f5f5f5; padding: 20px; border-radius: 8px;'>";
    echo "<p><label>Email: <input type='email' name='test_email' value='admin@school.com' style='padding: 8px; width: 300px;'></label></p>";
    echo "<p><label>Password: <input type='password' name='test_password' value='password' style='padding: 8px; width: 300px;'></label></p>";
    echo "<p><button type='submit' name='test_login' style='padding: 10px 20px; background: #3F51B5; color: white; border: none; border-radius: 4px; cursor: pointer;'>Test Login</button></p>";
    echo "</form>";
    
    // Process test login
    if (isset($_POST['test_login'])) {
        echo "<h3>Test Login Result:</h3>";
        $testEmail = $_POST['test_email'] ?? '';
        $testPass = $_POST['test_password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$testEmail]);
        $testUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($testUser) {
            echo "<p>✓ User found: " . htmlspecialchars($testUser['name']) . "</p>";
            
            if (password_verify($testPass, $testUser['password'])) {
                echo "<p style='color: green; font-weight: bold;'>✓ PASSWORD CORRECT! Login should work.</p>";
                echo "<p><a href='http://localhost/McSMS/public/index.php?c=auth&a=login' style='padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Login Page</a></p>";
            } else {
                echo "<p style='color: red; font-weight: bold;'>✗ PASSWORD INCORRECT!</p>";
            }
        } else {
            echo "<p style='color: red;'>✗ User not found with email: " . htmlspecialchars($testEmail) . "</p>";
        }
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Database Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}

?>

<!DOCTYPE html>
<html>
<head>
    <title>Login Debug - School Management System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
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
            margin-top: 30px;
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

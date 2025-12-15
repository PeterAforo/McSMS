<?php
/**
 * Database Fix Script
 * This will properly create all tables
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

echo "<h2>Database Fix Script</h2>";

try {
    // Connect to MySQL
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color: green;'>✓ Connected to MySQL</p>";
    
    // Drop and recreate database
    echo "<p>Dropping existing database (if exists)...</p>";
    $pdo->exec("DROP DATABASE IF EXISTS `$database`");
    echo "<p style='color: green;'>✓ Old database dropped</p>";
    
    echo "<p>Creating fresh database...</p>";
    $pdo->exec("CREATE DATABASE `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p style='color: green;'>✓ Database created</p>";
    
    // Use the database
    $pdo->exec("USE `$database`");
    
    // Create users table first
    echo "<p>Creating users table...</p>";
    $pdo->exec("
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            user_type ENUM('admin','parent','teacher','finance','admissions') NOT NULL,
            status ENUM('active','inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_user_type (user_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Users table created</p>";
    
    // Create roles table
    echo "<p>Creating roles table...</p>";
    $pdo->exec("
        CREATE TABLE roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_name VARCHAR(50) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Roles table created</p>";
    
    // Create user_roles table
    $pdo->exec("
        CREATE TABLE user_roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            role_id INT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ User_roles table created</p>";
    
    // Create parents table
    $pdo->exec("
        CREATE TABLE parents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            address TEXT,
            occupation VARCHAR(150),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Parents table created</p>";
    
    // Create children table
    $pdo->exec("
        CREATE TABLE children (
            id INT AUTO_INCREMENT PRIMARY KEY,
            parent_id INT NOT NULL,
            full_name VARCHAR(150) NOT NULL,
            gender ENUM('male','female') NOT NULL,
            date_of_birth DATE NOT NULL,
            previous_school VARCHAR(150),
            photo VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
            INDEX idx_parent (parent_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Children table created</p>";
    
    // Create classes table
    $pdo->exec("
        CREATE TABLE classes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_name VARCHAR(50) NOT NULL,
            level ENUM('creche','nursery','kg','grade') NOT NULL,
            INDEX idx_level (level)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Classes table created</p>";
    
    // Create sections table
    $pdo->exec("
        CREATE TABLE sections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            section_name VARCHAR(50) NOT NULL,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Sections table created</p>";
    
    // Create admissions table
    $pdo->exec("
        CREATE TABLE admissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            child_id INT NOT NULL,
            preferred_class_id INT NOT NULL,
            status ENUM('pending','approved','rejected') DEFAULT 'pending',
            remarks TEXT,
            documents JSON,
            processed_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
            FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_status (status),
            INDEX idx_child (child_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Admissions table created</p>";
    
    // Create students table
    $pdo->exec("
        CREATE TABLE students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            child_id INT NOT NULL,
            student_id VARCHAR(50) NOT NULL UNIQUE,
            class_id INT NOT NULL,
            section_id INT NOT NULL,
            enrollment_date DATE NOT NULL,
            status ENUM('active','graduated','left') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
            INDEX idx_student_id (student_id),
            INDEX idx_class (class_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Students table created</p>";
    
    // Create academic_sessions table
    $pdo->exec("
        CREATE TABLE academic_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_name VARCHAR(20) NOT NULL,
            is_active TINYINT(1) DEFAULT 0,
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Academic_sessions table created</p>";
    
    // Create academic_terms table
    $pdo->exec("
        CREATE TABLE academic_terms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            session_id INT NOT NULL,
            term_name VARCHAR(20) NOT NULL,
            start_date DATE,
            end_date DATE,
            is_active TINYINT(1) DEFAULT 0,
            FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE,
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Academic_terms table created</p>";
    
    // Create subjects table
    $pdo->exec("
        CREATE TABLE subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            subject_name VARCHAR(150) NOT NULL,
            level ENUM('creche','nursery','kg','grade') NOT NULL,
            INDEX idx_level (level)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Subjects table created</p>";
    
    // Create notifications table
    $pdo->exec("
        CREATE TABLE notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255),
            message TEXT,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_read (user_id, is_read)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Notifications table created</p>";
    
    // Create settings table
    $pdo->exec("
        CREATE TABLE settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            key_name VARCHAR(100) NOT NULL UNIQUE,
            value TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ Settings table created</p>";
    
    echo "<h3>Inserting Seed Data...</h3>";
    
    // Insert roles
    $pdo->exec("INSERT INTO roles (role_name) VALUES ('Super Admin'), ('Admin'), ('Teacher'), ('Parent'), ('Finance Staff'), ('Admissions Officer')");
    echo "<p style='color: green;'>✓ Roles inserted</p>";
    
    // Insert academic session
    $pdo->exec("INSERT INTO academic_sessions (session_name, is_active) VALUES ('2024/2025', 1)");
    echo "<p style='color: green;'>✓ Academic session inserted</p>";
    
    // Insert terms
    $pdo->exec("INSERT INTO academic_terms (session_id, term_name, start_date, end_date, is_active) VALUES (1, 'First Term', '2024-09-01', '2024-12-15', 1)");
    echo "<p style='color: green;'>✓ Academic terms inserted</p>";
    
    // Insert classes
    $pdo->exec("INSERT INTO classes (class_name, level) VALUES ('Creche', 'creche'), ('Nursery 1', 'nursery'), ('KG 1', 'kg'), ('Grade 1', 'grade')");
    echo "<p style='color: green;'>✓ Classes inserted</p>";
    
    // Insert sections
    $pdo->exec("INSERT INTO sections (class_id, section_name) VALUES (1, 'Section A'), (2, 'Section A'), (3, 'Section A'), (4, 'Section A')");
    echo "<p style='color: green;'>✓ Sections inserted</p>";
    
    // Insert subjects
    $pdo->exec("INSERT INTO subjects (subject_name, level) VALUES ('English Language', 'grade'), ('Mathematics', 'grade'), ('Science', 'grade')");
    echo "<p style='color: green;'>✓ Subjects inserted</p>";
    
    // Insert settings
    $pdo->exec("INSERT INTO settings (key_name, value) VALUES ('school_name', 'School Management System'), ('currency_symbol', '$')");
    echo "<p style='color: green;'>✓ Settings inserted</p>";
    
    // Create admin user
    echo "<h3>Creating Admin User...</h3>";
    $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, user_type, status) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute(['System Administrator', 'admin@school.com', $hashedPassword, 'admin', 'active']);
    echo "<p style='color: green;'>✓ Admin user created</p>";
    
    // Verify password
    $stmt = $pdo->query("SELECT * FROM users WHERE email = 'admin@school.com'");
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (password_verify('password', $user['password'])) {
        echo "<p style='color: green; font-size: 18px; font-weight: bold;'>✓ PASSWORD VERIFICATION SUCCESSFUL!</p>";
    } else {
        echo "<p style='color: red;'>✗ Password verification failed</p>";
    }
    
    echo "<h2 style='color: green;'>✓ Database Setup Complete!</h2>";
    echo "<div style='background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
    echo "<h3>Login Credentials:</h3>";
    echo "<p><strong>URL:</strong> <a href='http://localhost/McSMS/public/' target='_blank'>http://localhost/McSMS/public/</a></p>";
    echo "<p><strong>Email:</strong> admin@school.com</p>";
    echo "<p><strong>Password:</strong> password</p>";
    echo "<p style='margin-top: 20px;'><a href='http://localhost/McSMS/public/index.php?c=auth&a=login' style='padding: 12px 24px; background: #3F51B5; color: white; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;'>Go to Login Page →</a></p>";
    echo "</div>";
    
    echo "<p style='color: red;'><strong>IMPORTANT:</strong> Delete fix_database.php and debug_login.php after successful login.</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Database Fix - School Management System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h2 { color: #3F51B5; border-bottom: 2px solid #3F51B5; padding-bottom: 10px; }
        h3 { color: #607D8B; margin-top: 20px; }
    </style>
</head>
<body>
</body>
</html>

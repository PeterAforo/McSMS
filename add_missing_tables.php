<?php
/**
 * Add Missing Academic Tables
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Adding Missing Academic Tables</h2>";
    
    // Create results table
    echo "<p>Creating results table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            subject_id INT NOT NULL,
            term_id INT NOT NULL,
            ca_score DECIMAL(5,2) DEFAULT 0,
            exam_score DECIMAL(5,2) DEFAULT 0,
            total DECIMAL(5,2) DEFAULT 0,
            grade VARCHAR(5),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (term_id) REFERENCES academic_terms(id) ON DELETE CASCADE,
            UNIQUE KEY unique_result (student_id, subject_id, term_id),
            INDEX idx_student (student_id),
            INDEX idx_term (term_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ results table created</p>";
    
    // Create homework table
    echo "<p>Creating homework table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS homework (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            subject_id INT NOT NULL,
            teacher_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_class (class_id),
            INDEX idx_teacher (teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ homework table created</p>";
    
    // Create homework_submissions table
    echo "<p>Creating homework_submissions table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS homework_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            homework_id INT NOT NULL,
            student_id INT NOT NULL,
            submission_file VARCHAR(255),
            submission_text TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            grade VARCHAR(5),
            feedback TEXT,
            FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            INDEX idx_homework (homework_id),
            INDEX idx_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ homework_submissions table created</p>";
    
    // Create attendance table
    echo "<p>Creating attendance table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            date DATE NOT NULL,
            status ENUM('present','absent','late') DEFAULT 'present',
            marked_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE KEY unique_attendance (student_id, date),
            INDEX idx_student (student_id),
            INDEX idx_date (date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ attendance table created</p>";
    
    // Create notifications table
    echo "<p>Creating notifications table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            type VARCHAR(50),
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user (user_id),
            INDEX idx_read (is_read)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ notifications table created</p>";
    
    // Create messages table
    echo "<p>Creating messages table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender_id INT NOT NULL,
            receiver_id INT NOT NULL,
            subject VARCHAR(255),
            message TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_sender (sender_id),
            INDEX idx_receiver (receiver_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ messages table created</p>";
    
    // Create activity_logs table
    echo "<p>Creating activity_logs table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            action VARCHAR(255) NOT NULL,
            description TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_user (user_id),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ activity_logs table created</p>";
    
    echo "<h3 style='color: green;'>✓ All Missing Tables Created Successfully!</h3>";
    echo "<p><a href='http://localhost/McSMS/public/' style='padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Application →</a></p>";
    echo "<p style='color: red;'><strong>Note:</strong> Delete this file after running.</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Add Missing Tables</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h2 { color: #3F51B5; }
    </style>
</head>
<body>
</body>
</html>

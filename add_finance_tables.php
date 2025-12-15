<?php
/**
 * Add Missing Finance Tables
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Adding Missing Finance Tables</h2>";
    
    // Check and create fee_types table
    echo "<p>Creating fee_types table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS fee_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fee_name VARCHAR(150) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            class_id INT NOT NULL,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ fee_types table created</p>";
    
    // Insert sample fee types
    $pdo->exec("INSERT IGNORE INTO fee_types (id, fee_name, amount, class_id) VALUES
        (1, 'Tuition Fee', 500.00, 1),
        (2, 'Tuition Fee', 600.00, 2),
        (3, 'Tuition Fee', 700.00, 3)
    ");
    
    // Create optional_services table
    echo "<p>Creating optional_services table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS optional_services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            service_name VARCHAR(150) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            description TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ optional_services table created</p>";
    
    // Create invoices table
    echo "<p>Creating invoices table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            term_id INT NOT NULL,
            total_amount DECIMAL(10,2) DEFAULT 0,
            amount_paid DECIMAL(10,2) DEFAULT 0,
            balance DECIMAL(10,2) DEFAULT 0,
            status ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (term_id) REFERENCES academic_terms(id) ON DELETE CASCADE,
            INDEX idx_student (student_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ invoices table created</p>";
    
    // Create invoice_items table
    echo "<p>Creating invoice_items table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_id INT NOT NULL,
            fee_type_id INT NULL,
            optional_service_id INT NULL,
            label VARCHAR(150),
            amount DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
            FOREIGN KEY (fee_type_id) REFERENCES fee_types(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ invoice_items table created</p>";
    
    // Create payments table
    echo "<p>Creating payments table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_id INT NOT NULL,
            student_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_method ENUM('cash','bank','online') NOT NULL,
            reference_no VARCHAR(255),
            received_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_invoice (invoice_id),
            INDEX idx_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ payments table created</p>";
    
    echo "<h3 style='color: green;'>✓ All Finance Tables Created Successfully!</h3>";
    echo "<p><a href='http://localhost/McSMS/public/' style='padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Application →</a></p>";
    echo "<p style='color: red;'><strong>Note:</strong> Delete this file after running.</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Add Finance Tables</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h2 { color: #3F51B5; }
    </style>
</head>
<body>
</body>
</html>

<?php
/**
 * Add Term Enrollment & Installment Plan Tables
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Adding Term Enrollment Tables</h2>";
    
    // 1. Create installment_plans table
    echo "<p>Creating installment_plans table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS installment_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            plan_details JSON NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ installment_plans table created</p>";
    
    // 2. Add columns to invoices table
    echo "<p>Adding workflow columns to invoices table...</p>";
    
    // Check if columns exist before adding
    $stmt = $pdo->query("SHOW COLUMNS FROM invoices LIKE 'installment_plan_id'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE invoices ADD installment_plan_id INT NULL AFTER term_id");
        echo "<p style='color: green;'>✓ Added installment_plan_id column</p>";
    } else {
        echo "<p style='color: orange;'>⚠ installment_plan_id column already exists</p>";
    }
    
    $stmt = $pdo->query("SHOW COLUMNS FROM invoices LIKE 'workflow_status'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE invoices ADD workflow_status ENUM('draft','pending_finance','approved','rejected','closed') DEFAULT 'draft' AFTER status");
        echo "<p style='color: green;'>✓ Added workflow_status column</p>";
    } else {
        echo "<p style='color: orange;'>⚠ workflow_status column already exists</p>";
    }
    
    $stmt = $pdo->query("SHOW COLUMNS FROM invoices LIKE 'parent_notes'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE invoices ADD parent_notes TEXT NULL");
        echo "<p style='color: green;'>✓ Added parent_notes column</p>";
    } else {
        echo "<p style='color: orange;'>⚠ parent_notes column already exists</p>";
    }
    
    $stmt = $pdo->query("SHOW COLUMNS FROM invoices LIKE 'finance_notes'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE invoices ADD finance_notes TEXT NULL");
        echo "<p style='color: green;'>✓ Added finance_notes column</p>";
    } else {
        echo "<p style='color: orange;'>⚠ finance_notes column already exists</p>";
    }
    
    // 3. Create optional_services_selected table
    echo "<p>Creating optional_services_selected table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS optional_services_selected (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_id INT NOT NULL,
            service_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES optional_services(id) ON DELETE CASCADE,
            UNIQUE KEY unique_selection (invoice_id, service_id),
            INDEX idx_invoice (invoice_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ optional_services_selected table created</p>";
    
    // 4. Create term_enrollments table
    echo "<p>Creating term_enrollments table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS term_enrollments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            term_id INT NOT NULL,
            invoice_id INT NULL,
            enrollment_status ENUM('pending','enrolled','cancelled') DEFAULT 'pending',
            enrolled_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (term_id) REFERENCES academic_terms(id) ON DELETE CASCADE,
            FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
            UNIQUE KEY unique_enrollment (student_id, term_id),
            INDEX idx_student (student_id),
            INDEX idx_term (term_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ term_enrollments table created</p>";
    
    // 5. Insert default installment plans
    echo "<p>Inserting default installment plans...</p>";
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM installment_plans");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("
            INSERT INTO installment_plans (name, description, plan_details) VALUES
            ('Full Payment', 'Pay the entire amount upfront', '{\"percentages\": [100], \"intervals\": [\"term_start\"]}'),
            ('Two Installments (50/50)', 'Pay in two equal parts', '{\"percentages\": [50, 50], \"intervals\": [\"term_start\", \"mid_term\"]}'),
            ('Three Installments (50/30/20)', 'Pay in three parts', '{\"percentages\": [50, 30, 20], \"intervals\": [\"term_start\", \"mid_term\", \"end_term\"]}'),
            ('Four Installments (40/30/20/10)', 'Pay in four parts', '{\"percentages\": [40, 30, 20, 10], \"intervals\": [\"term_start\", \"month_1\", \"month_2\", \"month_3\"]}')
        ");
        echo "<p style='color: green;'>✓ Default installment plans inserted</p>";
    } else {
        echo "<p style='color: orange;'>⚠ Installment plans already exist</p>";
    }
    
    echo "<h3 style='color: green;'>✓ All Enrollment Tables Created Successfully!</h3>";
    echo "<p><a href='http://localhost/McSMS/public/' style='padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Application →</a></p>";
    echo "<p style='color: red;'><strong>Note:</strong> Delete this file after running.</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Add Enrollment Tables</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h2 { color: #3F51B5; }
    </style>
</head>
<body>
</body>
</html>

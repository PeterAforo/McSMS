<?php
/**
 * Check and create missing tables
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $results = [];

    // Check if permissions table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'permissions'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("
            CREATE TABLE permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                permission_key VARCHAR(100) NOT NULL UNIQUE,
                permission_name VARCHAR(255) NOT NULL,
                description TEXT,
                module VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
        $results[] = "Created permissions table";
        
        // Insert default permissions
        $pdo->exec("
            INSERT INTO permissions (permission_key, permission_name, module) VALUES
            ('view_dashboard', 'View Dashboard', 'dashboard'),
            ('manage_students', 'Manage Students', 'students'),
            ('view_students', 'View Students', 'students'),
            ('manage_teachers', 'Manage Teachers', 'teachers'),
            ('view_teachers', 'View Teachers', 'teachers'),
            ('manage_classes', 'Manage Classes', 'classes'),
            ('view_classes', 'View Classes', 'classes'),
            ('manage_finance', 'Manage Finance', 'finance'),
            ('view_finance', 'View Finance', 'finance'),
            ('manage_settings', 'Manage Settings', 'settings'),
            ('send_messages', 'Send Messages', 'messages'),
            ('view_reports', 'View Reports', 'reports'),
            ('manage_users', 'Manage Users', 'users'),
            ('system_admin', 'System Administration', 'system')
        ");
        $results[] = "Inserted default permissions";
    } else {
        $results[] = "permissions table exists";
    }

    // Check if roles table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'roles'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("
            CREATE TABLE roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_name VARCHAR(100) NOT NULL,
                role_code VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                category VARCHAR(50) DEFAULT 'custom',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
        $results[] = "Created roles table";
        
        // Insert default roles
        $pdo->exec("
            INSERT INTO roles (role_name, role_code, description, category, status) VALUES
            ('Administrator', 'admin', 'Full system access', 'system', 'active'),
            ('Teacher', 'teacher', 'Teacher access', 'academic', 'active'),
            ('Parent', 'parent', 'Parent portal access', 'portal', 'active'),
            ('Student', 'student', 'Student portal access', 'portal', 'active'),
            ('Accountant', 'accountant', 'Finance management', 'staff', 'active'),
            ('Librarian', 'librarian', 'Library management', 'staff', 'active')
        ");
        $results[] = "Inserted default roles";
    } else {
        $results[] = "roles table exists";
    }

    // Check if role_permissions table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'role_permissions'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("
            CREATE TABLE role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_id INT NOT NULL,
                permission_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_role_permission (role_id, permission_id)
            )
        ");
        $results[] = "Created role_permissions table";
    } else {
        $results[] = "role_permissions table exists";
    }

    // List all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'results' => $results,
        'all_tables' => $tables
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

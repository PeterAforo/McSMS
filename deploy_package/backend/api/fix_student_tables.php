<?php
/**
 * Fix Student Management Tables
 * Creates missing tables required by student_management.php
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

    // Create student_documents table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            document_type VARCHAR(100),
            document_name VARCHAR(255),
            file_path VARCHAR(500),
            file_size INT,
            file_type VARCHAR(100),
            description TEXT,
            uploaded_by INT,
            expiry_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "student_documents table ensured";

    // Create student_timeline table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_timeline (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            event_type VARCHAR(50),
            event_title VARCHAR(255),
            event_description TEXT,
            event_date DATE,
            is_important TINYINT(1) DEFAULT 0,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "student_timeline table ensured";

    // Create student_awards table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_awards (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            award_type VARCHAR(100),
            award_name VARCHAR(255),
            description TEXT,
            award_date DATE,
            academic_year VARCHAR(20),
            term VARCHAR(50),
            certificate_path VARCHAR(500),
            awarded_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "student_awards table ensured";

    // Create student_discipline table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_discipline (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            incident_type VARCHAR(100),
            incident_date DATE,
            description TEXT,
            severity ENUM('minor', 'moderate', 'major') DEFAULT 'minor',
            action_taken TEXT,
            reported_by INT,
            status ENUM('pending', 'resolved', 'escalated') DEFAULT 'pending',
            resolution_date DATE,
            resolution_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "student_discipline table ensured";

    // Create student_notes table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            note_type VARCHAR(50),
            title VARCHAR(255),
            content TEXT,
            is_private TINYINT(1) DEFAULT 0,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "student_notes table ensured";

    // Create student_id_cards table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_id_cards (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            card_number VARCHAR(50),
            issue_date DATE,
            expiry_date DATE,
            barcode VARCHAR(100),
            qr_code VARCHAR(500),
            photo_path VARCHAR(500),
            issued_by INT,
            status ENUM('active', 'expired', 'lost', 'replaced') DEFAULT 'active',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id),
            UNIQUE KEY unique_card (card_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "student_id_cards table ensured";

    // Create student_promotions table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_promotions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            from_class_id INT,
            to_class_id INT,
            from_academic_year VARCHAR(20),
            to_academic_year VARCHAR(20),
            promotion_type ENUM('promotion', 'demotion', 'transfer', 'repeat') DEFAULT 'promotion',
            reason TEXT,
            promoted_by INT,
            promotion_date DATE,
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "student_promotions table ensured";

    // Create student_medical table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_medical (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            record_type VARCHAR(100),
            record_date DATE,
            description TEXT,
            treatment TEXT,
            doctor_name VARCHAR(255),
            hospital VARCHAR(255),
            follow_up_date DATE,
            attachments TEXT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "student_medical table ensured";

    // Create parent_student_links table (for multiple parents per student)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS parent_student_links (
            id INT AUTO_INCREMENT PRIMARY KEY,
            parent_id INT NOT NULL,
            student_id INT NOT NULL,
            relationship VARCHAR(50),
            is_primary TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_link (parent_id, student_id),
            INDEX idx_parent_id (parent_id),
            INDEX idx_student_id (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "parent_student_links table ensured";

    // Create exam_results table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS exam_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            exam_id INT,
            subject_id INT,
            marks_obtained DECIMAL(5,2),
            total_marks DECIMAL(5,2),
            percentage DECIMAL(5,2),
            grade VARCHAR(5),
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $results[] = "exam_results table ensured";

    echo json_encode([
        'success' => true,
        'message' => 'All student management tables created/verified',
        'results' => $results
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

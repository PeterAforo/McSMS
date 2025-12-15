<?php
/**
 * Fix Student Applications Table
 * Adds missing columns for exam and offer functionality
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

    $alterations = [];

    // Check and add missing columns
    $columnsToAdd = [
        'exam_date' => "ALTER TABLE student_applications ADD COLUMN exam_date DATETIME NULL",
        'exam_subjects' => "ALTER TABLE student_applications ADD COLUMN exam_subjects TEXT NULL",
        'exam_instructions' => "ALTER TABLE student_applications ADD COLUMN exam_instructions TEXT NULL",
        'offered_class' => "ALTER TABLE student_applications ADD COLUMN offered_class VARCHAR(100) NULL",
        'offer_reason' => "ALTER TABLE student_applications ADD COLUMN offer_reason TEXT NULL",
        'offer_accepted_date' => "ALTER TABLE student_applications ADD COLUMN offer_accepted_date DATETIME NULL",
        'offer_declined_reason' => "ALTER TABLE student_applications ADD COLUMN offer_declined_reason TEXT NULL"
    ];

    // Get existing columns
    $stmt = $pdo->query("DESCRIBE student_applications");
    $existingColumns = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'Field');

    foreach ($columnsToAdd as $column => $sql) {
        if (!in_array($column, $existingColumns)) {
            try {
                $pdo->exec($sql);
                $alterations[] = "Added column: $column";
            } catch (Exception $e) {
                $alterations[] = "Failed to add $column: " . $e->getMessage();
            }
        } else {
            $alterations[] = "Column already exists: $column";
        }
    }

    // Also ensure notifications table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            type VARCHAR(50) DEFAULT 'info',
            link VARCHAR(255) NULL,
            is_read TINYINT(1) DEFAULT 0,
            read_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_is_read (is_read)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $alterations[] = "Ensured notifications table exists";

    echo json_encode([
        'success' => true,
        'message' => 'Table structure updated',
        'alterations' => $alterations
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

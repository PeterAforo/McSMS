<?php
/**
 * Check Applications Data
 * Shows all applications in the database
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

    // Get all applications
    $stmt = $pdo->query("SELECT id, application_number, parent_id, first_name, last_name, status, application_date FROM student_applications ORDER BY id DESC");
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all users who are parents
    $stmt = $pdo->query("SELECT id, name, email, user_type FROM users WHERE user_type = 'parent'");
    $parentUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'total_applications' => count($applications),
        'applications' => $applications,
        'parent_users' => $parentUsers
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

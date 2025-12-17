<?php
/**
 * Check Photo URLs - Debug script to see current photo URLs in database
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Get all students with photos
    $stmt = $pdo->query("SELECT id, first_name, last_name, profile_picture, photo FROM students WHERE profile_picture IS NOT NULL OR photo IS NOT NULL LIMIT 20");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'students_with_photos' => $students,
        'count' => count($students)
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

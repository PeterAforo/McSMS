<?php
/**
 * Debug Parent-Student Data
 * Shows current state of parents, students, and applications
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

    // Get all parents with user info
    $stmt = $pdo->query("
        SELECT p.id as parent_record_id, p.user_id, u.name, u.email 
        FROM parents p 
        LEFT JOIN users u ON p.user_id = u.id
    ");
    $parents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all students
    $stmt = $pdo->query("SELECT id, student_id, first_name, last_name, parent_id FROM students");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all applications
    $stmt = $pdo->query("SELECT id, parent_id, first_name, last_name, student_id, status FROM student_applications");
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'parents' => $parents,
        'students' => $students,
        'applications' => $applications,
        'instructions' => 'To link a student to a parent, run: UPDATE students SET parent_id = [parent_record_id] WHERE id = [student_id]'
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

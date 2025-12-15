<?php
/**
 * Test Request Exam functionality
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

    // Test data
    $appId = 2; // Use an existing application ID
    $examDate = '2025-12-20 10:00:00';
    $examSubjects = 'Math, English';
    $examInstructions = 'Please arrive 30 minutes early';
    $reviewedBy = 1;

    // Try the update
    $stmt = $pdo->prepare("
        UPDATE student_applications 
        SET status = 'exam_required',
            exam_date = ?,
            exam_subjects = ?,
            exam_instructions = ?,
            reviewed_date = NOW(),
            reviewed_by = ?
        WHERE id = ?
    ");
    $result = $stmt->execute([
        $examDate,
        $examSubjects,
        $examInstructions,
        $reviewedBy,
        $appId
    ]);

    // Check if notification insert works
    $stmt = $pdo->prepare("SELECT parent_id, first_name, last_name FROM student_applications WHERE id = ?");
    $stmt->execute([$appId]);
    $app = $stmt->fetch(PDO::FETCH_ASSOC);

    $notificationResult = false;
    if ($app) {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, created_at)
            VALUES (?, ?, ?, 'entrance_exam', NOW())
        ");
        $notificationResult = $stmt->execute([
            $app['parent_id'],
            'Entrance Exam Required',
            "Test notification for {$app['first_name']} {$app['last_name']}"
        ]);
    }

    echo json_encode([
        'success' => true,
        'update_result' => $result,
        'notification_result' => $notificationResult,
        'app_data' => $app
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}

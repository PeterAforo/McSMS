<?php
/**
 * Debug system_reset preview
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $tables = [
        'students' => 'Student records',
        'teachers' => 'Teacher records',
        'parents' => 'Parent records',
        'classes' => 'Class definitions',
        'sections' => 'Class sections',
        'subjects' => 'Subject definitions',
        'grades' => 'Student grades',
        'attendance' => 'Attendance records',
        'employee_attendance' => 'Employee attendance',
        'exams' => 'Exam definitions',
        'exam_results' => 'Exam results',
        'assignments' => 'Assignments',
        'homework' => 'Homework',
        'invoices' => 'Fee invoices',
        'payments' => 'Payment records',
        'fee_groups' => 'Fee groups',
        'fee_items' => 'Fee items',
        'fee_item_rules' => 'Fee item rules',
        'timetable_entries' => 'Timetable entries',
        'leave_applications' => 'Leave applications',
        'payroll' => 'Payroll records',
        'messages' => 'Messages',
        'notifications' => 'Notifications',
        'activity_logs' => 'Activity logs',
    ];
    
    $preview = [];
    $errors = [];
    
    foreach ($tables as $table => $description) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $result = $stmt->fetch();
            $preview[] = [
                'table' => $table,
                'description' => $description,
                'record_count' => (int)$result['count']
            ];
        } catch (PDOException $e) {
            $errors[] = "$table: " . $e->getMessage();
        }
    }
    
    echo json_encode([
        'success' => true,
        'preview' => $preview,
        'errors' => $errors,
        'total_records' => array_sum(array_column($preview, 'record_count'))
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}

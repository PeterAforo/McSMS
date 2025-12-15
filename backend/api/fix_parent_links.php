<?php
/**
 * Fix Parent-Student Links
 * This script links existing students to their parents based on approved applications
 */

header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $fixed = 0;
    $errors = [];

    // Method 1: Link students via approved applications
    // Note: student_applications.parent_id stores user_id, not parents.id
    $stmt = $pdo->query("
        SELECT sa.id as app_id, sa.parent_id as user_id, sa.student_id, sa.first_name, sa.last_name,
               p.id as parent_record_id
        FROM student_applications sa
        JOIN parents p ON p.user_id = sa.parent_id
        WHERE sa.status = 'approved' AND sa.student_id IS NOT NULL
    ");
    $approvedApps = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($approvedApps as $app) {
        // Check if student exists and doesn't have parent_id set or has wrong parent_id
        $stmt = $pdo->prepare("SELECT id, parent_id FROM students WHERE id = ?");
        $stmt->execute([$app['student_id']]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($student && (empty($student['parent_id']) || $student['parent_id'] != $app['parent_record_id'])) {
            $stmt = $pdo->prepare("UPDATE students SET parent_id = ? WHERE id = ?");
            $stmt->execute([$app['parent_record_id'], $student['id']]);
            $fixed++;
        }
    }
    
    // Method 1b: Also check if application parent_id might be stored incorrectly as parent record id
    $stmt = $pdo->query("
        SELECT sa.id as app_id, sa.parent_id, sa.student_id, sa.first_name, sa.last_name
        FROM student_applications sa
        WHERE sa.status = 'approved' AND sa.student_id IS NOT NULL
    ");
    $approvedApps = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($approvedApps as $app) {
        // Check if parent_id in application is actually a parent record id
        $stmt = $pdo->prepare("SELECT id FROM parents WHERE id = ?");
        $stmt->execute([$app['parent_id']]);
        $parentRecord = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($parentRecord) {
            $stmt = $pdo->prepare("SELECT id, parent_id FROM students WHERE id = ?");
            $stmt->execute([$app['student_id']]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($student && empty($student['parent_id'])) {
                $stmt = $pdo->prepare("UPDATE students SET parent_id = ? WHERE id = ?");
                $stmt->execute([$parentRecord['id'], $student['id']]);
                $fixed++;
            }
        }
    }

    // Method 2: Try to match students by name with applications
    $stmt = $pdo->query("
        SELECT s.id as student_id, s.first_name, s.last_name, s.date_of_birth, s.parent_id
        FROM students s
        WHERE s.parent_id IS NULL
    ");
    $orphanStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($orphanStudents as $student) {
        // Try to find matching application
        $stmt = $pdo->prepare("
            SELECT sa.parent_id as user_id, p.id as parent_record_id
            FROM student_applications sa
            JOIN parents p ON p.user_id = sa.parent_id
            WHERE sa.first_name = ? AND sa.last_name = ? AND sa.date_of_birth = ?
            AND sa.status = 'approved'
            LIMIT 1
        ");
        $stmt->execute([$student['first_name'], $student['last_name'], $student['date_of_birth']]);
        $match = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($match) {
            $stmt = $pdo->prepare("UPDATE students SET parent_id = ? WHERE id = ?");
            $stmt->execute([$match['parent_record_id'], $student['student_id']]);
            $fixed++;
        }
    }

    // Get summary
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM students");
    $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    $stmt = $pdo->query("SELECT COUNT(*) as linked FROM students WHERE parent_id IS NOT NULL");
    $linkedStudents = $stmt->fetch(PDO::FETCH_ASSOC)['linked'];

    $stmt = $pdo->query("SELECT COUNT(*) as unlinked FROM students WHERE parent_id IS NULL");
    $unlinkedStudents = $stmt->fetch(PDO::FETCH_ASSOC)['unlinked'];

    echo json_encode([
        'success' => true,
        'message' => "Fixed $fixed student-parent links",
        'summary' => [
            'total_students' => $totalStudents,
            'linked_to_parent' => $linkedStudents,
            'not_linked' => $unlinkedStudents,
            'fixed_this_run' => $fixed
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

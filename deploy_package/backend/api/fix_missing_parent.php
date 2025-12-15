<?php
/**
 * Fix Missing Parent Record
 * Creates parent record if missing and links student
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

    $fixed = 0;
    $messages = [];

    // Get approved applications with parent_id (user_id)
    $stmt = $pdo->query("
        SELECT sa.id, sa.parent_id as user_id, sa.student_id, sa.first_name, sa.last_name,
               sa.guardian_name, sa.guardian_phone, sa.guardian_email, sa.guardian_address, sa.guardian_occupation
        FROM student_applications sa
        WHERE sa.status = 'approved' AND sa.student_id IS NOT NULL
    ");
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($applications as $app) {
        // Check if parent record exists for this user_id
        $stmt = $pdo->prepare("SELECT id FROM parents WHERE user_id = ?");
        $stmt->execute([$app['user_id']]);
        $parentRecord = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$parentRecord) {
            // Create parent record
            $stmt = $pdo->prepare("
                INSERT INTO parents (user_id, address, occupation, created_at)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([
                $app['user_id'],
                $app['guardian_address'] ?? '',
                $app['guardian_occupation'] ?? ''
            ]);
            $parentRecordId = $pdo->lastInsertId();
            $messages[] = "Created parent record ID $parentRecordId for user_id {$app['user_id']}";
        } else {
            $parentRecordId = $parentRecord['id'];
        }

        // Update student with parent_id
        $stmt = $pdo->prepare("SELECT id, parent_id FROM students WHERE id = ?");
        $stmt->execute([$app['student_id']]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($student && empty($student['parent_id'])) {
            $stmt = $pdo->prepare("UPDATE students SET parent_id = ? WHERE id = ?");
            $stmt->execute([$parentRecordId, $student['id']]);
            $messages[] = "Linked student ID {$student['id']} to parent record ID $parentRecordId";
            $fixed++;
        }
    }

    // Get updated counts
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM students");
    $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    $stmt = $pdo->query("SELECT COUNT(*) as linked FROM students WHERE parent_id IS NOT NULL");
    $linkedStudents = $stmt->fetch(PDO::FETCH_ASSOC)['linked'];

    $stmt = $pdo->query("SELECT COUNT(*) as total FROM parents");
    $totalParents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    echo json_encode([
        'success' => true,
        'message' => "Fixed $fixed student-parent links",
        'actions' => $messages,
        'summary' => [
            'total_students' => $totalStudents,
            'linked_to_parent' => $linkedStudents,
            'total_parents' => $totalParents
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

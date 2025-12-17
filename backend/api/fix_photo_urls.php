<?php
/**
 * Fix Photo URLs - Update localhost URLs to relative paths
 * Run this once to fix existing photo URLs in the database
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $fixes = [];

    // Fix students table - profile_picture and photo columns
    $stmt = $pdo->query("SELECT id, profile_picture, photo FROM students WHERE profile_picture LIKE '%localhost%' OR photo LIKE '%localhost%'");
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($students as $student) {
        $newProfilePicture = $student['profile_picture'];
        $newPhoto = $student['photo'];

        // Extract relative path from localhost URL
        if ($newProfilePicture && strpos($newProfilePicture, 'localhost') !== false) {
            // Pattern: http://localhost/McSMS/public/assets/uploads/uploads/students/...
            // or: http://localhost/McSMS/uploads/students/...
            if (preg_match('/uploads\/students\/[^"\']+/', $newProfilePicture, $matches)) {
                $newProfilePicture = $matches[0];
            }
        }

        if ($newPhoto && strpos($newPhoto, 'localhost') !== false) {
            if (preg_match('/uploads\/students\/[^"\']+/', $newPhoto, $matches)) {
                $newPhoto = $matches[0];
            }
        }

        // Update if changed
        if ($newProfilePicture !== $student['profile_picture'] || $newPhoto !== $student['photo']) {
            $updateStmt = $pdo->prepare("UPDATE students SET profile_picture = ?, photo = ? WHERE id = ?");
            $updateStmt->execute([$newProfilePicture, $newPhoto, $student['id']]);
            $fixes[] = [
                'student_id' => $student['id'],
                'old_profile' => $student['profile_picture'],
                'new_profile' => $newProfilePicture,
                'old_photo' => $student['photo'],
                'new_photo' => $newPhoto
            ];
        }
    }

    // Also fix any double "uploads/uploads" paths
    $stmt = $pdo->query("SELECT id, profile_picture, photo FROM students WHERE profile_picture LIKE '%uploads/uploads%' OR photo LIKE '%uploads/uploads%'");
    $doubleUploads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($doubleUploads as $student) {
        $newProfilePicture = str_replace('uploads/uploads', 'uploads', $student['profile_picture']);
        $newPhoto = str_replace('uploads/uploads', 'uploads', $student['photo']);

        if ($newProfilePicture !== $student['profile_picture'] || $newPhoto !== $student['photo']) {
            $updateStmt = $pdo->prepare("UPDATE students SET profile_picture = ?, photo = ? WHERE id = ?");
            $updateStmt->execute([$newProfilePicture, $newPhoto, $student['id']]);
            $fixes[] = [
                'student_id' => $student['id'],
                'fix_type' => 'double_uploads',
                'old_profile' => $student['profile_picture'],
                'new_profile' => $newProfilePicture
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Photo URLs fixed',
        'fixes_count' => count($fixes),
        'fixes' => $fixes
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

<?php
/**
 * Student Photo Upload API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    // Check if file was uploaded
    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
        ];
        $errorCode = $_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE;
        throw new Exception($errorMessages[$errorCode] ?? 'Unknown upload error');
    }

    $studentId = $_POST['student_id'] ?? null;
    if (!$studentId) {
        throw new Exception('Student ID is required');
    }

    $file = $_FILES['photo'];
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
    }

    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('File size exceeds 5MB limit');
    }

    // Create upload directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../uploads/students/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'student_' . $studentId . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to save uploaded file');
    }

    // Update database
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Get old photo to delete
    $stmt = $pdo->prepare("SELECT profile_picture FROM students WHERE id = ?");
    $stmt->execute([$studentId]);
    $oldPhoto = $stmt->fetchColumn();

    // Delete old photo if exists
    if ($oldPhoto) {
        $oldPath = __DIR__ . '/../../' . $oldPhoto;
        if (file_exists($oldPath)) {
            unlink($oldPath);
        }
    }

    // Update student with new photo path
    $relativePath = 'uploads/students/' . $filename;
    $stmt = $pdo->prepare("UPDATE students SET profile_picture = ?, photo = ? WHERE id = ?");
    $stmt->execute([$relativePath, $relativePath, $studentId]);

    // Also update the ID card photo if exists
    $stmt = $pdo->prepare("UPDATE student_id_cards SET photo_path = ? WHERE student_id = ?");
    $stmt->execute([$relativePath, $studentId]);

    echo json_encode([
        'success' => true,
        'message' => 'Photo uploaded successfully',
        'photo_path' => $relativePath,
        'full_url' => 'http://localhost/McSMS/backend/' . $relativePath
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

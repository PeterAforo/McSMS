<?php
/**
 * Profile Picture Upload API
 * Handles image uploads for users and teachers
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) || strpos($origin, 'eea.mcaforo.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method is allowed');
    }

    // Validate required parameters
    if (!isset($_POST['type']) || !isset($_POST['id'])) {
        throw new Exception('Type and ID are required');
    }

    $type = $_POST['type']; // 'user' or 'teacher'
    $id = $_POST['id'];

    // Validate type
    if (!in_array($type, ['user', 'teacher'])) {
        throw new Exception('Invalid type. Must be "user" or "teacher"');
    }

    // Check if file was uploaded
    if (!isset($_FILES['profile_picture']) || $_FILES['profile_picture']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error occurred');
    }

    $file = $_FILES['profile_picture'];
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $fileType = mime_content_type($file['tmp_name']);
    
    if (!in_array($fileType, $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPG, PNG, GIF, and WEBP images are allowed');
    }

    // Validate file size (max 5MB)
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        throw new Exception('File size too large. Maximum size is 5MB');
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = $type . '_' . $id . '_' . time() . '.' . $extension;
    $uploadDir = __DIR__ . '/../uploads/profiles/';
    $uploadPath = $uploadDir . $filename;

    // Create directory if it doesn't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Connect to database
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Get old profile picture to delete
    $table = $type === 'user' ? 'users' : 'teachers';
    $stmt = $pdo->prepare("SELECT profile_picture FROM $table WHERE id = ?");
    $stmt->execute([$id]);
    $oldPicture = $stmt->fetchColumn();

    // Delete old picture if exists
    if ($oldPicture) {
        // Handle both old format (filename only) and new format (relative path)
        $oldFilename = basename($oldPicture);
        $oldFilePath = __DIR__ . '/../uploads/profiles/' . $oldFilename;
        if (file_exists($oldFilePath)) {
            unlink($oldFilePath);
        }
    }

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        throw new Exception('Failed to move uploaded file');
    }

    // Store relative path in database (for portability)
    $relativePath = '/backend/uploads/profiles/' . $filename;
    
    // Update database with relative path
    $stmt = $pdo->prepare("UPDATE $table SET profile_picture = ? WHERE id = ?");
    $stmt->execute([$relativePath, $id]);

    // Determine base URL dynamically
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $baseUrl = $protocol . '://' . $host;
    
    // For production, use the correct base
    if (strpos($host, 'eea.mcaforo.com') !== false) {
        $baseUrl = 'https://eea.mcaforo.com';
    }
    
    $fileUrl = $baseUrl . $relativePath;
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile picture uploaded successfully',
        'filename' => $filename,
        'path' => $relativePath,
        'url' => $fileUrl
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

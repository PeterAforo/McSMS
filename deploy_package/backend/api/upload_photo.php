<?php
/**
 * Photo Upload API
 * Handles student and application photo uploads
 */

header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    // Check if file was uploaded
    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded or upload error']);
        exit();
    }

    $file = $_FILES['photo'];
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only JPG, PNG, and GIF allowed']);
        exit();
    }
    
    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large. Maximum 5MB allowed']);
        exit();
    }
    
    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../public/uploads/students/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'student_' . uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
        exit();
    }
    
    // Return the file URL
    $fileUrl = '/uploads/students/' . $filename;
    
    echo json_encode([
        'success' => true,
        'message' => 'Photo uploaded successfully',
        'filename' => $filename,
        'url' => $fileUrl
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Upload failed',
        'message' => $e->getMessage()
    ]);
}

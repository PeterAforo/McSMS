<?php
/**
 * Logo Upload API
 * Handle school logo uploads
 */

header('Content-Type: application/json');
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

require_once __DIR__ . '/../../config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    if (!isset($_FILES['logo'])) {
        throw new Exception('No file uploaded');
    }

    $file = $_FILES['logo'];

    // Check for upload errors
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload error: ' . $file['error']);
    }

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPG, PNG, GIF, and SVG are allowed.');
    }

    // Validate file size (max 2MB)
    if ($file['size'] > 2 * 1024 * 1024) {
        throw new Exception('File size exceeds 2MB limit');
    }

    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../public/uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'school-logo-' . time() . '.' . $extension;
    $targetPath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to save uploaded file');
    }

    // Generate URL - use absolute URL for proper display
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $logoUrl = $protocol . '://' . $host . '/McSMS/public/uploads/' . $filename;

    // Update database
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare("
        INSERT INTO system_settings (setting_key, setting_value, setting_type, category) 
        VALUES ('school_logo', ?, 'string', 'general')
        ON DUPLICATE KEY UPDATE setting_value = ?
    ");
    $stmt->execute([$logoUrl, $logoUrl]);

    echo json_encode([
        'success' => true,
        'logo_url' => $logoUrl,
        'message' => 'Logo uploaded successfully'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

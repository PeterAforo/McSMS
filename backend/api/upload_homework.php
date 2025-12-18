<?php
/**
 * Homework File Upload API
 * Handles file uploads for homework submissions
 * Supports: images (jpg, png, gif), PDF, documents
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Try multiple config paths for compatibility
$configPaths = array(
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(dirname(__DIR__)) . '/config/database.php'
);
$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    echo json_encode(array('success' => false, 'error' => 'Database config not found'));
    exit();
}

// Upload directory
$uploadDir = __DIR__ . '/../../uploads/homework/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Allowed file types
$allowedTypes = array(
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    'application/pdf' => 'pdf',
    'application/msword' => 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    'text/plain' => 'txt'
);

// Max file size (10MB)
$maxFileSize = 10 * 1024 * 1024;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(array('success' => false, 'error' => 'Only POST method allowed'));
    exit();
}

// Check if file was uploaded
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = array(
        UPLOAD_ERR_INI_SIZE => 'File exceeds server limit',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds form limit',
        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
    );
    
    $errorCode = isset($_FILES['file']) ? $_FILES['file']['error'] : UPLOAD_ERR_NO_FILE;
    $errorMsg = isset($errorMessages[$errorCode]) ? $errorMessages[$errorCode] : 'Unknown upload error';
    
    echo json_encode(array('success' => false, 'error' => $errorMsg));
    exit();
}

$file = $_FILES['file'];

// Check file size
if ($file['size'] > $maxFileSize) {
    echo json_encode(array('success' => false, 'error' => 'File too large. Maximum size is 10MB'));
    exit();
}

// Check file type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!isset($allowedTypes[$mimeType])) {
    echo json_encode(array(
        'success' => false, 
        'error' => 'Invalid file type. Allowed: JPG, PNG, GIF, PDF, DOC, DOCX, TXT',
        'detected_type' => $mimeType
    ));
    exit();
}

// Get additional data
$homeworkId = isset($_POST['homework_id']) ? $_POST['homework_id'] : null;
$studentId = isset($_POST['student_id']) ? $_POST['student_id'] : null;

// Generate unique filename
$extension = $allowedTypes[$mimeType];
$timestamp = time();
$randomStr = bin2hex(random_bytes(8));
$newFilename = "hw_{$homeworkId}_{$studentId}_{$timestamp}_{$randomStr}.{$extension}";
$targetPath = $uploadDir . $newFilename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode(array('success' => false, 'error' => 'Failed to save file'));
    exit();
}

// Generate URL for the file
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
$fileUrl = $baseUrl . '/uploads/homework/' . $newFilename;

// If homework_id and student_id provided, update the submission
if ($homeworkId && $studentId) {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
        );
        
        // Check if submission exists
        $stmt = $pdo->prepare("SELECT id FROM homework_submissions WHERE homework_id = ? AND student_id = ?");
        $stmt->execute(array($homeworkId, $studentId));
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing submission with attachment
            $stmt = $pdo->prepare("UPDATE homework_submissions SET attachment = ? WHERE id = ?");
            $stmt->execute(array($newFilename, $existing['id']));
        }
        
    } catch (Exception $e) {
        // Log error but don't fail - file was uploaded successfully
        error_log('Database error updating submission: ' . $e->getMessage());
    }
}

echo json_encode(array(
    'success' => true,
    'message' => 'File uploaded successfully',
    'filename' => $newFilename,
    'url' => $fileUrl,
    'size' => $file['size'],
    'type' => $mimeType
));

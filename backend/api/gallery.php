<?php
/**
 * Gallery API
 * Public list endpoint for auth page backgrounds
 * Admin endpoints for upload, assignment and deletion
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$validAssignments = ['login', 'register', 'forgot_password', 'any'];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB
$uploadDir = __DIR__ . '/../../frontend/public/gallery/';
$relativeUrl = '/gallery/';

// Public list endpoint (no auth required)
if ($method === 'GET' && $action === 'list') {
    try {
        $stmt = $pdo->query("SELECT * FROM gallery_images ORDER BY uploaded_at DESC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $images = array_map(function ($row) use ($relativeUrl) {
            return [
                'id' => (int)$row['id'],
                'filename' => $row['filename'],
                'url' => $relativeUrl . $row['filename'],
                'page_assignment' => $row['page_assignment'],
                'uploaded_at' => $row['uploaded_at'],
            ];
        }, $rows);

        echo json_encode(['success' => true, 'images' => $images]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch gallery images']);
        exit();
    }
}

// Admin-only endpoints
require_once __DIR__ . '/../middleware/auth.php';
$user = requireAuth($pdo, ['admin', 'super_admin']);

if ($method === 'POST' && $action === 'upload') {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No file uploaded or upload failed']);
        exit();
    }

    $file = $_FILES['file'];
    $originalName = $file['name'];
    $tmpName = $file['tmp_name'];
    $size = $file['size'];
    $mime = $file['type'];

    if ($size > $maxSize) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File size exceeds 5MB limit']);
        exit();
    }

    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExtensions, true) || !in_array($mime, $allowedMimeTypes, true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid file type. Only jpg, png, gif and webp are allowed']);
        exit();
    }

    $filename = 'gallery_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destination = $uploadDir . $filename;

    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to create upload directory']);
            exit();
        }
    }

    if (!move_uploaded_file($tmpName, $destination)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save uploaded file']);
        exit();
    }

    $pageAssignment = 'any';
    if (!empty($_POST['page_assignment']) && in_array($_POST['page_assignment'], $validAssignments, true)) {
        $pageAssignment = $_POST['page_assignment'];
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO gallery_images (filename, page_assignment) VALUES (?, ?)");
        $stmt->execute([$filename, $pageAssignment]);
        $imageId = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'image' => [
                'id' => (int)$imageId,
                'filename' => $filename,
                'url' => $relativeUrl . $filename,
                'page_assignment' => $pageAssignment,
                'uploaded_at' => date('Y-m-d H:i:s'),
            ]
        ]);
        exit();
    } catch (Exception $e) {
        // Clean up saved file if DB insert failed
        @unlink($destination);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save image record']);
        exit();
    }
}

if ($method === 'POST' && $action === 'assign') {
    $imageId = (int)($_POST['image_id'] ?? 0);
    $pageAssignment = $_POST['page_assignment'] ?? '';

    if (!$imageId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Image ID is required']);
        exit();
    }

    if (!in_array($pageAssignment, $validAssignments, true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid page assignment']);
        exit();
    }

    try {
        $stmt = $pdo->prepare("UPDATE gallery_images SET page_assignment = ? WHERE id = ?");
        $stmt->execute([$pageAssignment, $imageId]);

        echo json_encode(['success' => true]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update image assignment']);
        exit();
    }
}

if ($method === 'POST' && $action === 'delete') {
    $imageId = (int)($_POST['image_id'] ?? 0);

    if (!$imageId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Image ID is required']);
        exit();
    }

    try {
        $stmt = $pdo->prepare("SELECT filename FROM gallery_images WHERE id = ?");
        $stmt->execute([$imageId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Image not found']);
            exit();
        }

        $filePath = $uploadDir . $row['filename'];
        if (is_file($filePath)) {
            @unlink($filePath);
        }

        $stmt = $pdo->prepare("DELETE FROM gallery_images WHERE id = ?");
        $stmt->execute([$imageId]);

        echo json_encode(['success' => true]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete image']);
        exit();
    }
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Invalid action or method']);
exit();

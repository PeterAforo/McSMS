<?php
/**
 * Simple test endpoint for homework submission
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Try multiple config paths (PHP 5.6 compatible)
$configPaths = array(
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(dirname(__DIR__)) . '/config/database.php'
);

$configLoaded = false;
$loadedPath = '';
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        $loadedPath = $path;
        break;
    }
}

if (!$configLoaded) {
    echo json_encode([
        'success' => false, 
        'error' => 'Config not found',
        'tried_paths' => $configPaths
    ]);
    exit();
}

try {
    $pdo = getConnection();
    
    // Test: Get homework_submissions table structure
    $columns = $pdo->query("SHOW COLUMNS FROM homework_submissions")->fetchAll(PDO::FETCH_COLUMN);
    
    // If POST, try to submit
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $homeworkId = $data['homework_id'] ?? null;
        $studentId = $data['student_id'] ?? null;
        $submissionText = $data['submission_text'] ?? '';
        
        if (!$homeworkId || !$studentId) {
            echo json_encode(['success' => false, 'error' => 'Missing homework_id or student_id']);
            exit();
        }
        
        // Simple insert using only columns that definitely exist
        $stmt = $pdo->prepare("
            INSERT INTO homework_submissions (homework_id, student_id, status, submitted_at)
            VALUES (?, ?, 'submitted', NOW())
            ON DUPLICATE KEY UPDATE status = 'submitted', submitted_at = NOW()
        ");
        $stmt->execute([$homeworkId, $studentId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Homework submitted successfully',
            'submission_id' => $pdo->lastInsertId()
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Test endpoint working',
            'config_loaded' => $loadedPath,
            'table_columns' => $columns,
            'method' => $_SERVER['REQUEST_METHOD']
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}

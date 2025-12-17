<?php
header('Content-Type: application/json');

// Step 1: Test config loading
$configPath = __DIR__ . '/../../config/database.php';
if (!file_exists($configPath)) {
    echo json_encode(array('success' => false, 'error' => 'Config not found', 'path' => $configPath));
    exit();
}

require_once $configPath;

// Step 2: Test database connection
try {
    $pdo = getConnection();
    
    // Step 3: Test homework_submissions table
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM homework_submissions");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(array(
        'success' => true, 
        'message' => 'All working',
        'submission_count' => $count['cnt']
    ));
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}

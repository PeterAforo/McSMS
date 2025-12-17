<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Try multiple config paths
$configPaths = [
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php'
];
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        break;
    }
}

$debug = [];

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Check classes table structure
    try {
        $stmt = $pdo->query("DESCRIBE classes");
        $debug['classes_columns'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (PDOException $e) {
        $debug['classes_error'] = $e->getMessage();
    }
    
    // Get all classes
    try {
        $stmt = $pdo->query("SELECT * FROM classes LIMIT 5");
        $debug['classes_sample'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $debug['classes_query_error'] = $e->getMessage();
    }
    
    // Check class_subjects table
    try {
        $stmt = $pdo->query("SELECT * FROM class_subjects LIMIT 5");
        $debug['class_subjects_sample'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $debug['class_subjects_error'] = $e->getMessage();
    }
    
    // Check teacher_subjects table
    try {
        $stmt = $pdo->query("SELECT * FROM teacher_subjects LIMIT 5");
        $debug['teacher_subjects_sample'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $debug['teacher_subjects_error'] = $e->getMessage();
    }

} catch (PDOException $e) {
    $debug['db_error'] = $e->getMessage();
}

echo json_encode($debug, JSON_PRETTY_PRINT);

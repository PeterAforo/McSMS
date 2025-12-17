<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Try multiple config paths for compatibility
$configPaths = [
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(__DIR__, 2) . '/config/database.php'
];
$configLoaded = false;
$configPath = '';
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        $configPath = $path;
        break;
    }
}

if (!$configLoaded) {
    echo json_encode(['error' => 'Config not found', 'tried' => $configPaths]);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $userId = $_GET['user_id'] ?? 2;
    
    // Get user
    $stmt = $pdo->prepare("SELECT id, name, email, phone, user_type FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get students with this parent_id
    $stmt = $pdo->prepare("SELECT id, student_id, first_name, last_name, parent_id FROM students WHERE parent_id = ?");
    $stmt->execute([$userId]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get all students to see parent_id values
    $stmt = $pdo->query("SELECT id, student_id, first_name, last_name, parent_id FROM students LIMIT 10");
    $allStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'config_path' => $configPath,
        'user_id_queried' => $userId,
        'user' => $user,
        'students_with_parent_id' => $students,
        'all_students_sample' => $allStudents
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

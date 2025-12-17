<?php
/**
 * Debug Seating Chart API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Try multiple config paths for compatibility
$configPaths = [
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(__DIR__, 2) . '/config/database.php'
];

$result = [
    'config_paths_tried' => [],
    'config_loaded' => false,
    'db_connected' => false,
    'tables_exist' => [],
    'error' => null
];

foreach ($configPaths as $path) {
    $result['config_paths_tried'][] = [
        'path' => $path,
        'exists' => file_exists($path)
    ];
    if (file_exists($path) && !$result['config_loaded']) {
        require_once $path;
        $result['config_loaded'] = true;
        $result['config_path_used'] = $path;
    }
}

if ($result['config_loaded']) {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        $result['db_connected'] = true;

        // Check if tables exist
        $tables = ['seating_charts', 'seat_assignments', 'classes', 'students', 'teachers'];
        foreach ($tables as $table) {
            try {
                $stmt = $pdo->query("SELECT 1 FROM $table LIMIT 1");
                $result['tables_exist'][$table] = true;
            } catch (PDOException $e) {
                $result['tables_exist'][$table] = false;
            }
        }

        // Try to create seating_charts table
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS seating_charts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    class_id INT NOT NULL,
                    teacher_id INT NOT NULL,
                    name VARCHAR(100) DEFAULT 'Default Layout',
                    layout_type ENUM('grid', 'rows', 'groups', 'u_shape', 'custom') DEFAULT 'grid',
                    rows INT DEFAULT 5,
                    columns INT DEFAULT 6,
                    room_name VARCHAR(100),
                    notes TEXT,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ");
            $result['seating_charts_created'] = true;
        } catch (PDOException $e) {
            $result['seating_charts_error'] = $e->getMessage();
        }

        // Try to create seat_assignments table
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS seat_assignments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    chart_id INT NOT NULL,
                    student_id INT NOT NULL,
                    row_num INT NOT NULL,
                    col_num INT NOT NULL,
                    seat_label VARCHAR(20),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ");
            $result['seat_assignments_created'] = true;
        } catch (PDOException $e) {
            $result['seat_assignments_error'] = $e->getMessage();
        }

        // Test query
        try {
            $stmt = $pdo->prepare("SELECT * FROM seating_charts WHERE class_id = ? LIMIT 1");
            $stmt->execute([1]);
            $result['test_query'] = 'success';
            $result['test_result'] = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $result['test_query_error'] = $e->getMessage();
        }

    } catch (PDOException $e) {
        $result['error'] = $e->getMessage();
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);

<?php
/**
 * Activities API
 * Handles student activities and extracurricular data
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Try multiple config paths for compatibility
$configPaths = [
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(__DIR__, 2) . '/config/database.php'
];
$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}
if (!$configLoaded) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Config file not found']);
    exit();
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $studentId = $_GET['student_id'] ?? null;

    switch ($method) {
        case 'GET':
            getActivities($pdo, $studentId);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function getActivities($pdo, $studentId) {
    // If no student_id provided, return empty
    if (!$studentId) {
        echo json_encode([
            'success' => true,
            'activities' => [],
            'message' => 'Student ID is required'
        ]);
        return;
    }

    // Check if student_activities table exists
    try {
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'student_activities'");
        if ($tableCheck->rowCount() === 0) {
            // Table doesn't exist - return empty result
            echo json_encode([
                'success' => true,
                'activities' => [],
                'message' => 'Activities feature not yet configured'
            ]);
            return;
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => true,
            'activities' => [],
            'message' => 'Activities feature not available'
        ]);
        return;
    }

    // Get student info
    $stmt = $pdo->prepare("SELECT id, first_name, last_name FROM students WHERE id = ?");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode([
            'success' => true,
            'activities' => [],
            'message' => 'Student not found'
        ]);
        return;
    }

    try {
        // Get activities
        $sql = "
            SELECT 
                sa.*,
                a.name as activity_name,
                a.description as activity_description,
                a.category,
                a.schedule
            FROM student_activities sa
            LEFT JOIN activities a ON sa.activity_id = a.id
            WHERE sa.student_id = ?
            ORDER BY sa.created_at DESC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$studentId]);
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'activities' => $activities,
            'student' => $student
        ]);

    } catch (Exception $e) {
        // Return empty on any SQL error
        echo json_encode([
            'success' => true,
            'activities' => [],
            'message' => 'No activities data available'
        ]);
    }
}

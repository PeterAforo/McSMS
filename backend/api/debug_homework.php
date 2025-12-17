<?php
/**
 * Debug Homework Issue
 * This file helps diagnose why homework is not showing for parents
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Load config
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
    die(json_encode(['error' => 'Config not found']));
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $debug = [];

    // 1. Check if homework table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'homework'");
    $debug['homework_table_exists'] = $stmt->rowCount() > 0;

    // 2. Check homework table structure
    if ($debug['homework_table_exists']) {
        $stmt = $pdo->query("DESCRIBE homework");
        $debug['homework_columns'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    // 3. Count all homework records
    if ($debug['homework_table_exists']) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM homework");
        $debug['total_homework_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }

    // 4. Get all homework with class info
    if ($debug['homework_table_exists']) {
        $stmt = $pdo->query("
            SELECT h.id, h.title, h.class_id, h.subject_id, h.due_date, h.status,
                   c.class_name, c.id as class_table_id
            FROM homework h
            LEFT JOIN classes c ON h.class_id = c.id
            ORDER BY h.created_at DESC
            LIMIT 10
        ");
        $debug['recent_homework'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 5. Get all classes
    $stmt = $pdo->query("SELECT id, class_name FROM classes ORDER BY class_name LIMIT 20");
    $debug['all_classes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Get students with their class assignments
    $stmt = $pdo->query("
        SELECT s.id as student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name, 
               s.class_id, s.parent_id, c.class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        ORDER BY s.id
        LIMIT 20
    ");
    $debug['students_with_classes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 7. Check if there's a mismatch - homework exists but no students in that class
    if ($debug['homework_table_exists'] && $debug['total_homework_count'] > 0) {
        $stmt = $pdo->query("
            SELECT h.class_id, c.class_name, 
                   COUNT(DISTINCT h.id) as homework_count,
                   COUNT(DISTINCT s.id) as student_count
            FROM homework h
            LEFT JOIN classes c ON h.class_id = c.id
            LEFT JOIN students s ON s.class_id = h.class_id
            GROUP BY h.class_id
        ");
        $debug['homework_class_student_mapping'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // 8. Get parents and their children
    try {
        $stmt = $pdo->query("
            SELECT p.id as parent_id, p.user_id,
                   s.id as student_id, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.class_id
            FROM parents p
            LEFT JOIN students s ON s.parent_id = p.id
            LIMIT 20
        ");
        $debug['parents_and_children'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $debug['parents_and_children'] = 'Error: ' . $e->getMessage();
    }

    // 9. Check specific student_id if provided
    $studentId = $_GET['student_id'] ?? null;
    if ($studentId) {
        $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $debug['specific_student'] = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($debug['specific_student'] && $debug['specific_student']['class_id']) {
            $stmt = $pdo->prepare("SELECT * FROM homework WHERE class_id = ?");
            $stmt->execute([$debug['specific_student']['class_id']]);
            $debug['homework_for_student_class'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }

    // 10. Check parent_id if provided (this simulates what parent_portal does)
    $parentId = $_GET['parent_id'] ?? null;
    if ($parentId) {
        $debug['input_parent_id'] = $parentId;
        
        // Check if parent_id is user_id or parent table id
        $stmt = $pdo->prepare("SELECT * FROM parents WHERE id = ? OR user_id = ?");
        $stmt->execute([$parentId, $parentId]);
        $debug['parent_record'] = $stmt->fetch(PDO::FETCH_ASSOC);

        // Simulate what parent_portal.php does - convert user_id to parent_id
        $stmt = $pdo->prepare("SELECT id FROM parents WHERE user_id = ?");
        $stmt->execute([$parentId]);
        $parent = $stmt->fetch(PDO::FETCH_ASSOC);
        $actualParentId = $parent ? $parent['id'] : $parentId;
        $debug['converted_parent_id'] = $actualParentId;

        // Get children for this parent using the converted ID
        $stmt = $pdo->prepare("
            SELECT s.*, c.class_name 
            FROM students s 
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE s.parent_id = ?
        ");
        $stmt->execute([$actualParentId]);
        $debug['children_for_parent'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If we found children, check homework for their classes
        if (!empty($debug['children_for_parent'])) {
            $childWithClass = array_filter($debug['children_for_parent'], fn($c) => $c['class_id']);
            if (!empty($childWithClass)) {
                $firstChild = reset($childWithClass);
                $stmt = $pdo->prepare("SELECT * FROM homework WHERE class_id = ?");
                $stmt->execute([$firstChild['class_id']]);
                $debug['homework_for_child_class'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }
    }

    // 11. Test child_details endpoint response (simulates what frontend gets)
    $childId = $_GET['child_id'] ?? null;
    if ($childId) {
        $stmt = $pdo->prepare("
            SELECT s.id, s.id as student_id, s.student_id as admission_no, 
                   CONCAT(s.first_name, ' ', s.last_name) as full_name,
                   s.class_id, cl.class_name
            FROM students s
            LEFT JOIN classes cl ON s.class_id = cl.id
            WHERE s.id = ?
        ");
        $stmt->execute([$childId]);
        $debug['child_details_response'] = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Now test homework fetch with this child's id
        if ($debug['child_details_response']) {
            $numericId = $debug['child_details_response']['id'];
            $classId = $debug['child_details_response']['class_id'];
            $debug['homework_fetch_using_id'] = $numericId;
            $debug['homework_fetch_class_id'] = $classId;
            
            if ($classId) {
                $stmt = $pdo->prepare("SELECT * FROM homework WHERE class_id = ?");
                $stmt->execute([$classId]);
                $debug['homework_result'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        }
    }

    echo json_encode([
        'success' => true,
        'debug' => $debug,
        'instructions' => [
            'To check specific student: Add ?student_id=X to URL',
            'To check specific parent: Add ?parent_id=X to URL',
            'To check child details flow: Add ?child_id=X to URL',
            'Look at homework_class_student_mapping to see if homework classes match student classes'
        ]
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}

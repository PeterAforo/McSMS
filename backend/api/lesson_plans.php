<?php
/**
 * Lesson Plans API
 * CRUD operations for teacher lesson plans
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

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$teacher_id = $_GET['teacher_id'] ?? null;
$class_id = $_GET['class_id'] ?? null;
$subject_id = $_GET['subject_id'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Create table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lesson_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            class_id INT NOT NULL,
            subject_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            objectives TEXT,
            materials TEXT,
            activities TEXT,
            assessment TEXT,
            homework TEXT,
            notes TEXT,
            duration_minutes INT DEFAULT 45,
            lesson_date DATE,
            status ENUM('draft', 'published', 'completed') DEFAULT 'draft',
            shared_with TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_class (class_id),
            INDEX idx_subject (subject_id),
            INDEX idx_date (lesson_date)
        )
    ");

    // Create resources table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lesson_resources (
            id INT AUTO_INCREMENT PRIMARY KEY,
            lesson_plan_id INT NOT NULL,
            resource_type ENUM('link', 'file', 'video', 'document') DEFAULT 'link',
            title VARCHAR(255) NOT NULL,
            url TEXT,
            file_path VARCHAR(500),
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
        )
    ");

    // GET - Retrieve lesson plans
    if ($method === 'GET') {
        if ($id) {
            $stmt = $pdo->prepare("
                SELECT lp.*, c.class_name, s.subject_name,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                FROM lesson_plans lp
                LEFT JOIN classes c ON lp.class_id = c.id
                LEFT JOIN subjects s ON lp.subject_id = s.id
                LEFT JOIN teachers t ON lp.teacher_id = t.id
                WHERE lp.id = ?
            ");
            $stmt->execute([$id]);
            $plan = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($plan) {
                // Get resources
                $resStmt = $pdo->prepare("SELECT * FROM lesson_resources WHERE lesson_plan_id = ?");
                $resStmt->execute([$id]);
                $plan['resources'] = $resStmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'lesson_plan' => $plan]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Lesson plan not found']);
            }
        } else {
            $sql = "
                SELECT lp.*, c.class_name, s.subject_name,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                       (SELECT COUNT(*) FROM lesson_resources WHERE lesson_plan_id = lp.id) as resource_count
                FROM lesson_plans lp
                LEFT JOIN classes c ON lp.class_id = c.id
                LEFT JOIN subjects s ON lp.subject_id = s.id
                LEFT JOIN teachers t ON lp.teacher_id = t.id
                WHERE 1=1
            ";
            $params = [];

            if ($teacher_id) {
                $sql .= " AND lp.teacher_id = ?";
                $params[] = $teacher_id;
            }
            if ($class_id) {
                $sql .= " AND lp.class_id = ?";
                $params[] = $class_id;
            }
            if ($subject_id) {
                $sql .= " AND lp.subject_id = ?";
                $params[] = $subject_id;
            }

            $sql .= " ORDER BY lp.lesson_date DESC, lp.created_at DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'lesson_plans' => $plans]);
        }
    }

    // POST - Create lesson plan
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['teacher_id']) || !isset($data['class_id']) || !isset($data['subject_id']) || !isset($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Teacher ID, Class ID, Subject ID, and Title are required']);
            exit();
        }

        $stmt = $pdo->prepare("
            INSERT INTO lesson_plans (teacher_id, class_id, subject_id, title, description, objectives, 
                                      materials, activities, assessment, homework, notes, duration_minutes, 
                                      lesson_date, status, shared_with)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['teacher_id'],
            $data['class_id'],
            $data['subject_id'],
            $data['title'],
            $data['description'] ?? null,
            $data['objectives'] ?? null,
            $data['materials'] ?? null,
            $data['activities'] ?? null,
            $data['assessment'] ?? null,
            $data['homework'] ?? null,
            $data['notes'] ?? null,
            $data['duration_minutes'] ?? 45,
            $data['lesson_date'] ?? null,
            $data['status'] ?? 'draft',
            isset($data['shared_with']) ? json_encode($data['shared_with']) : null
        ]);

        $planId = $pdo->lastInsertId();

        // Add resources if provided
        if (!empty($data['resources'])) {
            $resStmt = $pdo->prepare("
                INSERT INTO lesson_resources (lesson_plan_id, resource_type, title, url, file_path, description)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            foreach ($data['resources'] as $resource) {
                $resStmt->execute([
                    $planId,
                    $resource['resource_type'] ?? 'link',
                    $resource['title'],
                    $resource['url'] ?? null,
                    $resource['file_path'] ?? null,
                    $resource['description'] ?? null
                ]);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Lesson plan created', 'id' => $planId]);
    }

    // PUT - Update lesson plan
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Lesson plan ID is required']);
            exit();
        }

        $stmt = $pdo->prepare("
            UPDATE lesson_plans SET
                title = COALESCE(?, title),
                description = ?,
                objectives = ?,
                materials = ?,
                activities = ?,
                assessment = ?,
                homework = ?,
                notes = ?,
                duration_minutes = COALESCE(?, duration_minutes),
                lesson_date = ?,
                status = COALESCE(?, status),
                shared_with = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['title'] ?? null,
            $data['description'] ?? null,
            $data['objectives'] ?? null,
            $data['materials'] ?? null,
            $data['activities'] ?? null,
            $data['assessment'] ?? null,
            $data['homework'] ?? null,
            $data['notes'] ?? null,
            $data['duration_minutes'] ?? null,
            $data['lesson_date'] ?? null,
            $data['status'] ?? null,
            isset($data['shared_with']) ? json_encode($data['shared_with']) : null,
            $id
        ]);

        // Update resources if provided
        if (isset($data['resources'])) {
            // Delete existing resources
            $pdo->prepare("DELETE FROM lesson_resources WHERE lesson_plan_id = ?")->execute([$id]);
            
            // Add new resources
            $resStmt = $pdo->prepare("
                INSERT INTO lesson_resources (lesson_plan_id, resource_type, title, url, file_path, description)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            foreach ($data['resources'] as $resource) {
                $resStmt->execute([
                    $id,
                    $resource['resource_type'] ?? 'link',
                    $resource['title'],
                    $resource['url'] ?? null,
                    $resource['file_path'] ?? null,
                    $resource['description'] ?? null
                ]);
            }
        }

        echo json_encode(['success' => true, 'message' => 'Lesson plan updated']);
    }

    // DELETE - Delete lesson plan
    elseif ($method === 'DELETE') {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Lesson plan ID is required']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM lesson_plans WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Lesson plan deleted']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

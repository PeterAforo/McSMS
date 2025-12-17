<?php
/**
 * Behavior Tracking API
 * Track student behaviors, award points/badges
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

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Create behavior records table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS behavior_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            teacher_id INT NOT NULL,
            class_id INT,
            behavior_type ENUM('positive', 'negative', 'neutral') DEFAULT 'positive',
            category VARCHAR(100),
            description TEXT NOT NULL,
            points INT DEFAULT 0,
            incident_date DATE,
            incident_time TIME,
            location VARCHAR(255),
            witnesses TEXT,
            action_taken TEXT,
            parent_notified TINYINT(1) DEFAULT 0,
            follow_up_required TINYINT(1) DEFAULT 0,
            follow_up_date DATE,
            status ENUM('open', 'resolved', 'escalated') DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student (student_id),
            INDEX idx_teacher (teacher_id),
            INDEX idx_date (incident_date)
        )
    ");

    // Create badges table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_badges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            badge_name VARCHAR(100) NOT NULL,
            badge_icon VARCHAR(50),
            badge_color VARCHAR(20),
            description TEXT,
            awarded_by INT,
            awarded_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student (student_id)
        )
    ");

    // Create behavior categories table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS behavior_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            type ENUM('positive', 'negative') DEFAULT 'positive',
            default_points INT DEFAULT 0,
            description TEXT,
            is_active TINYINT(1) DEFAULT 1
        )
    ");

    // Insert default categories if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM behavior_categories");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("
            INSERT INTO behavior_categories (name, type, default_points, description) VALUES
            ('Excellent Participation', 'positive', 5, 'Active participation in class'),
            ('Helping Others', 'positive', 5, 'Helping classmates'),
            ('Outstanding Work', 'positive', 10, 'Exceptional quality work'),
            ('Good Behavior', 'positive', 3, 'Following rules and being respectful'),
            ('Leadership', 'positive', 10, 'Showing leadership qualities'),
            ('Improvement', 'positive', 5, 'Showing significant improvement'),
            ('Disruption', 'negative', -5, 'Disrupting class'),
            ('Late to Class', 'negative', -2, 'Arriving late'),
            ('Missing Homework', 'negative', -3, 'Not submitting homework'),
            ('Disrespect', 'negative', -5, 'Disrespectful behavior'),
            ('Fighting', 'negative', -10, 'Physical altercation')
        ");
    }

    // GET
    if ($method === 'GET') {
        $resource = $_GET['resource'] ?? 'records';
        $student_id = $_GET['student_id'] ?? null;
        $teacher_id = $_GET['teacher_id'] ?? null;
        $class_id = $_GET['class_id'] ?? null;

        if ($resource === 'records') {
            $sql = "
                SELECT br.*, 
                       CONCAT(s.first_name, ' ', s.last_name) as student_name,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                       c.class_name
                FROM behavior_records br
                LEFT JOIN students s ON br.student_id = s.id
                LEFT JOIN teachers t ON br.teacher_id = t.id
                LEFT JOIN classes c ON br.class_id = c.id
                WHERE 1=1
            ";
            $params = [];

            if ($student_id) {
                $sql .= " AND br.student_id = ?";
                $params[] = $student_id;
            }
            if ($teacher_id) {
                $sql .= " AND br.teacher_id = ?";
                $params[] = $teacher_id;
            }
            if ($class_id) {
                $sql .= " AND br.class_id = ?";
                $params[] = $class_id;
            }

            $sql .= " ORDER BY br.incident_date DESC, br.created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'records' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        elseif ($resource === 'categories') {
            $stmt = $pdo->query("SELECT * FROM behavior_categories WHERE is_active = 1 ORDER BY type, name");
            echo json_encode(['success' => true, 'categories' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        elseif ($resource === 'badges') {
            $sql = "
                SELECT sb.*, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                       CONCAT(t.first_name, ' ', t.last_name) as awarded_by_name
                FROM student_badges sb
                LEFT JOIN students s ON sb.student_id = s.id
                LEFT JOIN teachers t ON sb.awarded_by = t.id
                WHERE 1=1
            ";
            $params = [];

            if ($student_id) {
                $sql .= " AND sb.student_id = ?";
                $params[] = $student_id;
            }

            $sql .= " ORDER BY sb.awarded_date DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'badges' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        elseif ($resource === 'summary' && $student_id) {
            // Get behavior summary for a student
            $response = ['success' => true];

            // Total points
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(points), 0) as total_points FROM behavior_records WHERE student_id = ?");
            $stmt->execute([$student_id]);
            $response['total_points'] = $stmt->fetchColumn();

            // Positive vs negative counts
            $stmt = $pdo->prepare("
                SELECT behavior_type, COUNT(*) as count, SUM(points) as points
                FROM behavior_records WHERE student_id = ?
                GROUP BY behavior_type
            ");
            $stmt->execute([$student_id]);
            $response['by_type'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Badge count
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM student_badges WHERE student_id = ?");
            $stmt->execute([$student_id]);
            $response['badge_count'] = $stmt->fetchColumn();

            // Recent records
            $stmt = $pdo->prepare("
                SELECT br.*, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                FROM behavior_records br
                LEFT JOIN teachers t ON br.teacher_id = t.id
                WHERE br.student_id = ?
                ORDER BY br.incident_date DESC, br.created_at DESC
                LIMIT 10
            ");
            $stmt->execute([$student_id]);
            $response['recent_records'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Badges
            $stmt = $pdo->prepare("SELECT * FROM student_badges WHERE student_id = ? ORDER BY awarded_date DESC");
            $stmt->execute([$student_id]);
            $response['badges'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($response);
        }
        elseif ($resource === 'leaderboard' && $class_id) {
            $stmt = $pdo->prepare("
                SELECT s.id, s.first_name, s.last_name,
                       COALESCE(SUM(br.points), 0) as total_points,
                       (SELECT COUNT(*) FROM student_badges WHERE student_id = s.id) as badge_count
                FROM students s
                LEFT JOIN behavior_records br ON s.id = br.student_id
                WHERE s.class_id = ? AND s.status = 'active'
                GROUP BY s.id
                ORDER BY total_points DESC
                LIMIT 20
            ");
            $stmt->execute([$class_id]);

            echo json_encode(['success' => true, 'leaderboard' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    }

    // POST
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $resource = $data['resource'] ?? 'record';

        if ($resource === 'record') {
            if (!isset($data['student_id']) || !isset($data['teacher_id']) || !isset($data['description'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Student ID, Teacher ID, and Description are required']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO behavior_records (student_id, teacher_id, class_id, behavior_type, category,
                    description, points, incident_date, incident_time, location, witnesses, 
                    action_taken, parent_notified, follow_up_required, follow_up_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['student_id'],
                $data['teacher_id'],
                $data['class_id'] ?? null,
                $data['behavior_type'] ?? 'positive',
                $data['category'] ?? null,
                $data['description'],
                $data['points'] ?? 0,
                $data['incident_date'] ?? date('Y-m-d'),
                $data['incident_time'] ?? null,
                $data['location'] ?? null,
                $data['witnesses'] ?? null,
                $data['action_taken'] ?? null,
                $data['parent_notified'] ?? 0,
                $data['follow_up_required'] ?? 0,
                $data['follow_up_date'] ?? null,
                $data['status'] ?? 'open'
            ]);

            echo json_encode(['success' => true, 'message' => 'Behavior record created', 'id' => $pdo->lastInsertId()]);
        }
        elseif ($resource === 'badge') {
            if (!isset($data['student_id']) || !isset($data['badge_name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Student ID and Badge Name are required']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO student_badges (student_id, badge_name, badge_icon, badge_color, description, awarded_by, awarded_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['student_id'],
                $data['badge_name'],
                $data['badge_icon'] ?? 'star',
                $data['badge_color'] ?? 'gold',
                $data['description'] ?? null,
                $data['awarded_by'] ?? null,
                $data['awarded_date'] ?? date('Y-m-d')
            ]);

            echo json_encode(['success' => true, 'message' => 'Badge awarded', 'id' => $pdo->lastInsertId()]);
        }
        elseif ($resource === 'category') {
            $stmt = $pdo->prepare("
                INSERT INTO behavior_categories (name, type, default_points, description)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'],
                $data['type'] ?? 'positive',
                $data['default_points'] ?? 0,
                $data['description'] ?? null
            ]);

            echo json_encode(['success' => true, 'message' => 'Category created', 'id' => $pdo->lastInsertId()]);
        }
    }

    // PUT
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $data['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }

        $stmt = $pdo->prepare("
            UPDATE behavior_records SET
                behavior_type = COALESCE(?, behavior_type),
                category = COALESCE(?, category),
                description = COALESCE(?, description),
                points = COALESCE(?, points),
                action_taken = ?,
                parent_notified = COALESCE(?, parent_notified),
                follow_up_required = COALESCE(?, follow_up_required),
                follow_up_date = ?,
                status = COALESCE(?, status)
            WHERE id = ?
        ");
        $stmt->execute([
            $data['behavior_type'] ?? null,
            $data['category'] ?? null,
            $data['description'] ?? null,
            $data['points'] ?? null,
            $data['action_taken'] ?? null,
            $data['parent_notified'] ?? null,
            $data['follow_up_required'] ?? null,
            $data['follow_up_date'] ?? null,
            $data['status'] ?? null,
            $id
        ]);

        echo json_encode(['success' => true, 'message' => 'Record updated']);
    }

    // DELETE
    elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        $resource = $_GET['resource'] ?? 'record';

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }

        if ($resource === 'badge') {
            $pdo->prepare("DELETE FROM student_badges WHERE id = ?")->execute([$id]);
        } else {
            $pdo->prepare("DELETE FROM behavior_records WHERE id = ?")->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Deleted successfully']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

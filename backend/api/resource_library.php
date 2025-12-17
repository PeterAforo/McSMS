<?php
/**
 * Resource Library API
 * Upload and organize teaching materials
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Create resources table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS teaching_resources (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            resource_type ENUM('document', 'video', 'link', 'image', 'presentation', 'worksheet', 'other') DEFAULT 'document',
            file_path VARCHAR(500),
            file_name VARCHAR(255),
            file_size INT,
            url VARCHAR(500),
            subject_id INT,
            class_id INT,
            tags TEXT,
            is_shared TINYINT(1) DEFAULT 0,
            shared_with TEXT,
            download_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_subject (subject_id),
            INDEX idx_type (resource_type)
        )
    ");

    // Create resource folders table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS resource_folders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            parent_id INT,
            color VARCHAR(20) DEFAULT '#3B82F6',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_parent (parent_id)
        )
    ");

    // Add folder_id to resources if not exists
    try {
        $pdo->exec("ALTER TABLE teaching_resources ADD COLUMN folder_id INT AFTER teacher_id");
    } catch (Exception $e) {
        // Column might already exist
    }

    // GET
    if ($method === 'GET') {
        $resource = $_GET['resource'] ?? 'list';
        $teacher_id = $_GET['teacher_id'] ?? null;
        $subject_id = $_GET['subject_id'] ?? null;
        $folder_id = $_GET['folder_id'] ?? null;
        $shared = $_GET['shared'] ?? null;
        $search = $_GET['search'] ?? null;

        if ($resource === 'list') {
            $sql = "
                SELECT tr.*, s.subject_name, c.class_name,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                       rf.name as folder_name
                FROM teaching_resources tr
                LEFT JOIN subjects s ON tr.subject_id = s.id
                LEFT JOIN classes c ON tr.class_id = c.id
                LEFT JOIN teachers t ON tr.teacher_id = t.id
                LEFT JOIN resource_folders rf ON tr.folder_id = rf.id
                WHERE 1=1
            ";
            $params = [];

            if ($teacher_id) {
                $sql .= " AND (tr.teacher_id = ? OR tr.is_shared = 1)";
                $params[] = $teacher_id;
            }
            if ($subject_id) {
                $sql .= " AND tr.subject_id = ?";
                $params[] = $subject_id;
            }
            if ($folder_id) {
                $sql .= " AND tr.folder_id = ?";
                $params[] = $folder_id;
            }
            if ($shared === '1') {
                $sql .= " AND tr.is_shared = 1";
            }
            if ($search) {
                $sql .= " AND (tr.title LIKE ? OR tr.description LIKE ? OR tr.tags LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            $sql .= " ORDER BY tr.created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'resources' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        elseif ($resource === 'folders') {
            $sql = "SELECT * FROM resource_folders WHERE 1=1";
            $params = [];

            if ($teacher_id) {
                $sql .= " AND teacher_id = ?";
                $params[] = $teacher_id;
            }

            $sql .= " ORDER BY name";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'folders' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        elseif ($resource === 'single') {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Resource ID required']);
                exit();
            }

            $stmt = $pdo->prepare("
                SELECT tr.*, s.subject_name, c.class_name,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                FROM teaching_resources tr
                LEFT JOIN subjects s ON tr.subject_id = s.id
                LEFT JOIN classes c ON tr.class_id = c.id
                LEFT JOIN teachers t ON tr.teacher_id = t.id
                WHERE tr.id = ?
            ");
            $stmt->execute([$id]);
            $resource = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resource) {
                // Increment download count
                $pdo->prepare("UPDATE teaching_resources SET download_count = download_count + 1 WHERE id = ?")->execute([$id]);
                echo json_encode(['success' => true, 'resource' => $resource]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Resource not found']);
            }
        }
        elseif ($resource === 'stats' && $teacher_id) {
            $response = ['success' => true];

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM teaching_resources WHERE teacher_id = ?");
            $stmt->execute([$teacher_id]);
            $response['total_resources'] = $stmt->fetchColumn();

            $stmt = $pdo->prepare("SELECT resource_type, COUNT(*) as count FROM teaching_resources WHERE teacher_id = ? GROUP BY resource_type");
            $stmt->execute([$teacher_id]);
            $response['by_type'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $pdo->prepare("SELECT SUM(download_count) FROM teaching_resources WHERE teacher_id = ?");
            $stmt->execute([$teacher_id]);
            $response['total_downloads'] = $stmt->fetchColumn() ?: 0;

            echo json_encode($response);
        }
    }

    // POST
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $resource = $data['resource'] ?? 'item';

        if ($resource === 'item') {
            if (!isset($data['teacher_id']) || !isset($data['title'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Teacher ID and Title are required']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO teaching_resources (teacher_id, folder_id, title, description, resource_type,
                    file_path, file_name, file_size, url, subject_id, class_id, tags, is_shared, shared_with)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                $data['folder_id'] ?? null,
                $data['title'],
                $data['description'] ?? null,
                $data['resource_type'] ?? 'document',
                $data['file_path'] ?? null,
                $data['file_name'] ?? null,
                $data['file_size'] ?? null,
                $data['url'] ?? null,
                $data['subject_id'] ?? null,
                $data['class_id'] ?? null,
                isset($data['tags']) ? (is_array($data['tags']) ? implode(',', $data['tags']) : $data['tags']) : null,
                $data['is_shared'] ?? 0,
                isset($data['shared_with']) ? json_encode($data['shared_with']) : null
            ]);

            echo json_encode(['success' => true, 'message' => 'Resource created', 'id' => $pdo->lastInsertId()]);
        }
        elseif ($resource === 'folder') {
            if (!isset($data['teacher_id']) || !isset($data['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Teacher ID and Name are required']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO resource_folders (teacher_id, name, parent_id, color)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                $data['name'],
                $data['parent_id'] ?? null,
                $data['color'] ?? '#3B82F6'
            ]);

            echo json_encode(['success' => true, 'message' => 'Folder created', 'id' => $pdo->lastInsertId()]);
        }
    }

    // PUT
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $data['id'] ?? null;
        $resource = $data['resource'] ?? 'item';

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }

        if ($resource === 'item') {
            $stmt = $pdo->prepare("
                UPDATE teaching_resources SET
                    folder_id = COALESCE(?, folder_id),
                    title = COALESCE(?, title),
                    description = ?,
                    resource_type = COALESCE(?, resource_type),
                    url = ?,
                    subject_id = ?,
                    class_id = ?,
                    tags = ?,
                    is_shared = COALESCE(?, is_shared),
                    shared_with = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['folder_id'] ?? null,
                $data['title'] ?? null,
                $data['description'] ?? null,
                $data['resource_type'] ?? null,
                $data['url'] ?? null,
                $data['subject_id'] ?? null,
                $data['class_id'] ?? null,
                isset($data['tags']) ? (is_array($data['tags']) ? implode(',', $data['tags']) : $data['tags']) : null,
                $data['is_shared'] ?? null,
                isset($data['shared_with']) ? json_encode($data['shared_with']) : null,
                $id
            ]);

            echo json_encode(['success' => true, 'message' => 'Resource updated']);
        }
        elseif ($resource === 'folder') {
            $stmt = $pdo->prepare("UPDATE resource_folders SET name = ?, color = ? WHERE id = ?");
            $stmt->execute([$data['name'], $data['color'] ?? '#3B82F6', $id]);

            echo json_encode(['success' => true, 'message' => 'Folder updated']);
        }
    }

    // DELETE
    elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        $resource = $_GET['resource'] ?? 'item';

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }

        if ($resource === 'folder') {
            // Move resources out of folder first
            $pdo->prepare("UPDATE teaching_resources SET folder_id = NULL WHERE folder_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM resource_folders WHERE id = ?")->execute([$id]);
        } else {
            $pdo->prepare("DELETE FROM teaching_resources WHERE id = ?")->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Deleted successfully']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

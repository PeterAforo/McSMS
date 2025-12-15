<?php
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
$id = $_GET['id'] ?? null;
$term_id = $_GET['term_id'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS term_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            term_id INT NOT NULL,
            event_name VARCHAR(100) NOT NULL,
            event_date DATE NOT NULL,
            event_type ENUM('holiday', 'exam', 'break', 'event', 'deadline') DEFAULT 'event',
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (term_id),
            INDEX (event_date)
        )
    ");

    switch ($method) {
        case 'GET':
            if ($term_id) {
                // Get events for a specific term
                $stmt = $pdo->prepare("
                    SELECT * FROM term_events 
                    WHERE term_id = ? 
                    ORDER BY event_date ASC
                ");
                $stmt->execute([$term_id]);
                $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'events' => $events]);
            } else if ($id) {
                // Get single event
                $stmt = $pdo->prepare("SELECT * FROM term_events WHERE id = ?");
                $stmt->execute([$id]);
                $event = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'event' => $event]);
            } else {
                // Get all events
                $stmt = $pdo->query("
                    SELECT te.*, t.term_name 
                    FROM term_events te
                    JOIN terms t ON te.term_id = t.id
                    ORDER BY te.event_date DESC
                ");
                $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'events' => $events]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['term_id']) || empty($data['event_name']) || empty($data['event_date'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Term ID, event name, and date are required']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO term_events (term_id, event_name, event_date, event_type, description) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['term_id'],
                $data['event_name'],
                $data['event_date'],
                $data['event_type'] ?? 'event',
                $data['description'] ?? null
            ]);
            
            $id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM term_events WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'event' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE term_events 
                SET event_name = ?, event_date = ?, event_type = ?, description = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['event_name'],
                $data['event_date'],
                $data['event_type'] ?? 'event',
                $data['description'] ?? null,
                $id
            ]);
            
            $stmt = $pdo->prepare("SELECT * FROM term_events WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'event' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM term_events WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Event deleted']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

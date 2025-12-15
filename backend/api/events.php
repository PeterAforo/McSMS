<?php
/**
 * Events API
 * Manage school events and calendar
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

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create events table if not exists (without foreign key to avoid dependency issues)
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS events (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_type VARCHAR(50) DEFAULT 'other',
            start_date DATE NOT NULL,
            end_date DATE,
            start_time TIME,
            end_time TIME,
            location VARCHAR(255),
            is_all_day TINYINT(1) DEFAULT 0,
            is_recurring TINYINT(1) DEFAULT 0,
            recurrence_pattern VARCHAR(50),
            target_audience VARCHAR(50) DEFAULT 'all',
            class_id INT,
            created_by INT,
            status VARCHAR(20) DEFAULT 'scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    } catch (Exception $e) {
        // Table might already exist with different structure
        error_log("Events table creation: " . $e->getMessage());
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    $upcoming = isset($_GET['upcoming']);
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;

    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                getEvent($pdo, $_GET['id']);
            } elseif ($upcoming) {
                getUpcomingEvents($pdo, $limit);
            } else {
                getEvents($pdo, $limit);
            }
            break;
        
        case 'POST':
            createEvent($pdo);
            break;
        
        case 'PUT':
            updateEvent($pdo, $_GET['id'] ?? null);
            break;
        
        case 'DELETE':
            deleteEvent($pdo, $_GET['id'] ?? null);
            break;
        
        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function getEvents($pdo, $limit) {
    try {
        $stmt = $pdo->prepare("
            SELECT e.*, c.class_name
            FROM events e
            LEFT JOIN classes c ON e.class_id = c.id
            ORDER BY e.start_date DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'events' => $events]);
    } catch (Exception $e) {
        // Table might not exist, return empty
        echo json_encode(['success' => true, 'events' => []]);
    }
}

function getUpcomingEvents($pdo, $limit) {
    try {
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("
            SELECT e.*, c.class_name
            FROM events e
            LEFT JOIN classes c ON e.class_id = c.id
            WHERE e.start_date >= ? AND (e.status IS NULL OR e.status != 'cancelled')
            ORDER BY e.start_date ASC
            LIMIT ?
        ");
        $stmt->execute([$today, $limit]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'events' => $events]);
    } catch (Exception $e) {
        // Table might not exist, return empty
        echo json_encode(['success' => true, 'events' => []]);
    }
}

function getEvent($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT e.*, c.class_name
        FROM events e
        LEFT JOIN classes c ON e.class_id = c.id
        WHERE e.id = ?
    ");
    $stmt->execute([$id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($event) {
        echo json_encode(['success' => true, 'event' => $event]);
    } else {
        throw new Exception('Event not found');
    }
}

function createEvent($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['title']) || empty($data['start_date'])) {
        throw new Exception('Title and start date are required');
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO events (title, description, event_type, start_date, end_date, start_time, end_time, 
                           location, is_all_day, target_audience, class_id, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['title'],
        $data['description'] ?? null,
        $data['event_type'] ?? 'other',
        $data['start_date'],
        $data['end_date'] ?? $data['start_date'],
        $data['start_time'] ?? null,
        $data['end_time'] ?? null,
        $data['location'] ?? null,
        $data['is_all_day'] ?? 0,
        $data['target_audience'] ?? 'all',
        $data['class_id'] ?? null,
        $data['created_by'] ?? null,
        $data['status'] ?? 'scheduled'
    ]);
    
    $id = $pdo->lastInsertId();
    
    echo json_encode(['success' => true, 'message' => 'Event created', 'id' => $id]);
}

function updateEvent($pdo, $id) {
    if (!$id) throw new Exception('Event ID required');
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $fields = [];
    $values = [];
    
    $allowedFields = ['title', 'description', 'event_type', 'start_date', 'end_date', 
                      'start_time', 'end_time', 'location', 'is_all_day', 'target_audience', 
                      'class_id', 'status'];
    
    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $fields[] = "$field = ?";
            $values[] = $data[$field];
        }
    }
    
    if (empty($fields)) {
        throw new Exception('No fields to update');
    }
    
    $values[] = $id;
    $sql = "UPDATE events SET " . implode(', ', $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    echo json_encode(['success' => true, 'message' => 'Event updated']);
}

function deleteEvent($pdo, $id) {
    if (!$id) throw new Exception('Event ID required');
    
    $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'message' => 'Event deleted']);
}

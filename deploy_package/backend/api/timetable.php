<?php
/**
 * Timetable Management API
 * Complete timetable scheduling with conflict detection
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

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

    $method = $_SERVER['REQUEST_METHOD'];
    $resource = $_GET['resource'] ?? '';
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;

    // ============================================
    // TIME SLOTS
    // ============================================
    if ($resource === 'time_slots') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM time_slots WHERE id = ?");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'time_slot' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } else {
                    $stmt = $pdo->query("SELECT * FROM time_slots ORDER BY slot_order");
                    echo json_encode(['success' => true, 'time_slots' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO time_slots (slot_name, start_time, end_time, slot_order, is_break, status)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['slot_name'],
                    $data['start_time'],
                    $data['end_time'],
                    $data['slot_order'],
                    $data['is_break'] ?? 0,
                    $data['status'] ?? 'active'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE time_slots 
                    SET slot_name = ?, start_time = ?, end_time = ?, slot_order = ?, is_break = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['slot_name'],
                    $data['start_time'],
                    $data['end_time'],
                    $data['slot_order'],
                    $data['is_break'] ?? 0,
                    $data['status'] ?? 'active',
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM time_slots WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // TIMETABLE TEMPLATES
    // ============================================
    elseif ($resource === 'templates') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("
                        SELECT t.*, at.term_name, u.name as created_by_name
                        FROM timetable_templates t
                        LEFT JOIN academic_terms at ON t.term_id = at.id
                        LEFT JOIN users u ON t.created_by = u.id
                        WHERE t.id = ?
                    ");
                    $stmt->execute([$id]);
                    $template = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get entries count
                    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM timetable_entries WHERE template_id = ?");
                    $stmt->execute([$id]);
                    $template['entries_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                    
                    echo json_encode(['success' => true, 'template' => $template]);
                } else {
                    $stmt = $pdo->query("
                        SELECT t.*, at.term_name, u.name as created_by_name,
                        (SELECT COUNT(*) FROM timetable_entries WHERE template_id = t.id) as entries_count
                        FROM timetable_templates t
                        LEFT JOIN academic_terms at ON t.term_id = at.id
                        LEFT JOIN users u ON t.created_by = u.id
                        ORDER BY t.created_at DESC
                    ");
                    echo json_encode(['success' => true, 'templates' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO timetable_templates (template_name, description, academic_year, term_id, status, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['template_name'],
                    $data['description'] ?? null,
                    $data['academic_year'] ?? date('Y'),
                    $data['term_id'] ?? null,
                    $data['status'] ?? 'draft',
                    $data['created_by'] ?? 1
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'activate') {
                    // Deactivate all other templates for the same term
                    $stmt = $pdo->prepare("UPDATE timetable_templates SET status = 'archived' WHERE term_id = ? AND id != ?");
                    $stmt->execute([$data['term_id'], $id]);
                    
                    // Activate this template
                    $stmt = $pdo->prepare("UPDATE timetable_templates SET status = 'active' WHERE id = ?");
                    $stmt->execute([$id]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE timetable_templates 
                        SET template_name = ?, description = ?, academic_year = ?, term_id = ?, status = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['template_name'],
                        $data['description'] ?? null,
                        $data['academic_year'] ?? date('Y'),
                        $data['term_id'] ?? null,
                        $data['status'] ?? 'draft',
                        $id
                    ]);
                }
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM timetable_templates WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // TIMETABLE ENTRIES
    // ============================================
    elseif ($resource === 'entries') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_template') {
                    $templateId = $_GET['template_id'] ?? null;
                    $classId = $_GET['class_id'] ?? null;
                    
                    $where = ["template_id = ?"];
                    $params = [$templateId];
                    
                    if ($classId) {
                        $where[] = "class_id = ?";
                        $params[] = $classId;
                    }
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            e.*,
                            c.class_name,
                            s.subject_name,
                            CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                            ts.slot_name,
                            ts.start_time,
                            ts.end_time
                        FROM timetable_entries e
                        JOIN classes c ON e.class_id = c.id
                        JOIN subjects s ON e.subject_id = s.id
                        LEFT JOIN teachers t ON e.teacher_id = t.id
                        JOIN time_slots ts ON e.time_slot_id = ts.id
                        WHERE " . implode(' AND ', $where) . "
                        ORDER BY 
                            FIELD(e.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                            ts.slot_order
                    ");
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'entries' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_teacher') {
                    $teacherId = $_GET['teacher_id'] ?? null;
                    $templateId = $_GET['template_id'] ?? null;
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            e.*,
                            c.class_name,
                            s.subject_name,
                            ts.slot_name,
                            ts.start_time,
                            ts.end_time
                        FROM timetable_entries e
                        JOIN classes c ON e.class_id = c.id
                        JOIN subjects s ON e.subject_id = s.id
                        JOIN time_slots ts ON e.time_slot_id = ts.id
                        WHERE e.teacher_id = ? AND e.template_id = ?
                        ORDER BY 
                            FIELD(e.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                            ts.slot_order
                    ");
                    $stmt->execute([$teacherId, $templateId]);
                    echo json_encode(['success' => true, 'entries' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            e.*,
                            c.class_name,
                            s.subject_name,
                            CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                            ts.slot_name,
                            ts.start_time,
                            ts.end_time
                        FROM timetable_entries e
                        JOIN classes c ON e.class_id = c.id
                        JOIN subjects s ON e.subject_id = s.id
                        LEFT JOIN teachers t ON e.teacher_id = t.id
                        JOIN time_slots ts ON e.time_slot_id = ts.id
                        WHERE e.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'entry' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Check for conflicts
                $conflicts = checkConflicts($pdo, $data);
                if (!empty($conflicts)) {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Conflicts detected',
                        'conflicts' => $conflicts
                    ]);
                    break;
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO timetable_entries 
                    (template_id, class_id, subject_id, teacher_id, day_of_week, time_slot_id, room_number, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['template_id'],
                    $data['class_id'],
                    $data['subject_id'],
                    $data['teacher_id'] ?? null,
                    $data['day_of_week'],
                    $data['time_slot_id'],
                    $data['room_number'] ?? null,
                    $data['notes'] ?? null
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $data['id'] = $id;
                
                // Check for conflicts (excluding current entry)
                $conflicts = checkConflicts($pdo, $data, $id);
                if (!empty($conflicts)) {
                    echo json_encode([
                        'success' => false,
                        'error' => 'Conflicts detected',
                        'conflicts' => $conflicts
                    ]);
                    break;
                }
                
                $stmt = $pdo->prepare("
                    UPDATE timetable_entries 
                    SET class_id = ?, subject_id = ?, teacher_id = ?, day_of_week = ?, 
                        time_slot_id = ?, room_number = ?, notes = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['class_id'],
                    $data['subject_id'],
                    $data['teacher_id'] ?? null,
                    $data['day_of_week'],
                    $data['time_slot_id'],
                    $data['room_number'] ?? null,
                    $data['notes'] ?? null,
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM timetable_entries WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // CONFLICTS
    // ============================================
    elseif ($resource === 'conflicts') {
        if ($method === 'GET') {
            $templateId = $_GET['template_id'] ?? null;
            
            $stmt = $pdo->prepare("
                SELECT 
                    c.*,
                    e1.day_of_week,
                    ts.slot_name,
                    CASE 
                        WHEN c.conflict_type = 'teacher_double_booking' THEN CONCAT(t.first_name, ' ', t.last_name)
                        WHEN c.conflict_type = 'room_double_booking' THEN e1.room_number
                        WHEN c.conflict_type = 'class_double_booking' THEN cl.class_name
                    END as conflict_resource
                FROM timetable_conflicts c
                JOIN timetable_entries e1 ON c.entry_id_1 = e1.id
                JOIN time_slots ts ON e1.time_slot_id = ts.id
                LEFT JOIN teachers t ON e1.teacher_id = t.id
                LEFT JOIN classes cl ON e1.class_id = cl.id
                WHERE c.template_id = ? AND c.resolved = 0
                ORDER BY c.created_at DESC
            ");
            $stmt->execute([$templateId]);
            echo json_encode(['success' => true, 'conflicts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    }

    // ============================================
    // SUBSTITUTIONS
    // ============================================
    elseif ($resource === 'substitutions') {
        switch ($method) {
            case 'GET':
                $date = $_GET['date'] ?? date('Y-m-d');
                
                $stmt = $pdo->prepare("
                    SELECT 
                        s.*,
                        CONCAT(t1.first_name, ' ', t1.last_name) as original_teacher,
                        CONCAT(t2.first_name, ' ', t2.last_name) as substitute_teacher,
                        c.class_name,
                        sub.subject_name,
                        ts.slot_name,
                        ts.start_time,
                        ts.end_time
                    FROM teacher_substitutions s
                    JOIN timetable_entries e ON s.timetable_entry_id = e.id
                    JOIN teachers t1 ON s.original_teacher_id = t1.id
                    JOIN teachers t2 ON s.substitute_teacher_id = t2.id
                    JOIN classes c ON e.class_id = c.id
                    JOIN subjects sub ON e.subject_id = sub.id
                    JOIN time_slots ts ON e.time_slot_id = ts.id
                    WHERE s.substitution_date = ?
                    ORDER BY ts.slot_order
                ");
                $stmt->execute([$date]);
                echo json_encode(['success' => true, 'substitutions' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO teacher_substitutions 
                    (timetable_entry_id, original_teacher_id, substitute_teacher_id, substitution_date, reason, status)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['timetable_entry_id'],
                    $data['original_teacher_id'],
                    $data['substitute_teacher_id'],
                    $data['substitution_date'],
                    $data['reason'] ?? null,
                    $data['status'] ?? 'pending'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'approve') {
                    $stmt = $pdo->prepare("
                        UPDATE teacher_substitutions 
                        SET status = 'approved', approved_by = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$data['approved_by'], $id]);
                } elseif ($action === 'reject') {
                    $stmt = $pdo->prepare("UPDATE teacher_substitutions SET status = 'rejected' WHERE id = ?");
                    $stmt->execute([$id]);
                }
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // ROOMS
    // ============================================
    elseif ($resource === 'rooms') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM rooms WHERE id = ?");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'room' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } else {
                    $stmt = $pdo->query("SELECT * FROM rooms ORDER BY room_number");
                    echo json_encode(['success' => true, 'rooms' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO rooms (room_number, room_name, room_type, capacity, facilities, status)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['room_number'],
                    $data['room_name'] ?? null,
                    $data['room_type'] ?? 'classroom',
                    $data['capacity'] ?? null,
                    $data['facilities'] ?? null,
                    $data['status'] ?? 'available'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE rooms 
                    SET room_number = ?, room_name = ?, room_type = ?, capacity = ?, facilities = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['room_number'],
                    $data['room_name'] ?? null,
                    $data['room_type'] ?? 'classroom',
                    $data['capacity'] ?? null,
                    $data['facilities'] ?? null,
                    $data['status'] ?? 'available',
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM rooms WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function checkConflicts($pdo, $data, $excludeId = null) {
    $conflicts = [];
    
    $excludeClause = $excludeId ? "AND id != ?" : "";
    $params = [
        $data['template_id'],
        $data['day_of_week'],
        $data['time_slot_id']
    ];
    
    if ($excludeId) {
        $params[] = $excludeId;
    }
    
    // Check teacher double booking
    if (!empty($data['teacher_id'])) {
        $stmt = $pdo->prepare("
            SELECT id FROM timetable_entries
            WHERE template_id = ? AND day_of_week = ? AND time_slot_id = ? AND teacher_id = ? $excludeClause
        ");
        $checkParams = array_merge($params, [$data['teacher_id']]);
        $stmt->execute($checkParams);
        if ($stmt->fetch()) {
            $conflicts[] = ['type' => 'teacher_double_booking', 'message' => 'Teacher already assigned at this time'];
        }
    }
    
    // Check class double booking
    $stmt = $pdo->prepare("
        SELECT id FROM timetable_entries
        WHERE template_id = ? AND day_of_week = ? AND time_slot_id = ? AND class_id = ? $excludeClause
    ");
    $checkParams = array_merge($params, [$data['class_id']]);
    $stmt->execute($checkParams);
    if ($stmt->fetch()) {
        $conflicts[] = ['type' => 'class_double_booking', 'message' => 'Class already has a lesson at this time'];
    }
    
    // Check room double booking
    if (!empty($data['room_number'])) {
        $stmt = $pdo->prepare("
            SELECT id FROM timetable_entries
            WHERE template_id = ? AND day_of_week = ? AND time_slot_id = ? AND room_number = ? $excludeClause
        ");
        $checkParams = array_merge($params, [$data['room_number']]);
        $stmt->execute($checkParams);
        if ($stmt->fetch()) {
            $conflicts[] = ['type' => 'room_double_booking', 'message' => 'Room already booked at this time'];
        }
    }
    
    return $conflicts;
}

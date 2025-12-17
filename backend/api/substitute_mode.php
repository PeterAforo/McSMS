<?php
/**
 * Substitute Teacher Mode API
 * Leave lesson plans and handover notes for substitutes
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

    // Create substitute notes table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS substitute_notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacher_id INT NOT NULL,
            class_id INT NOT NULL,
            subject_id INT,
            date_from DATE NOT NULL,
            date_to DATE NOT NULL,
            substitute_teacher_id INT,
            lesson_plans TEXT,
            class_info TEXT,
            student_notes TEXT,
            seating_info TEXT,
            emergency_contacts TEXT,
            special_instructions TEXT,
            materials_location TEXT,
            routines TEXT,
            behavior_notes TEXT,
            status ENUM('pending', 'active', 'completed') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_teacher (teacher_id),
            INDEX idx_class (class_id),
            INDEX idx_dates (date_from, date_to)
        )
    ");

    // GET
    if ($method === 'GET') {
        $teacher_id = $_GET['teacher_id'] ?? null;
        $substitute_id = $_GET['substitute_id'] ?? null;
        $class_id = $_GET['class_id'] ?? null;
        $id = $_GET['id'] ?? null;
        $active = $_GET['active'] ?? null;

        if ($id) {
            // Get single note with full details
            $stmt = $pdo->prepare("
                SELECT sn.*, c.class_name, s.subject_name,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                       CONCAT(st.first_name, ' ', st.last_name) as substitute_name
                FROM substitute_notes sn
                LEFT JOIN classes c ON sn.class_id = c.id
                LEFT JOIN subjects s ON sn.subject_id = s.id
                LEFT JOIN teachers t ON sn.teacher_id = t.id
                LEFT JOIN teachers st ON sn.substitute_teacher_id = st.id
                WHERE sn.id = ?
            ");
            $stmt->execute([$id]);
            $note = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($note) {
                // Get students in class with important notes
                $stmt = $pdo->prepare("
                    SELECT s.id, s.first_name, s.last_name, s.admission_number, s.medical_conditions,
                           (SELECT content FROM student_progress_notes WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1) as latest_note
                    FROM students s
                    WHERE s.class_id = ? AND s.status = 'active'
                    ORDER BY s.first_name, s.last_name
                ");
                $stmt->execute([$note['class_id']]);
                $note['students'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Get recent behavior records
                $stmt = $pdo->prepare("
                    SELECT br.*, CONCAT(s.first_name, ' ', s.last_name) as student_name
                    FROM behavior_records br
                    LEFT JOIN students s ON br.student_id = s.id
                    WHERE br.class_id = ? AND br.incident_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                    ORDER BY br.incident_date DESC
                    LIMIT 10
                ");
                $stmt->execute([$note['class_id']]);
                $note['recent_behaviors'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Get seating chart if exists
                $stmt = $pdo->prepare("
                    SELECT sc.*, 
                           (SELECT COUNT(*) FROM seat_assignments WHERE chart_id = sc.id) as assigned_count
                    FROM seating_charts sc
                    WHERE sc.class_id = ? AND sc.is_active = 1
                    LIMIT 1
                ");
                $stmt->execute([$note['class_id']]);
                $note['seating_chart'] = $stmt->fetch(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'note' => $note]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Note not found']);
            }
        }
        else {
            $sql = "
                SELECT sn.*, c.class_name, s.subject_name,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                       CONCAT(st.first_name, ' ', st.last_name) as substitute_name
                FROM substitute_notes sn
                LEFT JOIN classes c ON sn.class_id = c.id
                LEFT JOIN subjects s ON sn.subject_id = s.id
                LEFT JOIN teachers t ON sn.teacher_id = t.id
                LEFT JOIN teachers st ON sn.substitute_teacher_id = st.id
                WHERE 1=1
            ";
            $params = [];

            if ($teacher_id) {
                $sql .= " AND sn.teacher_id = ?";
                $params[] = $teacher_id;
            }
            if ($substitute_id) {
                $sql .= " AND sn.substitute_teacher_id = ?";
                $params[] = $substitute_id;
            }
            if ($class_id) {
                $sql .= " AND sn.class_id = ?";
                $params[] = $class_id;
            }
            if ($active === '1') {
                $sql .= " AND sn.date_from <= CURDATE() AND sn.date_to >= CURDATE()";
            }

            $sql .= " ORDER BY sn.date_from DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'notes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
    }

    // POST
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['teacher_id']) || !isset($data['class_id']) || !isset($data['date_from']) || !isset($data['date_to'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Teacher ID, Class ID, Date From, and Date To are required']);
            exit();
        }

        $stmt = $pdo->prepare("
            INSERT INTO substitute_notes (teacher_id, class_id, subject_id, date_from, date_to, 
                substitute_teacher_id, lesson_plans, class_info, student_notes, seating_info,
                emergency_contacts, special_instructions, materials_location, routines, behavior_notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['teacher_id'],
            $data['class_id'],
            $data['subject_id'] ?? null,
            $data['date_from'],
            $data['date_to'],
            $data['substitute_teacher_id'] ?? null,
            $data['lesson_plans'] ?? null,
            $data['class_info'] ?? null,
            $data['student_notes'] ?? null,
            $data['seating_info'] ?? null,
            $data['emergency_contacts'] ?? null,
            $data['special_instructions'] ?? null,
            $data['materials_location'] ?? null,
            $data['routines'] ?? null,
            $data['behavior_notes'] ?? null,
            $data['status'] ?? 'pending'
        ]);

        echo json_encode(['success' => true, 'message' => 'Substitute note created', 'id' => $pdo->lastInsertId()]);
    }

    // PUT
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $data['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Note ID is required']);
            exit();
        }

        $stmt = $pdo->prepare("
            UPDATE substitute_notes SET
                subject_id = COALESCE(?, subject_id),
                date_from = COALESCE(?, date_from),
                date_to = COALESCE(?, date_to),
                substitute_teacher_id = ?,
                lesson_plans = ?,
                class_info = ?,
                student_notes = ?,
                seating_info = ?,
                emergency_contacts = ?,
                special_instructions = ?,
                materials_location = ?,
                routines = ?,
                behavior_notes = ?,
                status = COALESCE(?, status)
            WHERE id = ?
        ");
        $stmt->execute([
            $data['subject_id'] ?? null,
            $data['date_from'] ?? null,
            $data['date_to'] ?? null,
            $data['substitute_teacher_id'] ?? null,
            $data['lesson_plans'] ?? null,
            $data['class_info'] ?? null,
            $data['student_notes'] ?? null,
            $data['seating_info'] ?? null,
            $data['emergency_contacts'] ?? null,
            $data['special_instructions'] ?? null,
            $data['materials_location'] ?? null,
            $data['routines'] ?? null,
            $data['behavior_notes'] ?? null,
            $data['status'] ?? null,
            $id
        ]);

        echo json_encode(['success' => true, 'message' => 'Note updated']);
    }

    // DELETE
    elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Note ID is required']);
            exit();
        }

        $pdo->prepare("DELETE FROM substitute_notes WHERE id = ?")->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Note deleted']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

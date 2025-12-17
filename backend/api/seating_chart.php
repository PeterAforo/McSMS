<?php
/**
 * Seating Chart API
 * Visual classroom layout management
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

    // Create seating charts table
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS seating_charts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                teacher_id INT NOT NULL,
                name VARCHAR(100) DEFAULT 'Default Layout',
                layout_type ENUM('grid', 'rows', 'groups', 'u_shape', 'custom') DEFAULT 'grid',
                `rows` INT DEFAULT 5,
                `columns` INT DEFAULT 6,
                room_name VARCHAR(100),
                notes TEXT,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_class (class_id),
                INDEX idx_teacher (teacher_id)
            )
        ");
    } catch (PDOException $e) {
        // Table might already exist
    }

    // Create seat assignments table
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_seat (chart_id, row_num, col_num),
                UNIQUE KEY unique_student (chart_id, student_id)
            )
        ");
    } catch (PDOException $e) {
        // Table might already exist
    }

    // GET
    if ($method === 'GET') {
        $class_id = $_GET['class_id'] ?? null;
        $chart_id = $_GET['id'] ?? null;
        $teacher_id = $_GET['teacher_id'] ?? null;

        if ($chart_id) {
            // Get single chart with assignments
            $stmt = $pdo->prepare("
                SELECT sc.*, c.class_name, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                FROM seating_charts sc
                LEFT JOIN classes c ON sc.class_id = c.id
                LEFT JOIN teachers t ON sc.teacher_id = t.id
                WHERE sc.id = ?
            ");
            $stmt->execute([$chart_id]);
            $chart = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($chart) {
                // Get seat assignments with student info
                $stmt = $pdo->prepare("
                    SELECT sa.*, s.first_name, s.last_name, s.admission_number, s.photo
                    FROM seat_assignments sa
                    LEFT JOIN students s ON sa.student_id = s.id
                    WHERE sa.chart_id = ?
                    ORDER BY sa.row_num, sa.col_num
                ");
                $stmt->execute([$chart_id]);
                $chart['assignments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Get unassigned students
                $stmt = $pdo->prepare("
                    SELECT s.id, s.first_name, s.last_name, s.admission_number
                    FROM students s
                    WHERE s.class_id = ? AND s.status = 'active'
                    AND s.id NOT IN (SELECT student_id FROM seat_assignments WHERE chart_id = ?)
                    ORDER BY s.first_name, s.last_name
                ");
                $stmt->execute([$chart['class_id'], $chart_id]);
                $chart['unassigned_students'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'chart' => $chart]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Chart not found']);
            }
        }
        elseif ($class_id) {
            // Get all charts for a class
            $stmt = $pdo->prepare("
                SELECT sc.*, 
                       (SELECT COUNT(*) FROM seat_assignments WHERE chart_id = sc.id) as assigned_count,
                       (SELECT COUNT(*) FROM students WHERE class_id = sc.class_id AND status = 'active') as total_students
                FROM seating_charts sc
                WHERE sc.class_id = ?
                ORDER BY sc.is_active DESC, sc.created_at DESC
            ");
            $stmt->execute([$class_id]);

            echo json_encode(['success' => true, 'charts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        elseif ($teacher_id) {
            // Get all charts for a teacher
            $stmt = $pdo->prepare("
                SELECT sc.*, c.class_name,
                       (SELECT COUNT(*) FROM seat_assignments WHERE chart_id = sc.id) as assigned_count
                FROM seating_charts sc
                LEFT JOIN classes c ON sc.class_id = c.id
                WHERE sc.teacher_id = ?
                ORDER BY sc.is_active DESC, c.class_name
            ");
            $stmt->execute([$teacher_id]);

            echo json_encode(['success' => true, 'charts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        else {
            echo json_encode(['success' => false, 'error' => 'class_id, chart_id, or teacher_id required']);
        }
    }

    // POST
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? 'create_chart';

        if ($action === 'create_chart') {
            if (!isset($data['class_id']) || !isset($data['teacher_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Class ID and Teacher ID are required']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO seating_charts (class_id, teacher_id, name, layout_type, `rows`, `columns`, room_name, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['class_id'],
                $data['teacher_id'],
                $data['name'] ?? 'Default Layout',
                $data['layout_type'] ?? 'grid',
                $data['rows'] ?? 5,
                $data['columns'] ?? 6,
                $data['room_name'] ?? null,
                $data['notes'] ?? null
            ]);

            echo json_encode(['success' => true, 'message' => 'Chart created', 'id' => $pdo->lastInsertId()]);
        }
        elseif ($action === 'assign_seat') {
            if (!isset($data['chart_id']) || !isset($data['student_id']) || !isset($data['row_num']) || !isset($data['col_num'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Chart ID, Student ID, Row, and Column are required']);
                exit();
            }

            // Remove existing assignment for this student in this chart
            $pdo->prepare("DELETE FROM seat_assignments WHERE chart_id = ? AND student_id = ?")
                ->execute([$data['chart_id'], $data['student_id']]);

            // Remove any student at this seat
            $pdo->prepare("DELETE FROM seat_assignments WHERE chart_id = ? AND row_num = ? AND col_num = ?")
                ->execute([$data['chart_id'], $data['row_num'], $data['col_num']]);

            // Create new assignment
            $stmt = $pdo->prepare("
                INSERT INTO seat_assignments (chart_id, student_id, row_num, col_num, seat_label, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['chart_id'],
                $data['student_id'],
                $data['row_num'],
                $data['col_num'],
                $data['seat_label'] ?? null,
                $data['notes'] ?? null
            ]);

            echo json_encode(['success' => true, 'message' => 'Seat assigned']);
        }
        elseif ($action === 'remove_assignment') {
            if (!isset($data['chart_id']) || !isset($data['student_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Chart ID and Student ID are required']);
                exit();
            }

            $pdo->prepare("DELETE FROM seat_assignments WHERE chart_id = ? AND student_id = ?")
                ->execute([$data['chart_id'], $data['student_id']]);

            echo json_encode(['success' => true, 'message' => 'Assignment removed']);
        }
        elseif ($action === 'auto_assign') {
            // Auto-assign all unassigned students
            if (!isset($data['chart_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Chart ID is required']);
                exit();
            }

            // Get chart info
            $stmt = $pdo->prepare("SELECT * FROM seating_charts WHERE id = ?");
            $stmt->execute([$data['chart_id']]);
            $chart = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$chart) {
                http_response_code(404);
                echo json_encode(['error' => 'Chart not found']);
                exit();
            }

            // Get unassigned students
            $stmt = $pdo->prepare("
                SELECT s.id FROM students s
                WHERE s.class_id = ? AND s.status = 'active'
                AND s.id NOT IN (SELECT student_id FROM seat_assignments WHERE chart_id = ?)
                ORDER BY s.first_name, s.last_name
            ");
            $stmt->execute([$chart['class_id'], $data['chart_id']]);
            $students = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Get occupied seats
            $stmt = $pdo->prepare("SELECT CONCAT(row_num, '-', col_num) FROM seat_assignments WHERE chart_id = ?");
            $stmt->execute([$data['chart_id']]);
            $occupied = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Assign students to empty seats
            $assigned = 0;
            $insertStmt = $pdo->prepare("INSERT INTO seat_assignments (chart_id, student_id, row_num, col_num) VALUES (?, ?, ?, ?)");

            foreach ($students as $studentId) {
                for ($r = 1; $r <= $chart['rows']; $r++) {
                    for ($c = 1; $c <= $chart['columns']; $c++) {
                        $seatKey = "$r-$c";
                        if (!in_array($seatKey, $occupied)) {
                            $insertStmt->execute([$data['chart_id'], $studentId, $r, $c]);
                            $occupied[] = $seatKey;
                            $assigned++;
                            break 2;
                        }
                    }
                }
            }

            echo json_encode(['success' => true, 'message' => "$assigned students assigned"]);
        }
        elseif ($action === 'shuffle') {
            // Randomly shuffle all assignments
            if (!isset($data['chart_id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Chart ID is required']);
                exit();
            }

            // Get all current assignments
            $stmt = $pdo->prepare("SELECT student_id FROM seat_assignments WHERE chart_id = ?");
            $stmt->execute([$data['chart_id']]);
            $students = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Get chart dimensions
            $stmt = $pdo->prepare("SELECT `rows`, `columns` FROM seating_charts WHERE id = ?");
            $stmt->execute([$data['chart_id']]);
            $chart = $stmt->fetch(PDO::FETCH_ASSOC);

            // Delete all assignments
            $pdo->prepare("DELETE FROM seat_assignments WHERE chart_id = ?")->execute([$data['chart_id']]);

            // Shuffle students
            shuffle($students);

            // Reassign randomly
            $insertStmt = $pdo->prepare("INSERT INTO seat_assignments (chart_id, student_id, row_num, col_num) VALUES (?, ?, ?, ?)");
            $index = 0;
            for ($r = 1; $r <= $chart['rows'] && $index < count($students); $r++) {
                for ($c = 1; $c <= $chart['columns'] && $index < count($students); $c++) {
                    $insertStmt->execute([$data['chart_id'], $students[$index], $r, $c]);
                    $index++;
                }
            }

            echo json_encode(['success' => true, 'message' => 'Seats shuffled']);
        }
    }

    // PUT
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $data['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Chart ID is required']);
            exit();
        }

        $stmt = $pdo->prepare("
            UPDATE seating_charts SET
                name = COALESCE(?, name),
                layout_type = COALESCE(?, layout_type),
                `rows` = COALESCE(?, `rows`),
                `columns` = COALESCE(?, `columns`),
                room_name = ?,
                notes = ?,
                is_active = COALESCE(?, is_active)
            WHERE id = ?
        ");
        $stmt->execute([
            $data['name'] ?? null,
            $data['layout_type'] ?? null,
            $data['rows'] ?? null,
            $data['columns'] ?? null,
            $data['room_name'] ?? null,
            $data['notes'] ?? null,
            $data['is_active'] ?? null,
            $id
        ]);

        echo json_encode(['success' => true, 'message' => 'Chart updated']);
    }

    // DELETE
    elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Chart ID is required']);
            exit();
        }

        $pdo->prepare("DELETE FROM seating_charts WHERE id = ?")->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Chart deleted']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

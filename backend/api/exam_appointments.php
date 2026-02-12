<?php
/**
 * Exam/Interview Appointments API
 * Handles scheduling, confirmation, and reminders for admission exams/interviews
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Ensure tables exist
    createAppointmentTables($pdo);

    switch ($method) {
        case 'GET':
            handleGet($pdo, $id, $action);
            break;
        case 'POST':
            handlePost($pdo, $action);
            break;
        case 'PUT':
            handlePut($pdo, $id, $action);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function createAppointmentTables($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS exam_appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            application_id INT NOT NULL,
            appointment_type ENUM('exam', 'interview', 'both') NOT NULL DEFAULT 'exam',
            available_dates JSON,
            selected_date DATETIME,
            location VARCHAR(255),
            room VARCHAR(100),
            instructions TEXT,
            subjects VARCHAR(500),
            admin_confirmed TINYINT(1) DEFAULT 0,
            parent_confirmed TINYINT(1) DEFAULT 0,
            confirmed_at DATETIME,
            reminder_sent_24h TINYINT(1) DEFAULT 0,
            reminder_sent_1h TINYINT(1) DEFAULT 0,
            email_reminder_sent TINYINT(1) DEFAULT 0,
            sms_reminder_sent TINYINT(1) DEFAULT 0,
            status ENUM('pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
            result ENUM('passed', 'failed', 'pending') DEFAULT 'pending',
            score DECIMAL(5,2),
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_application (application_id),
            INDEX idx_status (status),
            INDEX idx_selected_date (selected_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS appointment_reminders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appointment_id INT NOT NULL,
            reminder_type ENUM('email', 'sms', 'push', 'in_app') NOT NULL,
            recipient_type ENUM('parent', 'admin') NOT NULL,
            recipient_id INT NOT NULL,
            recipient_contact VARCHAR(255),
            scheduled_for DATETIME NOT NULL,
            sent_at DATETIME,
            status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_scheduled (scheduled_for, status),
            INDEX idx_appointment (appointment_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function handleGet($pdo, $id, $action) {
    // Get appointments for an application
    if ($action === 'by_application') {
        $appId = $_GET['application_id'] ?? null;
        if (!$appId) {
            echo json_encode(['success' => false, 'error' => 'Application ID required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT ea.*, sa.first_name, sa.last_name, sa.parent_id,
                   CONCAT(sa.first_name, ' ', sa.last_name) as student_name
            FROM exam_appointments ea
            JOIN student_applications sa ON ea.application_id = sa.id
            WHERE ea.application_id = ?
            ORDER BY ea.created_at DESC
        ");
        $stmt->execute([$appId]);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON dates
        foreach ($appointments as &$apt) {
            if ($apt['available_dates']) {
                $apt['available_dates'] = json_decode($apt['available_dates'], true);
            }
        }
        
        echo json_encode(['success' => true, 'appointments' => $appointments]);
        return;
    }
    
    // Get appointments for parent
    if ($action === 'by_parent') {
        $parentId = $_GET['parent_id'] ?? null;
        if (!$parentId) {
            echo json_encode(['success' => false, 'error' => 'Parent ID required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT ea.*, sa.first_name, sa.last_name, sa.parent_id,
                   CONCAT(sa.first_name, ' ', sa.last_name) as student_name,
                   sa.class_applying_for
            FROM exam_appointments ea
            JOIN student_applications sa ON ea.application_id = sa.id
            WHERE sa.parent_id = ?
            ORDER BY ea.selected_date ASC, ea.created_at DESC
        ");
        $stmt->execute([$parentId]);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($appointments as &$apt) {
            if ($apt['available_dates']) {
                $apt['available_dates'] = json_decode($apt['available_dates'], true);
            }
        }
        
        echo json_encode(['success' => true, 'appointments' => $appointments]);
        return;
    }
    
    // Get all pending appointments (for admin)
    if ($action === 'pending') {
        $stmt = $pdo->query("
            SELECT ea.*, sa.first_name, sa.last_name, sa.parent_id,
                   CONCAT(sa.first_name, ' ', sa.last_name) as student_name,
                   sa.class_applying_for, sa.application_number
            FROM exam_appointments ea
            JOIN student_applications sa ON ea.application_id = sa.id
            WHERE ea.status IN ('pending', 'scheduled')
            ORDER BY ea.selected_date ASC, ea.created_at DESC
        ");
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($appointments as &$apt) {
            if ($apt['available_dates']) {
                $apt['available_dates'] = json_decode($apt['available_dates'], true);
            }
        }
        
        echo json_encode(['success' => true, 'appointments' => $appointments]);
        return;
    }
    
    // Get single appointment
    if ($id) {
        $stmt = $pdo->prepare("
            SELECT ea.*, sa.first_name, sa.last_name, sa.parent_id,
                   CONCAT(sa.first_name, ' ', sa.last_name) as student_name,
                   sa.class_applying_for, sa.application_number,
                   u.email as parent_email, u.phone as parent_phone, u.name as parent_name
            FROM exam_appointments ea
            JOIN student_applications sa ON ea.application_id = sa.id
            LEFT JOIN users u ON sa.parent_id = u.id
            WHERE ea.id = ?
        ");
        $stmt->execute([$id]);
        $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($appointment && $appointment['available_dates']) {
            $appointment['available_dates'] = json_decode($appointment['available_dates'], true);
        }
        
        echo json_encode(['success' => true, 'appointment' => $appointment]);
        return;
    }
    
    // Get all appointments
    $stmt = $pdo->query("
        SELECT ea.*, sa.first_name, sa.last_name,
               CONCAT(sa.first_name, ' ', sa.last_name) as student_name,
               sa.class_applying_for, sa.application_number
        FROM exam_appointments ea
        JOIN student_applications sa ON ea.application_id = sa.id
        ORDER BY ea.created_at DESC
    ");
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($appointments as &$apt) {
        if ($apt['available_dates']) {
            $apt['available_dates'] = json_decode($apt['available_dates'], true);
        }
    }
    
    echo json_encode(['success' => true, 'appointments' => $appointments]);
}

function handlePost($pdo, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Create new appointment with available dates (Admin action)
    if ($action === 'create' || !$action) {
        $applicationId = $data['application_id'];
        $appointmentType = $data['appointment_type'] ?? 'exam';
        $availableDates = $data['available_dates'] ?? [];
        $location = $data['location'] ?? null;
        $room = $data['room'] ?? null;
        $instructions = $data['instructions'] ?? null;
        $subjects = $data['subjects'] ?? null;
        
        // Validate
        if (!$applicationId) {
            echo json_encode(['success' => false, 'error' => 'Application ID required']);
            return;
        }
        
        if (empty($availableDates)) {
            echo json_encode(['success' => false, 'error' => 'At least one available date is required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO exam_appointments 
            (application_id, appointment_type, available_dates, location, room, instructions, subjects, status, admin_confirmed)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 1)
        ");
        $stmt->execute([
            $applicationId,
            $appointmentType,
            json_encode($availableDates),
            $location,
            $room,
            $instructions,
            $subjects
        ]);
        
        $appointmentId = $pdo->lastInsertId();
        
        // Update application status
        $stmt = $pdo->prepare("UPDATE student_applications SET status = 'exam_required' WHERE id = ?");
        $stmt->execute([$applicationId]);
        
        // Get parent info and send notification
        $stmt = $pdo->prepare("
            SELECT sa.parent_id, sa.first_name, sa.last_name, u.email, u.phone, u.name as parent_name
            FROM student_applications sa
            LEFT JOIN users u ON sa.parent_id = u.id
            WHERE sa.id = ?
        ");
        $stmt->execute([$applicationId]);
        $appInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($appInfo) {
            // Create in-app notification
            $typeLabel = $appointmentType === 'interview' ? 'Interview' : ($appointmentType === 'both' ? 'Exam & Interview' : 'Entrance Exam');
            $dateCount = count($availableDates);
            
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, created_at)
                VALUES (?, ?, ?, 'exam_appointment', NOW())
            ");
            $stmt->execute([
                $appInfo['parent_id'],
                "{$typeLabel} Scheduled",
                "{$typeLabel} is required for {$appInfo['first_name']} {$appInfo['last_name']}. {$dateCount} date(s) available. Please select your preferred date."
            ]);
            
            // Queue email reminder
            if ($appInfo['email']) {
                scheduleReminder($pdo, $appointmentId, 'email', 'parent', $appInfo['parent_id'], $appInfo['email'], new DateTime());
            }
            
            // Queue SMS reminder
            if ($appInfo['phone']) {
                scheduleReminder($pdo, $appointmentId, 'sms', 'parent', $appInfo['parent_id'], $appInfo['phone'], new DateTime());
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Appointment created and parent notified',
            'appointment_id' => $appointmentId
        ]);
        return;
    }
    
    // Parent selects a date
    if ($action === 'select_date') {
        $appointmentId = $data['appointment_id'];
        $selectedDate = $data['selected_date'];
        
        if (!$appointmentId || !$selectedDate) {
            echo json_encode(['success' => false, 'error' => 'Appointment ID and selected date required']);
            return;
        }
        
        $stmt = $pdo->prepare("
            UPDATE exam_appointments 
            SET selected_date = ?, parent_confirmed = 1, status = 'scheduled'
            WHERE id = ?
        ");
        $stmt->execute([$selectedDate, $appointmentId]);
        
        // Get appointment details for notification
        $stmt = $pdo->prepare("
            SELECT ea.*, sa.first_name, sa.last_name, sa.parent_id
            FROM exam_appointments ea
            JOIN student_applications sa ON ea.application_id = sa.id
            WHERE ea.id = ?
        ");
        $stmt->execute([$appointmentId]);
        $apt = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Notify admin
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, created_at)
            SELECT id, ?, ?, 'exam_date_selected', NOW()
            FROM users WHERE role = 'admin' LIMIT 1
        ");
        $formattedDate = date('F j, Y g:i A', strtotime($selectedDate));
        $stmt->execute([
            'Exam Date Selected',
            "Parent has selected {$formattedDate} for {$apt['first_name']} {$apt['last_name']}'s exam. Please confirm."
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Date selected successfully']);
        return;
    }
    
    // Admin confirms the appointment
    if ($action === 'admin_confirm') {
        $appointmentId = $data['appointment_id'];
        
        $stmt = $pdo->prepare("
            UPDATE exam_appointments 
            SET admin_confirmed = 1, 
                status = CASE WHEN parent_confirmed = 1 THEN 'confirmed' ELSE status END,
                confirmed_at = CASE WHEN parent_confirmed = 1 THEN NOW() ELSE confirmed_at END
            WHERE id = ?
        ");
        $stmt->execute([$appointmentId]);
        
        // Check if both confirmed
        $stmt = $pdo->prepare("SELECT * FROM exam_appointments WHERE id = ?");
        $stmt->execute([$appointmentId]);
        $apt = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($apt['admin_confirmed'] && $apt['parent_confirmed']) {
            // Schedule reminders
            scheduleAppointmentReminders($pdo, $appointmentId);
            
            // Notify parent
            $stmt = $pdo->prepare("
                SELECT sa.parent_id, sa.first_name, sa.last_name
                FROM student_applications sa
                JOIN exam_appointments ea ON ea.application_id = sa.id
                WHERE ea.id = ?
            ");
            $stmt->execute([$appointmentId]);
            $appInfo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $formattedDate = date('F j, Y g:i A', strtotime($apt['selected_date']));
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, created_at)
                VALUES (?, ?, ?, 'exam_confirmed', NOW())
            ");
            $stmt->execute([
                $appInfo['parent_id'],
                'Appointment Confirmed',
                "Your appointment for {$appInfo['first_name']} {$appInfo['last_name']} on {$formattedDate} has been confirmed. Location: {$apt['location']}"
            ]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Appointment confirmed']);
        return;
    }
    
    // Parent confirms the appointment
    if ($action === 'parent_confirm') {
        $appointmentId = $data['appointment_id'];
        
        $stmt = $pdo->prepare("
            UPDATE exam_appointments 
            SET parent_confirmed = 1,
                status = CASE WHEN admin_confirmed = 1 THEN 'confirmed' ELSE status END,
                confirmed_at = CASE WHEN admin_confirmed = 1 THEN NOW() ELSE confirmed_at END
            WHERE id = ?
        ");
        $stmt->execute([$appointmentId]);
        
        // Check if both confirmed
        $stmt = $pdo->prepare("SELECT * FROM exam_appointments WHERE id = ?");
        $stmt->execute([$appointmentId]);
        $apt = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($apt['admin_confirmed'] && $apt['parent_confirmed']) {
            scheduleAppointmentReminders($pdo, $appointmentId);
        }
        
        echo json_encode(['success' => true, 'message' => 'Appointment confirmed']);
        return;
    }
    
    // Mark appointment as completed with result
    if ($action === 'complete') {
        $appointmentId = $data['appointment_id'];
        $result = $data['result'] ?? 'pending';
        $score = $data['score'] ?? null;
        $feedback = $data['feedback'] ?? null;
        
        $stmt = $pdo->prepare("
            UPDATE exam_appointments 
            SET status = 'completed', result = ?, score = ?, feedback = ?
            WHERE id = ?
        ");
        $stmt->execute([$result, $score, $feedback, $appointmentId]);
        
        // If passed, update application status
        if ($result === 'passed') {
            $stmt = $pdo->prepare("
                UPDATE student_applications sa
                JOIN exam_appointments ea ON ea.application_id = sa.id
                SET sa.status = 'exam_passed'
                WHERE ea.id = ?
            ");
            $stmt->execute([$appointmentId]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Appointment completed']);
        return;
    }
    
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
}

function handlePut($pdo, $id, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Update available dates
    if ($action === 'update_dates') {
        $stmt = $pdo->prepare("
            UPDATE exam_appointments 
            SET available_dates = ?, location = ?, room = ?, instructions = ?, subjects = ?
            WHERE id = ?
        ");
        $stmt->execute([
            json_encode($data['available_dates'] ?? []),
            $data['location'] ?? null,
            $data['room'] ?? null,
            $data['instructions'] ?? null,
            $data['subjects'] ?? null,
            $id
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Appointment updated']);
        return;
    }
    
    // Cancel appointment
    if ($action === 'cancel') {
        $stmt = $pdo->prepare("UPDATE exam_appointments SET status = 'cancelled' WHERE id = ?");
        $stmt->execute([$id]);
        
        // Cancel pending reminders
        $stmt = $pdo->prepare("UPDATE appointment_reminders SET status = 'cancelled' WHERE appointment_id = ? AND status = 'pending'");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true, 'message' => 'Appointment cancelled']);
        return;
    }
    
    echo json_encode(['success' => false, 'error' => 'Unknown action']);
}

function scheduleReminder($pdo, $appointmentId, $type, $recipientType, $recipientId, $contact, $scheduledFor) {
    $stmt = $pdo->prepare("
        INSERT INTO appointment_reminders 
        (appointment_id, reminder_type, recipient_type, recipient_id, recipient_contact, scheduled_for)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $appointmentId,
        $type,
        $recipientType,
        $recipientId,
        $contact,
        $scheduledFor->format('Y-m-d H:i:s')
    ]);
}

function scheduleAppointmentReminders($pdo, $appointmentId) {
    // Get appointment and parent details
    $stmt = $pdo->prepare("
        SELECT ea.*, sa.parent_id, u.email, u.phone, u.name as parent_name
        FROM exam_appointments ea
        JOIN student_applications sa ON ea.application_id = sa.id
        LEFT JOIN users u ON sa.parent_id = u.id
        WHERE ea.id = ?
    ");
    $stmt->execute([$appointmentId]);
    $apt = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$apt || !$apt['selected_date']) return;
    
    $appointmentDate = new DateTime($apt['selected_date']);
    $now = new DateTime();
    
    // 24 hours before
    $reminder24h = clone $appointmentDate;
    $reminder24h->modify('-24 hours');
    if ($reminder24h > $now) {
        if ($apt['email']) {
            scheduleReminder($pdo, $appointmentId, 'email', 'parent', $apt['parent_id'], $apt['email'], $reminder24h);
        }
        if ($apt['phone']) {
            scheduleReminder($pdo, $appointmentId, 'sms', 'parent', $apt['parent_id'], $apt['phone'], $reminder24h);
        }
    }
    
    // 1 hour before
    $reminder1h = clone $appointmentDate;
    $reminder1h->modify('-1 hour');
    if ($reminder1h > $now) {
        if ($apt['email']) {
            scheduleReminder($pdo, $appointmentId, 'email', 'parent', $apt['parent_id'], $apt['email'], $reminder1h);
        }
        if ($apt['phone']) {
            scheduleReminder($pdo, $appointmentId, 'sms', 'parent', $apt['parent_id'], $apt['phone'], $reminder1h);
        }
    }
    
    // In-app notification
    scheduleReminder($pdo, $appointmentId, 'in_app', 'parent', $apt['parent_id'], null, $reminder24h > $now ? $reminder24h : $now);
}

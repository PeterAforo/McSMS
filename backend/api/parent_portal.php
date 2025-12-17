<?php
/**
 * Parent Portal API
 * Comprehensive API for parent module features
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
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

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create tables if they don't exist
    createTables($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $resource = $_GET['resource'] ?? '';
    $parentId = $_GET['parent_id'] ?? null;

    switch ($method) {
        case 'GET':
            handleGet($pdo, $resource, $parentId);
            break;
        case 'POST':
            handlePost($pdo, $resource);
            break;
        case 'PUT':
            handlePut($pdo, $resource);
            break;
        case 'DELETE':
            handleDelete($pdo, $resource);
            break;
        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function createTables($pdo) {
    // Student Guardians table - uses student_id to link to students table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_guardians (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            parent_id INT NOT NULL,
            relationship ENUM('father', 'mother', 'guardian', 'grandparent', 'step_parent', 'other') NOT NULL,
            is_primary BOOLEAN DEFAULT FALSE,
            can_pickup BOOLEAN DEFAULT TRUE,
            emergency_contact BOOLEAN DEFAULT TRUE,
            receives_notifications BOOLEAN DEFAULT TRUE,
            receives_reports BOOLEAN DEFAULT TRUE,
            receives_fee_alerts BOOLEAN DEFAULT TRUE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_guardian (student_id, parent_id),
            INDEX idx_parent (parent_id),
            INDEX idx_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Family Link Codes table - uses student_id
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS family_link_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            link_code VARCHAR(20) NOT NULL UNIQUE,
            created_by INT NOT NULL,
            expires_at DATETIME NOT NULL,
            used_by INT NULL,
            used_at DATETIME NULL,
            status ENUM('active', 'used', 'expired') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_link_code (link_code),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Meeting Requests table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS meeting_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            parent_id INT NOT NULL,
            teacher_id INT NOT NULL,
            student_id INT NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT,
            preferred_date DATE,
            preferred_time TIME,
            status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
            meeting_date DATE,
            meeting_time TIME,
            meeting_location VARCHAR(255),
            meeting_link VARCHAR(500),
            teacher_notes TEXT,
            parent_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_parent (parent_id),
            INDEX idx_teacher (teacher_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // School Events table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS school_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_type ENUM('holiday', 'exam', 'meeting', 'sports', 'cultural', 'academic', 'other') NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE,
            start_time TIME,
            end_time TIME,
            location VARCHAR(255),
            is_all_day BOOLEAN DEFAULT FALSE,
            target_audience ENUM('all', 'students', 'parents', 'teachers', 'specific_class') DEFAULT 'all',
            target_class_id INT NULL,
            requires_rsvp BOOLEAN DEFAULT FALSE,
            max_attendees INT NULL,
            created_by INT,
            status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_dates (start_date, end_date),
            INDEX idx_type (event_type),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Event RSVPs table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS event_rsvps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            parent_id INT NOT NULL,
            student_id INT,
            response ENUM('attending', 'not_attending', 'maybe') NOT NULL,
            attendee_count INT DEFAULT 1,
            notes TEXT,
            responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_rsvp (event_id, parent_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Report Acknowledgments table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS report_acknowledgments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            parent_id INT NOT NULL,
            academic_term VARCHAR(50) NOT NULL,
            academic_year VARCHAR(20) NOT NULL,
            acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            digital_signature TEXT,
            ip_address VARCHAR(45),
            UNIQUE KEY unique_ack (student_id, parent_id, academic_term, academic_year)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Parent Notification Preferences table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS parent_notification_preferences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            parent_id INT NOT NULL,
            notification_type ENUM('attendance', 'grades', 'homework', 'fees', 'announcements', 'messages', 'events') NOT NULL,
            email_enabled BOOLEAN DEFAULT TRUE,
            push_enabled BOOLEAN DEFAULT TRUE,
            sms_enabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_pref (parent_id, notification_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function handleGet($pdo, $resource, $parentId) {
    switch ($resource) {
        case 'dashboard':
            getDashboard($pdo, $parentId);
            break;
        case 'children':
            getChildren($pdo, $parentId);
            break;
        case 'child_details':
            getChildDetails($pdo, $_GET['child_id'] ?? null);
            break;
        case 'attendance':
            getAttendance($pdo, $_GET['student_id'] ?? null, $_GET['month'] ?? null);
            break;
        case 'grades':
            getGrades($pdo, $_GET['student_id'] ?? null, $_GET['term'] ?? null);
            break;
        case 'homework':
            getHomework($pdo, $_GET['student_id'] ?? null);
            break;
        case 'fees':
            getFees($pdo, $parentId, $_GET['student_id'] ?? null);
            break;
        case 'events':
            getEvents($pdo, $parentId);
            break;
        case 'meetings':
            getMeetings($pdo, $parentId);
            break;
        case 'notifications':
            getNotifications($pdo, $parentId);
            break;
        case 'report_cards':
            getReportCards($pdo, $_GET['student_id'] ?? null);
            break;
        case 'teachers':
            getTeachers($pdo, $_GET['student_id'] ?? null);
            break;
        case 'guardians':
            getGuardians($pdo, $_GET['child_id'] ?? null);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Unknown resource']);
    }
}

function handlePost($pdo, $resource) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($resource) {
        case 'generate_link_code':
            generateLinkCode($pdo, $data);
            break;
        case 'use_link_code':
            useLinkCode($pdo, $data);
            break;
        case 'request_meeting':
            requestMeeting($pdo, $data);
            break;
        case 'rsvp':
            submitRsvp($pdo, $data);
            break;
        case 'acknowledge_report':
            acknowledgeReport($pdo, $data);
            break;
        case 'send_message':
            sendMessage($pdo, $data);
            break;
        case 'update_preferences':
            updatePreferences($pdo, $data);
            break;
        case 'add_guardian':
            addGuardian($pdo, $data);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Unknown resource']);
    }
}

function handlePut($pdo, $resource) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($resource) {
        case 'meeting':
            updateMeeting($pdo, $data);
            break;
        case 'guardian':
            updateGuardian($pdo, $data);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Unknown resource']);
    }
}

function handleDelete($pdo, $resource) {
    $id = $_GET['id'] ?? null;
    
    switch ($resource) {
        case 'meeting':
            cancelMeeting($pdo, $id);
            break;
        case 'guardian':
            removeGuardian($pdo, $id);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Unknown resource']);
    }
}

// ==================== DASHBOARD ====================

function getDashboard($pdo, $parentId) {
    if (!$parentId) {
        echo json_encode(['success' => false, 'error' => 'Parent ID required']);
        return;
    }

    $dashboard = [
        'children' => [],
        'upcoming_events' => [],
        'recent_notifications' => [],
        'pending_fees' => 0,
        'unread_messages' => 0,
        'upcoming_homework' => 0,
        'attendance_summary' => []
    ];

    try {
        // First, check if parentId is a user_id and get the actual parent_id
        $stmt = $pdo->prepare("SELECT id FROM parents WHERE user_id = ?");
        $stmt->execute([$parentId]);
        $parent = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Use the actual parent_id if found, otherwise use the provided ID
        $actualParentId = $parent ? $parent['id'] : $parentId;

        // Get children - students table has parent_id directly
        $stmt = $pdo->prepare("
            SELECT s.id as child_id, 
                   CONCAT(s.first_name, ' ', s.last_name) as full_name, 
                   s.gender, s.date_of_birth, s.photo,
                   s.id as student_id, s.student_id as admission_no, s.status as student_status,
                   s.class_id, cl.class_name, NULL as section_name,
                   'guardian' as relationship, 1 as is_primary,
                   (SELECT COUNT(*) FROM student_guardians WHERE student_id = s.id) as guardian_count
            FROM students s
            LEFT JOIN classes cl ON s.class_id = cl.id
            WHERE s.parent_id = ?
            ORDER BY s.first_name
        ");
        $stmt->execute([$actualParentId]);
        $dashboard['children'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get upcoming events (next 30 days)
        $stmt = $pdo->prepare("
            SELECT id, title, event_type, start_date, start_time, location, requires_rsvp
            FROM school_events
            WHERE start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND status = 'upcoming'
            AND (target_audience = 'all' OR target_audience = 'parents')
            ORDER BY start_date, start_time
            LIMIT 5
        ");
        $stmt->execute();
        $dashboard['upcoming_events'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get recent notifications
        try {
            $stmt = $pdo->prepare("
                SELECT id, title, message, type, is_read, created_at
                FROM notifications
                WHERE user_id = (SELECT user_id FROM parents WHERE id = ?)
                ORDER BY created_at DESC
                LIMIT 5
            ");
            $stmt->execute([$actualParentId]);
            $dashboard['recent_notifications'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $dashboard['recent_notifications'] = [];
        }

        // Get pending fees total
        try {
            $stmt = $pdo->prepare("
                SELECT COALESCE(SUM(i.amount - COALESCE(i.paid_amount, 0)), 0) as pending
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                WHERE s.parent_id = ? AND i.status != 'paid'
            ");
            $stmt->execute([$actualParentId]);
            $dashboard['pending_fees'] = $stmt->fetch(PDO::FETCH_ASSOC)['pending'] ?? 0;
        } catch (Exception $e) {
            $dashboard['pending_fees'] = 0;
        }

        // Get unread messages count
        try {
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count FROM messages
                WHERE recipient_id = (SELECT user_id FROM parents WHERE id = ?)
                AND is_read = 0
            ");
            $stmt->execute([$actualParentId]);
            $dashboard['unread_messages'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;
        } catch (Exception $e) {
            $dashboard['unread_messages'] = 0;
        }

        // Get upcoming homework count
        try {
            $studentIds = array_column(array_filter($dashboard['children'], fn($c) => $c['student_id']), 'student_id');
            if (!empty($studentIds)) {
                $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as count FROM homework h
                    LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id IN ($placeholders)
                    WHERE h.class_id IN (SELECT class_id FROM students WHERE id IN ($placeholders))
                    AND h.due_date >= CURDATE()
                    AND (hs.id IS NULL OR hs.status = 'pending')
                ");
                $stmt->execute(array_merge($studentIds, $studentIds));
                $dashboard['upcoming_homework'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;
            }
        } catch (Exception $e) {
            $dashboard['upcoming_homework'] = 0;
        }

        // Get attendance summary for current month
        try {
            $studentIds = array_column(array_filter($dashboard['children'], fn($c) => $c['student_id']), 'student_id');
            if (!empty($studentIds)) {
                $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
                        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
                        COUNT(*) as total
                    FROM attendance
                    WHERE student_id IN ($placeholders)
                    AND MONTH(date) = MONTH(CURDATE())
                    AND YEAR(date) = YEAR(CURDATE())
                ");
                $stmt->execute($studentIds);
                $dashboard['attendance_summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
            }
        } catch (Exception $e) {
            $dashboard['attendance_summary'] = ['present' => 0, 'absent' => 0, 'late' => 0, 'total' => 0];
        }

        echo json_encode(['success' => true, 'dashboard' => $dashboard]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== CHILDREN ====================

function getChildren($pdo, $parentId) {
    if (!$parentId) {
        echo json_encode(['success' => false, 'error' => 'Parent ID required']);
        return;
    }

    try {
        // First, check if parentId is a user_id and get the actual parent_id
        $stmt = $pdo->prepare("SELECT id FROM parents WHERE user_id = ?");
        $stmt->execute([$parentId]);
        $parent = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Use the actual parent_id if found, otherwise use the provided ID
        $actualParentId = $parent ? $parent['id'] : $parentId;

        // Students table has parent_id directly
        $stmt = $pdo->prepare("
            SELECT s.id as child_id, 
                   CONCAT(s.first_name, ' ', s.last_name) as full_name, 
                   s.gender, s.date_of_birth, s.photo, s.previous_school,
                   s.id as student_id, s.student_id as admission_no, s.admission_date as enrollment_date, s.status as student_status,
                   s.class_id, cl.class_name, NULL as section_name,
                   'guardian' as relationship, 1 as is_primary, 1 as can_pickup, 1 as emergency_contact,
                   (SELECT COUNT(*) FROM student_guardians WHERE student_id = s.id) as guardian_count
            FROM students s
            LEFT JOIN classes cl ON s.class_id = cl.id
            WHERE s.parent_id = ?
            ORDER BY s.first_name
        ");
        $stmt->execute([$actualParentId]);
        $children = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'children' => $children]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function getChildDetails($pdo, $childId) {
    if (!$childId) {
        echo json_encode(['success' => false, 'error' => 'Child ID required']);
        return;
    }

    try {
        // Get student info (childId is actually student_id in production schema)
        $stmt = $pdo->prepare("
            SELECT s.id, s.id as student_id, s.student_id as admission_no, 
                   CONCAT(s.first_name, ' ', s.last_name) as full_name,
                   s.first_name, s.last_name, s.gender, s.date_of_birth, s.photo,
                   s.admission_date as enrollment_date, s.status, s.previous_school,
                   s.email, s.phone, s.address,
                   cl.id as class_id, cl.class_name, NULL as section_name, 
                   t.id as class_teacher_id,
                   CONCAT(u.first_name, ' ', u.last_name) as class_teacher_name
            FROM students s
            LEFT JOIN classes cl ON s.class_id = cl.id
            LEFT JOIN teachers t ON cl.class_teacher_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE s.id = ?
        ");
        $stmt->execute([$childId]);
        $child = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$child) {
            echo json_encode(['success' => false, 'error' => 'Child not found']);
            return;
        }

        // Get guardians from student_guardians table
        try {
            $stmt = $pdo->prepare("
                SELECT sg.*, p.id as parent_id, u.first_name, u.last_name, u.email, u.phone
                FROM student_guardians sg
                JOIN parents p ON sg.parent_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE sg.student_id = ?
            ");
            $stmt->execute([$childId]);
            $child['guardians'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $child['guardians'] = [];
        }

        // Get recent grades if student
        if ($child['student_id']) {
            try {
                $stmt = $pdo->prepare("
                    SELECT g.*, a.title as assessment_title, a.type as assessment_type, 
                           sub.subject_name, a.max_score
                    FROM grades g
                    JOIN assessments a ON g.assessment_id = a.id
                    LEFT JOIN subjects sub ON a.subject_id = sub.id
                    WHERE g.student_id = ?
                    ORDER BY a.date DESC
                    LIMIT 10
                ");
                $stmt->execute([$child['student_id']]);
                $child['recent_grades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $child['recent_grades'] = [];
            }

            // Get attendance stats
            try {
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
                        COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
                        COUNT(*) as total
                    FROM attendance
                    WHERE student_id = ?
                    AND YEAR(date) = YEAR(CURDATE())
                ");
                $stmt->execute([$child['student_id']]);
                $child['attendance_stats'] = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $child['attendance_stats'] = null;
            }
        }

        echo json_encode(['success' => true, 'child' => $child]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== ATTENDANCE ====================

function getAttendance($pdo, $studentId, $month = null) {
    if (!$studentId) {
        echo json_encode(['success' => false, 'error' => 'Student ID required']);
        return;
    }

    try {
        $month = $month ?? date('Y-m');
        $startDate = $month . '-01';
        $endDate = date('Y-m-t', strtotime($startDate));

        $stmt = $pdo->prepare("
            SELECT id, date, status, check_in_time, check_out_time, remarks
            FROM attendance
            WHERE student_id = ?
            AND date BETWEEN ? AND ?
            ORDER BY date
        ");
        $stmt->execute([$studentId, $startDate, $endDate]);
        $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get summary
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
                COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
                COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused,
                COUNT(*) as total
            FROM attendance
            WHERE student_id = ?
            AND date BETWEEN ? AND ?
        ");
        $stmt->execute([$studentId, $startDate, $endDate]);
        $summary = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'attendance' => $attendance,
            'summary' => $summary,
            'month' => $month
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== GRADES ====================

function getGrades($pdo, $studentId, $term = null) {
    if (!$studentId) {
        echo json_encode(['success' => false, 'error' => 'Student ID required']);
        return;
    }

    try {
        $query = "
            SELECT g.*, a.title as assessment_title, a.type as assessment_type, 
                   a.date as assessment_date, a.max_score, a.weight,
                   sub.subject_name, sub.subject_code,
                   CONCAT(u.first_name, ' ', u.last_name) as teacher_name
            FROM grades g
            JOIN assessments a ON g.assessment_id = a.id
            LEFT JOIN subjects sub ON a.subject_id = sub.id
            LEFT JOIN teachers t ON a.teacher_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE g.student_id = ?
        ";
        
        $params = [$studentId];
        
        if ($term) {
            $query .= " AND a.term = ?";
            $params[] = $term;
        }
        
        $query .= " ORDER BY a.date DESC, sub.subject_name";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate subject averages
        $subjectAverages = [];
        foreach ($grades as $grade) {
            $subject = $grade['subject_name'] ?? 'Unknown';
            if (!isset($subjectAverages[$subject])) {
                $subjectAverages[$subject] = ['total' => 0, 'max' => 0, 'count' => 0];
            }
            $subjectAverages[$subject]['total'] += $grade['score'];
            $subjectAverages[$subject]['max'] += $grade['max_score'];
            $subjectAverages[$subject]['count']++;
        }

        $averages = [];
        foreach ($subjectAverages as $subject => $data) {
            $averages[] = [
                'subject' => $subject,
                'average' => $data['max'] > 0 ? round(($data['total'] / $data['max']) * 100, 1) : 0,
                'assessments' => $data['count']
            ];
        }

        echo json_encode([
            'success' => true,
            'grades' => $grades,
            'subject_averages' => $averages
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== HOMEWORK ====================

function getHomework($pdo, $studentId) {
    if (!$studentId) {
        echo json_encode(['success' => false, 'error' => 'Student ID required']);
        return;
    }

    try {
        // Get student's class
        $stmt = $pdo->prepare("SELECT id, class_id, first_name, last_name FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$student) {
            echo json_encode(['success' => false, 'error' => 'Student not found', 'student_id_searched' => $studentId]);
            return;
        }

        if (!$student['class_id']) {
            echo json_encode([
                'success' => true, 
                'homework' => [], 
                'categorized' => ['pending' => [], 'submitted' => [], 'overdue' => [], 'graded' => []],
                'debug' => ['message' => 'Student has no class assigned', 'student' => $student]
            ]);
            return;
        }

        $stmt = $pdo->prepare("
            SELECT h.*, sub.subject_name, sub.subject_code,
                   CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
                   hs.id as submission_id, hs.status as submission_status, 
                   hs.submitted_at, hs.grade, hs.feedback
            FROM homework h
            LEFT JOIN subjects sub ON h.subject_id = sub.id
            LEFT JOIN teachers t ON h.teacher_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_id = ?
            WHERE h.class_id = ?
            ORDER BY h.due_date DESC
        ");
        $stmt->execute([$studentId, $student['class_id']]);
        $homework = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Categorize homework
        $pending = [];
        $submitted = [];
        $overdue = [];
        $graded = [];

        foreach ($homework as $hw) {
            if ($hw['submission_status'] === 'graded') {
                $graded[] = $hw;
            } elseif ($hw['submission_status'] === 'submitted') {
                $submitted[] = $hw;
            } elseif (strtotime($hw['due_date']) < time() && !$hw['submission_id']) {
                $overdue[] = $hw;
            } else {
                $pending[] = $hw;
            }
        }

        echo json_encode([
            'success' => true,
            'homework' => $homework,
            'categorized' => [
                'pending' => $pending,
                'submitted' => $submitted,
                'overdue' => $overdue,
                'graded' => $graded
            ],
            'debug' => [
                'student_id' => $studentId,
                'class_id' => $student['class_id'],
                'student_name' => $student['first_name'] . ' ' . $student['last_name'],
                'homework_count' => count($homework)
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== FEES ====================

function getFees($pdo, $parentId, $studentId = null) {
    try {
        $query = "
            SELECT i.*, s.student_id as admission_no, 
                   CONCAT(s.first_name, ' ', s.last_name) as student_name,
                   ft.name as fee_type_name
            FROM invoices i
            JOIN students s ON i.student_id = s.id
            LEFT JOIN fee_types ft ON i.fee_type_id = ft.id
            WHERE s.parent_id = ?
        ";
        
        $params = [$parentId];
        
        if ($studentId) {
            $query .= " AND s.id = ?";
            $params[] = $studentId;
        }
        
        $query .= " ORDER BY i.due_date DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate totals
        $totalDue = 0;
        $totalPaid = 0;
        $totalPending = 0;

        foreach ($invoices as $invoice) {
            $totalDue += $invoice['amount'];
            $totalPaid += $invoice['paid_amount'] ?? 0;
            if ($invoice['status'] !== 'paid') {
                $totalPending += ($invoice['amount'] - ($invoice['paid_amount'] ?? 0));
            }
        }

        // Get payment history
        try {
            $stmt = $pdo->prepare("
                SELECT p.*, i.invoice_number, CONCAT(s.first_name, ' ', s.last_name) as student_name
                FROM payments p
                JOIN invoices i ON p.invoice_id = i.id
                JOIN students s ON i.student_id = s.id
                WHERE s.parent_id = ?
                ORDER BY p.payment_date DESC
                LIMIT 20
            ");
            $stmt->execute([$parentId]);
            $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $payments = [];
        }

        echo json_encode([
            'success' => true,
            'invoices' => $invoices,
            'payments' => $payments,
            'summary' => [
                'total_due' => $totalDue,
                'total_paid' => $totalPaid,
                'total_pending' => $totalPending
            ]
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== EVENTS ====================

function getEvents($pdo, $parentId) {
    try {
        $stmt = $pdo->prepare("
            SELECT e.*, 
                   (SELECT response FROM event_rsvps WHERE event_id = e.id AND parent_id = ?) as my_rsvp,
                   (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND response = 'attending') as attending_count
            FROM school_events e
            WHERE (e.target_audience = 'all' OR e.target_audience = 'parents')
            AND e.start_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            ORDER BY e.start_date, e.start_time
        ");
        $stmt->execute([$parentId]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'events' => $events]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== MEETINGS ====================

function getMeetings($pdo, $parentId) {
    try {
        $stmt = $pdo->prepare("
            SELECT mr.*, 
                   CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
                   CONCAT(s.first_name, ' ', s.last_name) as student_name
            FROM meeting_requests mr
            JOIN teachers t ON mr.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
            JOIN students s ON mr.student_id = s.id
            WHERE mr.parent_id = ?
            ORDER BY mr.created_at DESC
        ");
        $stmt->execute([$parentId]);
        $meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'meetings' => $meetings]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function requestMeeting($pdo, $data) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO meeting_requests (parent_id, teacher_id, student_id, subject, message, preferred_date, preferred_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['parent_id'],
            $data['teacher_id'],
            $data['student_id'],
            $data['subject'],
            $data['message'] ?? null,
            $data['preferred_date'] ?? null,
            $data['preferred_time'] ?? null
        ]);

        echo json_encode(['success' => true, 'meeting_id' => $pdo->lastInsertId()]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function updateMeeting($pdo, $data) {
    try {
        $stmt = $pdo->prepare("
            UPDATE meeting_requests 
            SET status = ?, parent_notes = ?
            WHERE id = ? AND parent_id = ?
        ");
        $stmt->execute([
            $data['status'],
            $data['parent_notes'] ?? null,
            $data['id'],
            $data['parent_id']
        ]);

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function cancelMeeting($pdo, $id) {
    try {
        $stmt = $pdo->prepare("UPDATE meeting_requests SET status = 'cancelled' WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== NOTIFICATIONS ====================

function getNotifications($pdo, $parentId) {
    try {
        $stmt = $pdo->prepare("
            SELECT n.* FROM notifications n
            JOIN parents p ON n.user_id = p.user_id
            WHERE p.id = ?
            ORDER BY n.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$parentId]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'notifications' => $notifications]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== REPORT CARDS ====================

function getReportCards($pdo, $studentId) {
    if (!$studentId) {
        echo json_encode(['success' => false, 'error' => 'Student ID required']);
        return;
    }

    try {
        // Get available terms with grades
        $stmt = $pdo->prepare("
            SELECT DISTINCT a.term, a.academic_year,
                   (SELECT acknowledged_at FROM report_acknowledgments 
                    WHERE student_id = ? AND academic_term = a.term AND academic_year = a.academic_year
                    LIMIT 1) as acknowledged_at
            FROM assessments a
            JOIN grades g ON a.id = g.assessment_id
            WHERE g.student_id = ?
            ORDER BY a.academic_year DESC, a.term DESC
        ");
        $stmt->execute([$studentId, $studentId]);
        $terms = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'report_cards' => $terms]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function acknowledgeReport($pdo, $data) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO report_acknowledgments (student_id, parent_id, academic_term, academic_year, digital_signature, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE acknowledged_at = CURRENT_TIMESTAMP, digital_signature = VALUES(digital_signature)
        ");
        $stmt->execute([
            $data['student_id'],
            $data['parent_id'],
            $data['term'],
            $data['academic_year'],
            $data['signature'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== TEACHERS ====================

function getTeachers($pdo, $studentId) {
    if (!$studentId) {
        echo json_encode(['success' => false, 'error' => 'Student ID required']);
        return;
    }

    try {
        // Get class teacher and subject teachers
        $stmt = $pdo->prepare("
            SELECT DISTINCT t.id, CONCAT(u.first_name, ' ', u.last_name) as name, 
                   u.email, u.phone, u.profile_picture,
                   CASE WHEN cl.class_teacher_id = t.id THEN 'Class Teacher' ELSE sub.subject_name END as role
            FROM students s
            JOIN classes cl ON s.class_id = cl.id
            LEFT JOIN teachers t ON cl.class_teacher_id = t.id OR t.id IN (
                SELECT DISTINCT teacher_id FROM class_subjects WHERE class_id = s.class_id
            )
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN class_subjects cs ON cs.teacher_id = t.id AND cs.class_id = s.class_id
            LEFT JOIN subjects sub ON cs.subject_id = sub.id
            WHERE s.id = ? AND t.id IS NOT NULL
        ");
        $stmt->execute([$studentId]);
        $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'teachers' => $teachers]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== GUARDIANS ====================

function getGuardians($pdo, $childId) {
    if (!$childId) {
        echo json_encode(['success' => false, 'error' => 'Child ID required']);
        return;
    }

    try {
        // childId is actually student_id in production schema
        $stmt = $pdo->prepare("
            SELECT sg.*, u.first_name, u.last_name, u.email, u.phone
            FROM student_guardians sg
            JOIN parents p ON sg.parent_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE sg.student_id = ?
            ORDER BY sg.is_primary DESC, sg.created_at
        ");
        $stmt->execute([$childId]);
        $guardians = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'guardians' => $guardians]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function addGuardian($pdo, $data) {
    try {
        // Use student_id instead of child_id for production schema
        $stmt = $pdo->prepare("
            INSERT INTO student_guardians (student_id, parent_id, relationship, is_primary, can_pickup, emergency_contact, receives_notifications, receives_reports, receives_fee_alerts, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['child_id'] ?? $data['student_id'],
            $data['parent_id'],
            $data['relationship'],
            $data['is_primary'] ?? false,
            $data['can_pickup'] ?? true,
            $data['emergency_contact'] ?? true,
            $data['receives_notifications'] ?? true,
            $data['receives_reports'] ?? true,
            $data['receives_fee_alerts'] ?? true,
            $data['notes'] ?? null
        ]);

        echo json_encode(['success' => true, 'guardian_id' => $pdo->lastInsertId()]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function updateGuardian($pdo, $data) {
    try {
        $stmt = $pdo->prepare("
            UPDATE student_guardians 
            SET relationship = ?, is_primary = ?, can_pickup = ?, emergency_contact = ?, 
                receives_notifications = ?, receives_reports = ?, receives_fee_alerts = ?, notes = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['relationship'],
            $data['is_primary'] ?? false,
            $data['can_pickup'] ?? true,
            $data['emergency_contact'] ?? true,
            $data['receives_notifications'] ?? true,
            $data['receives_reports'] ?? true,
            $data['receives_fee_alerts'] ?? true,
            $data['notes'] ?? null,
            $data['id']
        ]);

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function removeGuardian($pdo, $id) {
    try {
        // Check if this is the only guardian
        $stmt = $pdo->prepare("
            SELECT student_id, (SELECT COUNT(*) FROM student_guardians WHERE student_id = sg.student_id) as count
            FROM student_guardians sg WHERE id = ?
        ");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result && $result['count'] <= 1) {
            echo json_encode(['success' => false, 'error' => 'Cannot remove the only guardian']);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM student_guardians WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== LINK CODES ====================

function generateLinkCode($pdo, $data) {
    try {
        // Generate unique code like FAM-XXXXXX
        $code = 'FAM-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
        
        // Expires in 7 days
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

        $stmt = $pdo->prepare("
            INSERT INTO family_link_codes (child_id, link_code, created_by, expires_at, status)
            VALUES (?, ?, ?, ?, 'active')
        ");
        $stmt->execute([
            $data['child_id'] ?? $data['student_id'],
            $code,
            $data['parent_id'],
            $expiresAt
        ]);

        echo json_encode([
            'success' => true, 
            'link_code' => $code,
            'expires_at' => $expiresAt
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function useLinkCode($pdo, $data) {
    try {
        // Find valid link code
        $stmt = $pdo->prepare("
            SELECT * FROM family_link_codes 
            WHERE link_code = ? AND status = 'active' AND expires_at > NOW()
        ");
        $stmt->execute([$data['link_code']]);
        $linkCode = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$linkCode) {
            echo json_encode(['success' => false, 'error' => 'Invalid or expired link code']);
            return;
        }

        // Check if parent is already linked
        $stmt = $pdo->prepare("
            SELECT id FROM student_guardians WHERE student_id = ? AND parent_id = ?
        ");
        $stmt->execute([$linkCode['student_id'], $data['parent_id']]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'You are already linked to this child']);
            return;
        }

        // Add guardian link
        $stmt = $pdo->prepare("
            INSERT INTO student_guardians (student_id, parent_id, relationship, is_primary, can_pickup, emergency_contact, receives_notifications, receives_reports, receives_fee_alerts)
            VALUES (?, ?, ?, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE)
        ");
        $stmt->execute([
            $linkCode['student_id'],
            $data['parent_id'],
            $data['relationship'] ?? 'guardian'
        ]);

        // Mark code as used
        $stmt = $pdo->prepare("
            UPDATE family_link_codes SET status = 'used', used_by = ?, used_at = NOW() WHERE id = ?
        ");
        $stmt->execute([$data['parent_id'], $linkCode['id']]);

        // Get student info
        $stmt = $pdo->prepare("SELECT CONCAT(first_name, ' ', last_name) as full_name FROM students WHERE id = ?");
        $stmt->execute([$linkCode['student_id']]);
        $child = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true, 
            'message' => "Successfully linked to {$child['full_name']}",
            'child_id' => $linkCode['student_id']
        ]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== MESSAGES ====================

function sendMessage($pdo, $data) {
    try {
        // Get parent's user_id
        $stmt = $pdo->prepare("SELECT user_id FROM parents WHERE id = ?");
        $stmt->execute([$data['parent_id']]);
        $parent = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get teacher's user_id
        $stmt = $pdo->prepare("SELECT user_id FROM teachers WHERE id = ?");
        $stmt->execute([$data['teacher_id']]);
        $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$parent || !$teacher) {
            echo json_encode(['success' => false, 'error' => 'Invalid parent or teacher']);
            return;
        }

        $stmt = $pdo->prepare("
            INSERT INTO messages (sender_id, recipient_id, subject, message, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $parent['user_id'],
            $teacher['user_id'],
            $data['subject'],
            $data['message']
        ]);

        echo json_encode(['success' => true, 'message_id' => $pdo->lastInsertId()]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== PREFERENCES ====================

function updatePreferences($pdo, $data) {
    try {
        foreach ($data['preferences'] as $pref) {
            $stmt = $pdo->prepare("
                INSERT INTO parent_notification_preferences (parent_id, notification_type, email_enabled, push_enabled, sms_enabled)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE email_enabled = VALUES(email_enabled), push_enabled = VALUES(push_enabled), sms_enabled = VALUES(sms_enabled)
            ");
            $stmt->execute([
                $data['parent_id'],
                $pref['type'],
                $pref['email'] ?? true,
                $pref['push'] ?? true,
                $pref['sms'] ?? false
            ]);
        }

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// ==================== RSVP ====================

function submitRsvp($pdo, $data) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO event_rsvps (event_id, parent_id, student_id, response, attendee_count, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE response = VALUES(response), attendee_count = VALUES(attendee_count), notes = VALUES(notes), responded_at = NOW()
        ");
        $stmt->execute([
            $data['event_id'],
            $data['parent_id'],
            $data['student_id'] ?? null,
            $data['response'],
            $data['attendee_count'] ?? 1,
            $data['notes'] ?? null
        ]);

        echo json_encode(['success' => true]);

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

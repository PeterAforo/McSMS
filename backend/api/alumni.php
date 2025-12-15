<?php
/**
 * Alumni Management API
 * Graduate tracking, networking, events, donations
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create necessary tables
    createAlumniTables($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'list';
    $id = $_GET['id'] ?? null;

    switch ($action) {
        // ============================================
        // ALUMNI PROFILES
        // ============================================
        case 'alumni':
        case 'list':
            handleAlumni($pdo, $method, $id);
            break;
            
        case 'register':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(registerAlumni($pdo, $data));
            break;
            
        case 'verify':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(verifyAlumni($pdo, $data['alumni_id'], $data['status']));
            break;
            
        case 'search':
            $query = $_GET['q'] ?? '';
            $graduationYear = $_GET['year'] ?? null;
            echo json_encode(searchAlumni($pdo, $query, $graduationYear));
            break;
            
        case 'profile':
            $alumniId = $_GET['alumni_id'] ?? $id;
            echo json_encode(getAlumniProfile($pdo, $alumniId));
            break;

        // ============================================
        // CAREER TRACKING
        // ============================================
        case 'careers':
            handleCareers($pdo, $method, $id);
            break;
            
        case 'add_career':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(addCareerHistory($pdo, $data));
            break;
            
        case 'career_stats':
            echo json_encode(getCareerStatistics($pdo));
            break;

        // ============================================
        // NETWORKING
        // ============================================
        case 'directory':
            $filters = [
                'industry' => $_GET['industry'] ?? null,
                'location' => $_GET['location'] ?? null,
                'year' => $_GET['year'] ?? null
            ];
            echo json_encode(getAlumniDirectory($pdo, $filters));
            break;
            
        case 'connect':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(connectAlumni($pdo, $data));
            break;
            
        case 'connections':
            $alumniId = $_GET['alumni_id'] ?? null;
            echo json_encode(getConnections($pdo, $alumniId));
            break;
            
        case 'mentorship':
            handleMentorship($pdo, $method, $id);
            break;

        // ============================================
        // EVENTS
        // ============================================
        case 'events':
            handleEvents($pdo, $method, $id);
            break;
            
        case 'create_event':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(createEvent($pdo, $data));
            break;
            
        case 'register_event':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(registerForEvent($pdo, $data));
            break;
            
        case 'event_attendees':
            $eventId = $_GET['event_id'] ?? null;
            echo json_encode(getEventAttendees($pdo, $eventId));
            break;

        // ============================================
        // DONATIONS
        // ============================================
        case 'donations':
            handleDonations($pdo, $method, $id);
            break;
            
        case 'make_donation':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(makeDonation($pdo, $data));
            break;
            
        case 'campaigns':
            handleCampaigns($pdo, $method, $id);
            break;
            
        case 'donation_stats':
            echo json_encode(getDonationStatistics($pdo));
            break;

        // ============================================
        // ACHIEVEMENTS & NEWS
        // ============================================
        case 'achievements':
            handleAchievements($pdo, $method, $id);
            break;
            
        case 'news':
            handleNews($pdo, $method, $id);
            break;
            
        case 'success_stories':
            echo json_encode(getSuccessStories($pdo));
            break;

        // ============================================
        // DASHBOARD & REPORTS
        // ============================================
        case 'dashboard':
            echo json_encode(getAlumniDashboard($pdo));
            break;
            
        case 'statistics':
            echo json_encode(getAlumniStatistics($pdo));
            break;
            
        case 'graduation_years':
            echo json_encode(getGraduationYears($pdo));
            break;

        default:
            echo json_encode(['error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

// ============================================
// TABLE CREATION
// ============================================
function createAlumniTables($pdo) {
    // Alumni profiles
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS alumni (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE,
            phone VARCHAR(20),
            photo VARCHAR(500),
            graduation_year INT NOT NULL,
            class_name VARCHAR(100),
            degree VARCHAR(100),
            current_occupation VARCHAR(255),
            current_company VARCHAR(255),
            industry VARCHAR(100),
            location_city VARCHAR(100),
            location_country VARCHAR(100),
            linkedin_url VARCHAR(500),
            bio TEXT,
            is_verified TINYINT(1) DEFAULT 0,
            is_mentor TINYINT(1) DEFAULT 0,
            visibility ENUM('public', 'alumni_only', 'private') DEFAULT 'alumni_only',
            last_login DATETIME,
            status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_graduation_year (graduation_year),
            INDEX idx_industry (industry),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Career history
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS alumni_careers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            alumni_id INT NOT NULL,
            company_name VARCHAR(255) NOT NULL,
            position VARCHAR(255) NOT NULL,
            industry VARCHAR(100),
            location VARCHAR(255),
            start_date DATE,
            end_date DATE,
            is_current TINYINT(1) DEFAULT 0,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_alumni_id (alumni_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Alumni connections
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS alumni_connections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            requester_id INT NOT NULL,
            receiver_id INT NOT NULL,
            status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_connection (requester_id, receiver_id),
            INDEX idx_requester (requester_id),
            INDEX idx_receiver (receiver_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Mentorship
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS alumni_mentorship (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mentor_id INT NOT NULL,
            mentee_id INT,
            mentee_type ENUM('alumni', 'student') NOT NULL,
            mentee_student_id INT,
            expertise_areas TEXT,
            status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
            start_date DATE,
            end_date DATE,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_mentor (mentor_id),
            INDEX idx_mentee (mentee_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Alumni events
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS alumni_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_type ENUM('reunion', 'networking', 'workshop', 'seminar', 'fundraiser', 'other') DEFAULT 'other',
            event_date DATETIME NOT NULL,
            end_date DATETIME,
            location VARCHAR(500),
            is_virtual TINYINT(1) DEFAULT 0,
            virtual_link VARCHAR(500),
            max_attendees INT,
            registration_fee DECIMAL(10,2) DEFAULT 0,
            organizer_id INT,
            cover_image VARCHAR(500),
            status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_event_date (event_date),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Event registrations
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS alumni_event_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            alumni_id INT NOT NULL,
            registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            attendance_status ENUM('registered', 'attended', 'no_show', 'cancelled') DEFAULT 'registered',
            payment_status ENUM('pending', 'paid', 'waived') DEFAULT 'pending',
            notes TEXT,
            UNIQUE KEY unique_registration (event_id, alumni_id),
            INDEX idx_event_id (event_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Donation campaigns
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS donation_campaigns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            goal_amount DECIMAL(12,2) NOT NULL,
            raised_amount DECIMAL(12,2) DEFAULT 0,
            start_date DATE NOT NULL,
            end_date DATE,
            campaign_type ENUM('scholarship', 'infrastructure', 'equipment', 'general', 'emergency') DEFAULT 'general',
            cover_image VARCHAR(500),
            status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Donations
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS alumni_donations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            alumni_id INT,
            donor_name VARCHAR(255),
            donor_email VARCHAR(255),
            campaign_id INT,
            amount DECIMAL(12,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'GHS',
            payment_method VARCHAR(50),
            payment_reference VARCHAR(100),
            is_anonymous TINYINT(1) DEFAULT 0,
            is_recurring TINYINT(1) DEFAULT 0,
            recurring_frequency ENUM('monthly', 'quarterly', 'yearly'),
            message TEXT,
            receipt_sent TINYINT(1) DEFAULT 0,
            status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_alumni_id (alumni_id),
            INDEX idx_campaign_id (campaign_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Alumni achievements
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS alumni_achievements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            alumni_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            achievement_type ENUM('award', 'publication', 'certification', 'promotion', 'other') DEFAULT 'other',
            achievement_date DATE,
            is_featured TINYINT(1) DEFAULT 0,
            verified TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_alumni_id (alumni_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Alumni news
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS alumni_news (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            cover_image VARCHAR(500),
            author_id INT,
            category ENUM('announcement', 'success_story', 'event', 'general') DEFAULT 'general',
            is_featured TINYINT(1) DEFAULT 0,
            views INT DEFAULT 0,
            status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
            published_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

// ============================================
// ALUMNI PROFILE FUNCTIONS
// ============================================
function handleAlumni($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM alumni WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'alumni' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $status = $_GET['status'] ?? 'active';
                $year = $_GET['year'] ?? null;
                $limit = min((int)($_GET['limit'] ?? 50), 100);
                
                $sql = "SELECT * FROM alumni WHERE status = ?";
                $params = [$status];
                
                if ($year) {
                    $sql .= " AND graduation_year = ?";
                    $params[] = $year;
                }
                
                $sql .= " ORDER BY graduation_year DESC, last_name LIMIT $limit";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'alumni' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                UPDATE alumni SET
                    current_occupation = ?, current_company = ?, industry = ?,
                    location_city = ?, location_country = ?, linkedin_url = ?,
                    bio = ?, visibility = ?, is_mentor = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['current_occupation'] ?? null,
                $data['current_company'] ?? null,
                $data['industry'] ?? null,
                $data['location_city'] ?? null,
                $data['location_country'] ?? null,
                $data['linkedin_url'] ?? null,
                $data['bio'] ?? null,
                $data['visibility'] ?? 'alumni_only',
                $data['is_mentor'] ?? 0,
                $id
            ]);
            echo json_encode(['success' => true]);
            break;
    }
}

function registerAlumni($pdo, $data) {
    // Check if email exists
    $stmt = $pdo->prepare("SELECT id FROM alumni WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        return ['success' => false, 'error' => 'Email already registered'];
    }
    
    // Check if student exists
    $studentId = null;
    if (!empty($data['admission_number'])) {
        $stmt = $pdo->prepare("SELECT id FROM students WHERE admission_number = ?");
        $stmt->execute([$data['admission_number']]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($student) {
            $studentId = $student['id'];
        }
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO alumni 
        (student_id, first_name, last_name, email, phone, graduation_year, class_name,
         degree, current_occupation, current_company, industry, location_city, location_country)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $studentId,
        $data['first_name'],
        $data['last_name'],
        $data['email'],
        $data['phone'] ?? null,
        $data['graduation_year'],
        $data['class_name'] ?? null,
        $data['degree'] ?? null,
        $data['current_occupation'] ?? null,
        $data['current_company'] ?? null,
        $data['industry'] ?? null,
        $data['location_city'] ?? null,
        $data['location_country'] ?? null
    ]);
    
    return ['success' => true, 'id' => $pdo->lastInsertId()];
}

function verifyAlumni($pdo, $alumniId, $status) {
    $stmt = $pdo->prepare("UPDATE alumni SET is_verified = ?, status = 'active' WHERE id = ?");
    $stmt->execute([$status ? 1 : 0, $alumniId]);
    
    return ['success' => true];
}

function searchAlumni($pdo, $query, $graduationYear = null) {
    $sql = "
        SELECT id, first_name, last_name, graduation_year, current_occupation, 
               current_company, location_city, photo
        FROM alumni
        WHERE status = 'active' AND is_verified = 1
        AND (first_name LIKE ? OR last_name LIKE ? OR current_company LIKE ?)
    ";
    $params = ["%$query%", "%$query%", "%$query%"];
    
    if ($graduationYear) {
        $sql .= " AND graduation_year = ?";
        $params[] = $graduationYear;
    }
    
    $sql .= " ORDER BY last_name LIMIT 50";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    return ['success' => true, 'results' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getAlumniProfile($pdo, $alumniId) {
    // Get basic info
    $stmt = $pdo->prepare("SELECT * FROM alumni WHERE id = ?");
    $stmt->execute([$alumniId]);
    $alumni = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$alumni) {
        return ['success' => false, 'error' => 'Alumni not found'];
    }
    
    // Get career history
    $stmt = $pdo->prepare("SELECT * FROM alumni_careers WHERE alumni_id = ? ORDER BY is_current DESC, start_date DESC");
    $stmt->execute([$alumniId]);
    $alumni['careers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get achievements
    $stmt = $pdo->prepare("SELECT * FROM alumni_achievements WHERE alumni_id = ? ORDER BY achievement_date DESC");
    $stmt->execute([$alumniId]);
    $alumni['achievements'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get connection count
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM alumni_connections 
        WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'
    ");
    $stmt->execute([$alumniId, $alumniId]);
    $alumni['connections_count'] = $stmt->fetchColumn();
    
    return ['success' => true, 'profile' => $alumni];
}

// ============================================
// CAREER FUNCTIONS
// ============================================
function handleCareers($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $alumniId = $_GET['alumni_id'] ?? null;
            $stmt = $pdo->prepare("SELECT * FROM alumni_careers WHERE alumni_id = ? ORDER BY is_current DESC, start_date DESC");
            $stmt->execute([$alumniId]);
            echo json_encode(['success' => true, 'careers' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
    }
}

function addCareerHistory($pdo, $data) {
    // If this is current position, update previous current
    if (!empty($data['is_current'])) {
        $stmt = $pdo->prepare("UPDATE alumni_careers SET is_current = 0 WHERE alumni_id = ?");
        $stmt->execute([$data['alumni_id']]);
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO alumni_careers 
        (alumni_id, company_name, position, industry, location, start_date, end_date, is_current, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['alumni_id'],
        $data['company_name'],
        $data['position'],
        $data['industry'] ?? null,
        $data['location'] ?? null,
        $data['start_date'] ?? null,
        $data['end_date'] ?? null,
        $data['is_current'] ?? 0,
        $data['description'] ?? null
    ]);
    
    // Update alumni profile
    if (!empty($data['is_current'])) {
        $stmt = $pdo->prepare("
            UPDATE alumni SET current_occupation = ?, current_company = ?, industry = ?
            WHERE id = ?
        ");
        $stmt->execute([$data['position'], $data['company_name'], $data['industry'], $data['alumni_id']]);
    }
    
    return ['success' => true, 'id' => $pdo->lastInsertId()];
}

function getCareerStatistics($pdo) {
    // By industry
    $stmt = $pdo->query("
        SELECT industry, COUNT(*) as count
        FROM alumni
        WHERE status = 'active' AND industry IS NOT NULL
        GROUP BY industry
        ORDER BY count DESC
        LIMIT 10
    ");
    $byIndustry = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // By location
    $stmt = $pdo->query("
        SELECT location_country, COUNT(*) as count
        FROM alumni
        WHERE status = 'active' AND location_country IS NOT NULL
        GROUP BY location_country
        ORDER BY count DESC
        LIMIT 10
    ");
    $byLocation = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Top companies
    $stmt = $pdo->query("
        SELECT current_company, COUNT(*) as count
        FROM alumni
        WHERE status = 'active' AND current_company IS NOT NULL
        GROUP BY current_company
        ORDER BY count DESC
        LIMIT 10
    ");
    $topCompanies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'success' => true,
        'by_industry' => $byIndustry,
        'by_location' => $byLocation,
        'top_companies' => $topCompanies
    ];
}

// ============================================
// NETWORKING FUNCTIONS
// ============================================
function getAlumniDirectory($pdo, $filters) {
    $sql = "
        SELECT id, first_name, last_name, graduation_year, current_occupation,
               current_company, industry, location_city, location_country, photo, is_mentor
        FROM alumni
        WHERE status = 'active' AND is_verified = 1 AND visibility != 'private'
    ";
    $params = [];
    
    if ($filters['industry']) {
        $sql .= " AND industry = ?";
        $params[] = $filters['industry'];
    }
    if ($filters['location']) {
        $sql .= " AND (location_city LIKE ? OR location_country LIKE ?)";
        $params[] = "%{$filters['location']}%";
        $params[] = "%{$filters['location']}%";
    }
    if ($filters['year']) {
        $sql .= " AND graduation_year = ?";
        $params[] = $filters['year'];
    }
    
    $sql .= " ORDER BY last_name LIMIT 100";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    return ['success' => true, 'directory' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function connectAlumni($pdo, $data) {
    // Check if connection exists
    $stmt = $pdo->prepare("
        SELECT id, status FROM alumni_connections 
        WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
    ");
    $stmt->execute([$data['requester_id'], $data['receiver_id'], $data['receiver_id'], $data['requester_id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        if ($existing['status'] === 'accepted') {
            return ['success' => false, 'error' => 'Already connected'];
        }
        return ['success' => false, 'error' => 'Connection request already exists'];
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO alumni_connections (requester_id, receiver_id, message)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([
        $data['requester_id'],
        $data['receiver_id'],
        $data['message'] ?? null
    ]);
    
    return ['success' => true, 'id' => $pdo->lastInsertId()];
}

function getConnections($pdo, $alumniId) {
    $stmt = $pdo->prepare("
        SELECT 
            ac.*,
            CASE WHEN ac.requester_id = ? THEN a2.id ELSE a1.id END as connected_id,
            CASE WHEN ac.requester_id = ? 
                 THEN CONCAT(a2.first_name, ' ', a2.last_name) 
                 ELSE CONCAT(a1.first_name, ' ', a1.last_name) 
            END as connected_name,
            CASE WHEN ac.requester_id = ? THEN a2.current_company ELSE a1.current_company END as company,
            CASE WHEN ac.requester_id = ? THEN a2.photo ELSE a1.photo END as photo
        FROM alumni_connections ac
        JOIN alumni a1 ON ac.requester_id = a1.id
        JOIN alumni a2 ON ac.receiver_id = a2.id
        WHERE (ac.requester_id = ? OR ac.receiver_id = ?) AND ac.status = 'accepted'
    ");
    $stmt->execute([$alumniId, $alumniId, $alumniId, $alumniId, $alumniId, $alumniId]);
    
    return ['success' => true, 'connections' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function handleMentorship($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $mentorId = $_GET['mentor_id'] ?? null;
            $menteeId = $_GET['mentee_id'] ?? null;
            
            $sql = "
                SELECT m.*,
                       CONCAT(a.first_name, ' ', a.last_name) as mentor_name,
                       a.current_company as mentor_company
                FROM alumni_mentorship m
                JOIN alumni a ON m.mentor_id = a.id
                WHERE 1=1
            ";
            $params = [];
            
            if ($mentorId) {
                $sql .= " AND m.mentor_id = ?";
                $params[] = $mentorId;
            }
            if ($menteeId) {
                $sql .= " AND m.mentee_id = ?";
                $params[] = $menteeId;
            }
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'mentorships' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO alumni_mentorship 
                (mentor_id, mentee_id, mentee_type, mentee_student_id, expertise_areas)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['mentor_id'],
                $data['mentee_id'] ?? null,
                $data['mentee_type'] ?? 'student',
                $data['mentee_student_id'] ?? null,
                $data['expertise_areas'] ?? null
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
    }
}

// ============================================
// EVENT FUNCTIONS
// ============================================
function handleEvents($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT e.*,
                           (SELECT COUNT(*) FROM alumni_event_registrations WHERE event_id = e.id) as registered_count
                    FROM alumni_events e
                    WHERE e.id = ?
                ");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'event' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $status = $_GET['status'] ?? 'published';
                $upcoming = $_GET['upcoming'] ?? false;
                
                $sql = "
                    SELECT e.*,
                           (SELECT COUNT(*) FROM alumni_event_registrations WHERE event_id = e.id) as registered_count
                    FROM alumni_events e
                    WHERE e.status = ?
                ";
                $params = [$status];
                
                if ($upcoming) {
                    $sql .= " AND e.event_date >= NOW()";
                }
                
                $sql .= " ORDER BY e.event_date";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'events' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
    }
}

function createEvent($pdo, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO alumni_events 
        (title, description, event_type, event_date, end_date, location, is_virtual,
         virtual_link, max_attendees, registration_fee, organizer_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['title'],
        $data['description'] ?? null,
        $data['event_type'] ?? 'other',
        $data['event_date'],
        $data['end_date'] ?? null,
        $data['location'] ?? null,
        $data['is_virtual'] ?? 0,
        $data['virtual_link'] ?? null,
        $data['max_attendees'] ?? null,
        $data['registration_fee'] ?? 0,
        $data['organizer_id'] ?? null,
        $data['status'] ?? 'draft'
    ]);
    
    return ['success' => true, 'id' => $pdo->lastInsertId()];
}

function registerForEvent($pdo, $data) {
    // Check capacity
    $stmt = $pdo->prepare("
        SELECT max_attendees, 
               (SELECT COUNT(*) FROM alumni_event_registrations WHERE event_id = id) as registered
        FROM alumni_events WHERE id = ?
    ");
    $stmt->execute([$data['event_id']]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($event['max_attendees'] && $event['registered'] >= $event['max_attendees']) {
        return ['success' => false, 'error' => 'Event is full'];
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO alumni_event_registrations (event_id, alumni_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE registration_date = NOW()
    ");
    $stmt->execute([$data['event_id'], $data['alumni_id']]);
    
    return ['success' => true];
}

function getEventAttendees($pdo, $eventId) {
    $stmt = $pdo->prepare("
        SELECT r.*, 
               CONCAT(a.first_name, ' ', a.last_name) as alumni_name,
               a.graduation_year, a.current_company
        FROM alumni_event_registrations r
        JOIN alumni a ON r.alumni_id = a.id
        WHERE r.event_id = ?
        ORDER BY r.registration_date
    ");
    $stmt->execute([$eventId]);
    
    return ['success' => true, 'attendees' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

// ============================================
// DONATION FUNCTIONS
// ============================================
function handleDonations($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $alumniId = $_GET['alumni_id'] ?? null;
            $campaignId = $_GET['campaign_id'] ?? null;
            
            $sql = "
                SELECT d.*, c.title as campaign_title
                FROM alumni_donations d
                LEFT JOIN donation_campaigns c ON d.campaign_id = c.id
                WHERE d.status = 'completed'
            ";
            $params = [];
            
            if ($alumniId) {
                $sql .= " AND d.alumni_id = ?";
                $params[] = $alumniId;
            }
            if ($campaignId) {
                $sql .= " AND d.campaign_id = ?";
                $params[] = $campaignId;
            }
            
            $sql .= " ORDER BY d.created_at DESC LIMIT 100";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'donations' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
    }
}

function makeDonation($pdo, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO alumni_donations 
        (alumni_id, donor_name, donor_email, campaign_id, amount, currency,
         payment_method, is_anonymous, is_recurring, recurring_frequency, message, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ");
    $stmt->execute([
        $data['alumni_id'] ?? null,
        $data['donor_name'] ?? null,
        $data['donor_email'] ?? null,
        $data['campaign_id'] ?? null,
        $data['amount'],
        $data['currency'] ?? 'GHS',
        $data['payment_method'] ?? null,
        $data['is_anonymous'] ?? 0,
        $data['is_recurring'] ?? 0,
        $data['recurring_frequency'] ?? null,
        $data['message'] ?? null
    ]);
    
    $donationId = $pdo->lastInsertId();
    
    // Update campaign raised amount if completed
    if (!empty($data['campaign_id'])) {
        $stmt = $pdo->prepare("
            UPDATE donation_campaigns 
            SET raised_amount = raised_amount + ?
            WHERE id = ?
        ");
        $stmt->execute([$data['amount'], $data['campaign_id']]);
    }
    
    return ['success' => true, 'id' => $donationId];
}

function handleCampaigns($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM donation_campaigns WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'campaign' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $status = $_GET['status'] ?? 'active';
                $stmt = $pdo->prepare("SELECT * FROM donation_campaigns WHERE status = ? ORDER BY created_at DESC");
                $stmt->execute([$status]);
                echo json_encode(['success' => true, 'campaigns' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO donation_campaigns 
                (title, description, goal_amount, start_date, end_date, campaign_type, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['title'],
                $data['description'] ?? null,
                $data['goal_amount'],
                $data['start_date'],
                $data['end_date'] ?? null,
                $data['campaign_type'] ?? 'general',
                $data['status'] ?? 'draft'
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
    }
}

function getDonationStatistics($pdo) {
    // Total donations
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total_donations,
            SUM(amount) as total_amount,
            COUNT(DISTINCT alumni_id) as unique_donors
        FROM alumni_donations
        WHERE status = 'completed'
    ");
    $totals = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // By campaign
    $stmt = $pdo->query("
        SELECT c.title, c.goal_amount, c.raised_amount,
               ROUND((c.raised_amount / c.goal_amount) * 100, 1) as progress
        FROM donation_campaigns c
        WHERE c.status = 'active'
        ORDER BY c.raised_amount DESC
    ");
    $byCampaign = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Monthly trend
    $stmt = $pdo->query("
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as amount
        FROM alumni_donations
        WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
    ");
    $monthly = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'success' => true,
        'totals' => $totals,
        'by_campaign' => $byCampaign,
        'monthly_trend' => $monthly
    ];
}

// ============================================
// ACHIEVEMENTS & NEWS
// ============================================
function handleAchievements($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $alumniId = $_GET['alumni_id'] ?? null;
            $featured = $_GET['featured'] ?? false;
            
            $sql = "
                SELECT a.*, CONCAT(al.first_name, ' ', al.last_name) as alumni_name
                FROM alumni_achievements a
                JOIN alumni al ON a.alumni_id = al.id
                WHERE 1=1
            ";
            $params = [];
            
            if ($alumniId) {
                $sql .= " AND a.alumni_id = ?";
                $params[] = $alumniId;
            }
            if ($featured) {
                $sql .= " AND a.is_featured = 1";
            }
            
            $sql .= " ORDER BY a.achievement_date DESC LIMIT 50";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'achievements' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO alumni_achievements 
                (alumni_id, title, description, achievement_type, achievement_date)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['alumni_id'],
                $data['title'],
                $data['description'] ?? null,
                $data['achievement_type'] ?? 'other',
                $data['achievement_date'] ?? null
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
    }
}

function handleNews($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Increment views
                $pdo->prepare("UPDATE alumni_news SET views = views + 1 WHERE id = ?")->execute([$id]);
                
                $stmt = $pdo->prepare("SELECT * FROM alumni_news WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'news' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $category = $_GET['category'] ?? null;
                $featured = $_GET['featured'] ?? false;
                
                $sql = "SELECT * FROM alumni_news WHERE status = 'published'";
                $params = [];
                
                if ($category) {
                    $sql .= " AND category = ?";
                    $params[] = $category;
                }
                if ($featured) {
                    $sql .= " AND is_featured = 1";
                }
                
                $sql .= " ORDER BY published_at DESC LIMIT 20";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'news' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO alumni_news 
                (title, content, excerpt, category, author_id, status, published_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['title'],
                $data['content'],
                $data['excerpt'] ?? null,
                $data['category'] ?? 'general',
                $data['author_id'] ?? null,
                $data['status'] ?? 'draft',
                $data['status'] === 'published' ? date('Y-m-d H:i:s') : null
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
    }
}

function getSuccessStories($pdo) {
    $stmt = $pdo->query("
        SELECT n.*, CONCAT(a.first_name, ' ', a.last_name) as author_name
        FROM alumni_news n
        LEFT JOIN alumni a ON n.author_id = a.id
        WHERE n.status = 'published' AND n.category = 'success_story'
        ORDER BY n.published_at DESC
        LIMIT 10
    ");
    
    return ['success' => true, 'stories' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

// ============================================
// DASHBOARD & STATISTICS
// ============================================
function getAlumniDashboard($pdo) {
    $dashboard = [];
    
    // Total alumni
    $stmt = $pdo->query("SELECT COUNT(*) FROM alumni WHERE status = 'active'");
    $dashboard['total_alumni'] = $stmt->fetchColumn();
    
    // Verified alumni
    $stmt = $pdo->query("SELECT COUNT(*) FROM alumni WHERE status = 'active' AND is_verified = 1");
    $dashboard['verified_alumni'] = $stmt->fetchColumn();
    
    // Pending verification
    $stmt = $pdo->query("SELECT COUNT(*) FROM alumni WHERE status = 'pending'");
    $dashboard['pending_verification'] = $stmt->fetchColumn();
    
    // Active mentors
    $stmt = $pdo->query("SELECT COUNT(*) FROM alumni WHERE is_mentor = 1 AND status = 'active'");
    $dashboard['active_mentors'] = $stmt->fetchColumn();
    
    // Upcoming events
    $stmt = $pdo->query("SELECT COUNT(*) FROM alumni_events WHERE status = 'published' AND event_date >= NOW()");
    $dashboard['upcoming_events'] = $stmt->fetchColumn();
    
    // Total donations
    $stmt = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM alumni_donations WHERE status = 'completed'");
    $dashboard['total_donations'] = $stmt->fetchColumn();
    
    // Recent registrations
    $stmt = $pdo->query("
        SELECT id, first_name, last_name, graduation_year, created_at
        FROM alumni
        ORDER BY created_at DESC
        LIMIT 5
    ");
    $dashboard['recent_registrations'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return ['success' => true, 'dashboard' => $dashboard];
}

function getAlumniStatistics($pdo) {
    // By graduation year
    $stmt = $pdo->query("
        SELECT graduation_year, COUNT(*) as count
        FROM alumni WHERE status = 'active'
        GROUP BY graduation_year
        ORDER BY graduation_year DESC
    ");
    $byYear = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // By industry
    $stmt = $pdo->query("
        SELECT industry, COUNT(*) as count
        FROM alumni WHERE status = 'active' AND industry IS NOT NULL
        GROUP BY industry
        ORDER BY count DESC
        LIMIT 10
    ");
    $byIndustry = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // By location
    $stmt = $pdo->query("
        SELECT location_country, COUNT(*) as count
        FROM alumni WHERE status = 'active' AND location_country IS NOT NULL
        GROUP BY location_country
        ORDER BY count DESC
        LIMIT 10
    ");
    $byLocation = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'success' => true,
        'by_year' => $byYear,
        'by_industry' => $byIndustry,
        'by_location' => $byLocation
    ];
}

function getGraduationYears($pdo) {
    $stmt = $pdo->query("
        SELECT DISTINCT graduation_year
        FROM alumni
        WHERE status = 'active'
        ORDER BY graduation_year DESC
    ");
    
    return ['success' => true, 'years' => array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'graduation_year')];
}

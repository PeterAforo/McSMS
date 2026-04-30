<?php
/**
 * Academic Calendar API
 * Manages academic years and terms with automatic transitions
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
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($method) {
        case 'GET':
            if ($action === 'current') {
                getCurrentPeriod($pdo);
            } elseif ($action === 'check_transition') {
                checkTransitionNeeded($pdo);
            } elseif ($action === 'years') {
                getAcademicYears($pdo);
            } elseif ($id) {
                getYear($pdo, $id);
            } else {
                getAllYears($pdo);
            }
            break;

        case 'POST':
            switch ($action) {
                case 'setup_year':
                    setupFirstYear($pdo);
                    break;
                case 'create_year':
                    createAcademicYear($pdo);
                    break;
                case 'auto_transition':
                    triggerTransition($pdo);
                    break;
                case 'activate_year':
                    activateYear($pdo, $id);
                    break;
                case 'auto_update':
                    autoUpdateCurrentTerm($pdo);
                    break;
                default:
                    createAcademicYear($pdo);
            }
            break;

        case 'PUT':
            updateAcademicYear($pdo, $id);
            break;

        case 'DELETE':
            deleteAcademicYear($pdo, $id);
            break;

        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function getCurrentPeriod($pdo) {
    $stmt = $pdo->query("
        SELECT 
            ay.id as year_id,
            ay.year_name,
            ay.start_date as year_start,
            ay.end_date as year_end,
            at.id as term_id,
            at.term_name,
            at.term_number,
            at.start_date as term_start,
            at.end_date as term_end
        FROM academic_years ay
        LEFT JOIN academic_terms at ON ay.id = at.year_id AND at.is_current = 1
        WHERE ay.is_active = 1
        LIMIT 1
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'period' => $result]);
}

function checkTransitionNeeded($pdo) {
    $stmt = $pdo->query("SELECT * FROM academic_terms WHERE is_current = 1 LIMIT 1");
    $currentTerm = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$currentTerm) {
        echo json_encode(['success' => true, 'needs_transition' => false, 'message' => 'No current term']);
        return;
    }
    
    $today = date('Y-m-d');
    $endDate = $currentTerm['end_date'];
    $daysRemaining = (strtotime($endDate) - strtotime($today)) / (60 * 60 * 24);
    
    $configStmt = $pdo->query("SELECT term_transition_notice_days, auto_transition_terms FROM system_config WHERE id = 1");
    $config = $configStmt->fetch(PDO::FETCH_ASSOC);
    
    $needsTransition = $daysRemaining <= 0 && $config['auto_transition_terms'];
    $shouldNotify = $daysRemaining <= $config['term_transition_notice_days'] && $daysRemaining > 0;
    
    echo json_encode([
        'success' => true,
        'needs_transition' => $needsTransition,
        'should_notify' => $shouldNotify,
        'days_remaining' => (int)$daysRemaining,
        'current_term' => $currentTerm
    ]);
}

function getAcademicYears($pdo) {
    $stmt = $pdo->query("
        SELECT ay.*, 
               (SELECT COUNT(*) FROM academic_terms WHERE year_id = ay.id) as term_count,
               (SELECT term_name FROM academic_terms WHERE year_id = ay.id AND is_current = 1) as current_term
        FROM academic_years ay 
        ORDER BY ay.start_date DESC
    ");
    $years = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'years' => $years]);
}

function getYear($pdo, $id) {
    $stmt = $pdo->prepare("SELECT * FROM academic_years WHERE id = ?");
    $stmt->execute([$id]);
    $year = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($year) {
        $termStmt = $pdo->prepare("SELECT * FROM academic_terms WHERE year_id = ? ORDER BY term_number");
        $termStmt->execute([$id]);
        $year['terms'] = $termStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode(['success' => true, 'year' => $year]);
}

function getAllYears($pdo) {
    $stmt = $pdo->query("SELECT * FROM academic_years ORDER BY start_date DESC");
    $years = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'years' => $years]);
}

function setupFirstYear($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $yearName = $data['year_name'] ?? date('Y') . '/' . (date('Y') + 1);
    $termsCount = $data['terms_count'] ?? 3;
    $termDuration = $data['term_duration'] ?? 90;
    $startDate = $data['start_date'] ?? date('Y-m-d');
    
    $pdo->beginTransaction();
    
    try {
        // Create academic year
        $yearEndDate = date('Y-m-d', strtotime($startDate . ' +' . ($termsCount * $termDuration + 30) . ' days'));
        
        $stmt = $pdo->prepare("INSERT INTO academic_years (year_name, start_date, end_date, is_active, status) VALUES (?, ?, ?, 1, 'active')");
        $stmt->execute([$yearName, $startDate, $yearEndDate]);
        $yearId = $pdo->lastInsertId();
        
        // Create terms
        for ($i = 1; $i <= $termsCount; $i++) {
            $termStart = date('Y-m-d', strtotime($startDate . ' +' . (($i - 1) * $termDuration) . ' days'));
            $termEnd = date('Y-m-d', strtotime($termStart . ' +' . ($termDuration - 1) . ' days'));
            $termName = "Term $i";
            $termCode = "T$i-" . substr($yearName, 5, 4);
            $isCurrent = $i === 1 ? 1 : 0;
            $status = $i === 1 ? 'active' : 'upcoming';
            
            $termStmt = $pdo->prepare("INSERT INTO academic_terms (year_id, term_name, term_code, academic_year, term_number, start_date, end_date, is_current, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $termStmt->execute([$yearId, $termName, $termCode, substr($yearName, 0, 4), $i, $termStart, $termEnd, $isCurrent, $status]);
        }
        
        // Update system config
        $pdo->prepare("UPDATE system_config SET current_academic_year = ?, current_term = 1, terms_per_year = ? WHERE id = 1")->execute([$yearName, $termsCount]);
        
        $pdo->commit();
        echo json_encode(['success' => true, 'year_id' => $yearId, 'message' => 'Academic year setup complete']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function createAcademicYear($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("INSERT INTO academic_years (year_name, start_date, end_date, is_active, status) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['year_name'],
        $data['start_date'],
        $data['end_date'],
        $data['is_active'] ?? 0,
        $data['status'] ?? 'upcoming'
    ]);
    
    $id = $pdo->lastInsertId();
    $stmt = $pdo->prepare("SELECT * FROM academic_years WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'year' => $stmt->fetch(PDO::FETCH_ASSOC)]);
}

function triggerTransition($pdo) {
    $pdo->beginTransaction();
    
    try {
        // Get current term
        $stmt = $pdo->query("SELECT id, year_id, term_number FROM academic_terms WHERE is_current = 1 LIMIT 1");
        $currentTerm = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$currentTerm) {
            throw new Exception('No current term found');
        }
        
        // Mark current term as completed
        $stmt = $pdo->prepare("UPDATE academic_terms SET status = 'completed', is_current = 0 WHERE id = ?");
        $stmt->execute([$currentTerm['id']]);
        
        // Find next term in same year
        $stmt = $pdo->prepare("
            SELECT id 
            FROM academic_terms 
            WHERE year_id = ? 
            AND term_number > ? 
            AND status = 'upcoming' 
            ORDER BY term_number ASC 
            LIMIT 1
        ");
        $stmt->execute([$currentTerm['year_id'], $currentTerm['term_number']]);
        $nextTerm = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($nextTerm) {
            // Activate next term
            $stmt = $pdo->prepare("UPDATE academic_terms SET is_current = 1, status = 'active' WHERE id = ?");
            $stmt->execute([$nextTerm['id']]);
            
            // Update system config
            $stmt = $pdo->prepare("UPDATE system_config SET current_term = (SELECT term_number FROM academic_terms WHERE id = ?) WHERE id = 1");
            $stmt->execute([$nextTerm['id']]);
        } else {
            // No more terms in this year, mark year as completed
            $stmt = $pdo->prepare("UPDATE academic_years SET status = 'completed', is_active = 0 WHERE id = ?");
            $stmt->execute([$currentTerm['year_id']]);
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Term transition completed']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function activateYear($pdo, $id) {
    $pdo->beginTransaction();
    
    try {
        // Get the year name before deactivating
        $stmt = $pdo->prepare("SELECT year_name FROM academic_years WHERE id = ?");
        $stmt->execute([$id]);
        $yearData = $stmt->fetch(PDO::FETCH_ASSOC);
        $yearName = $yearData['year_name'];
        
        // Deactivate all years
        $pdo->exec("UPDATE academic_years SET is_active = 0");
        
        // Activate selected year
        $stmt = $pdo->prepare("UPDATE academic_years SET is_active = 1, status = 'active' WHERE id = ?");
        $stmt->execute([$id]);
        
        // Update system config - single source of truth for all modules
        $stmt = $pdo->prepare("UPDATE system_config SET current_academic_year = ?, current_term = 1 WHERE id = 1");
        $stmt->execute([$yearName]);
        
        // Deactivate all terms in other years, activate first term in this year
        $pdo->exec("UPDATE academic_terms SET is_current = 0");
        $stmt = $pdo->prepare("
            UPDATE academic_terms 
            SET is_current = 1, status = 'active' 
            WHERE year_id = ? AND term_number = 1
        ");
        $stmt->execute([$id]);
        
        // Update fee_item_rules to use this year as default for new rules
        // (This is handled by getCurrentAcademicYear() helper in finance.php)
        
        // Update timetable_templates if they have academic_year field
        try {
            $pdo->exec("UPDATE timetable_templates SET status = 'archived' WHERE academic_year != ?");
            $stmt = $pdo->prepare("UPDATE timetable_templates SET status = 'active' WHERE academic_year = ?");
            $stmt->execute([$yearName]);
        } catch (Exception $e) {
            // Table might not exist or column might not exist, ignore
        }
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Academic year activated and synchronized across all modules', 'year_name' => $yearName]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function updateAcademicYear($pdo, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("UPDATE academic_years SET year_name = ?, start_date = ?, end_date = ?, status = ? WHERE id = ?");
    $stmt->execute([
        $data['year_name'],
        $data['start_date'],
        $data['end_date'],
        $data['status'],
        $id
    ]);
    
    $stmt = $pdo->prepare("SELECT * FROM academic_years WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'year' => $stmt->fetch(PDO::FETCH_ASSOC)]);
}

function deleteAcademicYear($pdo, $id) {
    $stmt = $pdo->prepare("DELETE FROM academic_years WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}

function autoUpdateCurrentTerm($pdo) {
    $pdo->beginTransaction();
    
    try {
        $currentDate = date('Y-m-d');
        
        // Find the active academic year that contains today's date
        $stmt = $pdo->prepare("
            SELECT id 
            FROM academic_years 
            WHERE ? BETWEEN start_date AND end_date 
            AND status = 'active'
            LIMIT 1
        ");
        $stmt->execute([$currentDate]);
        $year = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($year) {
            // Find the term that contains today's date
            $stmt = $pdo->prepare("
                SELECT id 
                FROM academic_terms 
                WHERE year_id = ? 
                AND ? BETWEEN start_date AND end_date 
                AND status IN ('active', 'upcoming')
                LIMIT 1
            ");
            $stmt->execute([$year['id'], $currentDate]);
            $term = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($term) {
                // Update current term
                $pdo->exec("UPDATE academic_terms SET is_current = 0 WHERE is_current = 1");
                $stmt = $pdo->prepare("UPDATE academic_terms SET is_current = 1, status = 'active' WHERE id = ?");
                $stmt->execute([$term['id']]);
                
                // Update system config
                $stmt = $pdo->prepare("
                    UPDATE system_config 
                    SET current_academic_year = (SELECT year_name FROM academic_years WHERE id = ?),
                        current_term = (SELECT term_number FROM academic_terms WHERE id = ?)
                    WHERE id = 1
                ");
                $stmt->execute([$year['id'], $term['id']]);
                
                $pdo->commit();
                echo json_encode(['success' => true, 'message' => 'Current term updated automatically', 'year_id' => $year['id'], 'term_id' => $term['id']]);
            } else {
                $pdo->rollBack();
                echo json_encode(['success' => true, 'message' => 'No active term found for current date']);
            }
        } else {
            $pdo->rollBack();
            echo json_encode(['success' => true, 'message' => 'No active academic year found for current date']);
        }
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

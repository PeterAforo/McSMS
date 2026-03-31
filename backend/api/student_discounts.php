<?php
/**
 * Student Discounts API
 * Manage one-time and permanent discounts for students
 * Supports sibling discounts, scholarships, staff child discounts, etc.
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if database config exists
$configPath = __DIR__ . '/../../config/database.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Database config not found', 'path' => $configPath]);
    exit();
}

require_once $configPath;

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$studentId = $_GET['student_id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Ensure tables exist
    createTablesIfNotExist($pdo);

    switch ($method) {
        case 'GET':
            if ($action === 'rules') {
                getDiscountRules($pdo);
            } elseif ($action === 'siblings') {
                getSiblingGroups($pdo, $studentId);
            } elseif ($action === 'calculate') {
                calculateStudentDiscount($pdo, $studentId, $_GET['amount'] ?? 0, $_GET['fee_type'] ?? 'tuition');
            } elseif ($studentId) {
                getStudentDiscounts($pdo, $studentId);
            } elseif ($id) {
                getDiscount($pdo, $id);
            } else {
                getAllDiscounts($pdo);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'add_sibling') {
                addSiblingRelation($pdo, $data);
            } elseif ($action === 'remove_sibling') {
                removeSiblingRelation($pdo, $data);
            } elseif ($action === 'create_rule') {
                createDiscountRule($pdo, $data);
            } elseif ($action === 'apply') {
                applyDiscountToInvoice($pdo, $data);
            } else {
                createDiscount($pdo, $data);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if ($action === 'rule') {
                updateDiscountRule($pdo, $id, $data);
            } else {
                updateDiscount($pdo, $id, $data);
            }
            break;

        case 'DELETE':
            if ($action === 'rule') {
                deleteDiscountRule($pdo, $id);
            } else {
                deleteDiscount($pdo, $id);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// ============================================
// Table Creation
// ============================================

function createTablesIfNotExist($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_discounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            discount_name VARCHAR(100) NOT NULL,
            discount_type ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
            discount_value DECIMAL(10,2) NOT NULL,
            applies_to ENUM('tuition','all_fees','specific_fee') DEFAULT 'tuition',
            fee_rule_id INT DEFAULT NULL,
            duration ENUM('one_time','term','academic_year','permanent') NOT NULL DEFAULT 'permanent',
            start_date DATE DEFAULT NULL,
            end_date DATE DEFAULT NULL,
            max_discount_amount DECIMAL(10,2) DEFAULT NULL,
            reason TEXT DEFAULT NULL,
            approved_by INT DEFAULT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_student_id (student_id),
            KEY idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS discount_applications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            discount_id INT NOT NULL,
            invoice_id INT NOT NULL,
            original_amount DECIMAL(10,2) NOT NULL,
            discount_amount DECIMAL(10,2) NOT NULL,
            final_amount DECIMAL(10,2) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_discount_id (discount_id),
            KEY idx_invoice_id (invoice_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sibling_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            group_name VARCHAR(100) DEFAULT NULL,
            parent_guardian_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sibling_group_members (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sibling_group_id INT NOT NULL,
            student_id INT NOT NULL,
            birth_order INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY student_sibling_unique (student_id),
            KEY idx_sibling_group_id (sibling_group_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS discount_rules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rule_name VARCHAR(100) NOT NULL,
            rule_type ENUM('sibling','staff_child','scholarship','early_payment','other') NOT NULL,
            condition_type VARCHAR(50) DEFAULT NULL,
            condition_value VARCHAR(100) DEFAULT NULL,
            discount_type ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
            discount_value DECIMAL(10,2) NOT NULL,
            applies_to ENUM('tuition','all_fees','specific_fee') DEFAULT 'tuition',
            is_active TINYINT(1) DEFAULT 1,
            priority INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            KEY idx_rule_type (rule_type),
            KEY idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Insert default rules if none exist
    $stmt = $pdo->query("SELECT COUNT(*) FROM discount_rules");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("
            INSERT INTO discount_rules (rule_name, rule_type, condition_type, condition_value, discount_type, discount_value, applies_to, priority) VALUES
            ('Second Child Discount', 'sibling', 'sibling_count', '2', 'percentage', 10.00, 'tuition', 1),
            ('Third Child Discount', 'sibling', 'sibling_count', '3', 'percentage', 15.00, 'tuition', 2),
            ('Fourth+ Child Discount', 'sibling', 'sibling_count', '4', 'percentage', 20.00, 'tuition', 3)
        ");
    }
}

// ============================================
// Discount CRUD Functions
// ============================================

function getAllDiscounts($pdo) {
    $stmt = $pdo->query("
        SELECT d.*, 
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               s.student_id as admission_number,
               c.class_name,
               CONCAT(u.first_name, ' ', u.last_name) as approved_by_name
        FROM student_discounts d
        JOIN students s ON d.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN users u ON d.approved_by = u.id
        ORDER BY d.created_at DESC
    ");
    echo json_encode(['success' => true, 'discounts' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getStudentDiscounts($pdo, $studentId) {
    $stmt = $pdo->prepare("
        SELECT d.*, 
               CONCAT(u.first_name, ' ', u.last_name) as approved_by_name,
               (SELECT COUNT(*) FROM discount_applications da WHERE da.discount_id = d.id) as times_applied
        FROM student_discounts d
        LEFT JOIN users u ON d.approved_by = u.id
        WHERE d.student_id = ?
        ORDER BY d.is_active DESC, d.created_at DESC
    ");
    $stmt->execute([$studentId]);
    
    // Also get sibling info
    $siblingStmt = $pdo->prepare("
        SELECT sg.id as group_id, sg.group_name, sgm.birth_order,
               (SELECT COUNT(*) FROM sibling_group_members WHERE sibling_group_id = sg.id) as sibling_count
        FROM sibling_group_members sgm
        JOIN sibling_groups sg ON sgm.sibling_group_id = sg.id
        WHERE sgm.student_id = ?
    ");
    $siblingStmt->execute([$studentId]);
    $siblingInfo = $siblingStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true, 
        'discounts' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        'sibling_info' => $siblingInfo ?: null
    ]);
}

function getDiscount($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT d.*, 
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               CONCAT(u.first_name, ' ', u.last_name) as approved_by_name
        FROM student_discounts d
        JOIN students s ON d.student_id = s.id
        LEFT JOIN users u ON d.approved_by = u.id
        WHERE d.id = ?
    ");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'discount' => $stmt->fetch(PDO::FETCH_ASSOC)]);
}

function createDiscount($pdo, $data) {
    if (empty($data['student_id']) || empty($data['discount_name']) || !isset($data['discount_value'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'student_id, discount_name, and discount_value are required']);
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO student_discounts 
        (student_id, discount_name, discount_type, discount_value, applies_to, fee_rule_id, duration, start_date, end_date, max_discount_amount, reason, approved_by, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['student_id'],
        $data['discount_name'],
        $data['discount_type'] ?? 'percentage',
        $data['discount_value'],
        $data['applies_to'] ?? 'tuition',
        $data['fee_rule_id'] ?: null,
        $data['duration'] ?? 'permanent',
        $data['start_date'] ?: null,
        $data['end_date'] ?: null,
        $data['max_discount_amount'] ?: null,
        $data['reason'] ?? null,
        $data['approved_by'] ?: null,
        $data['is_active'] ?? 1
    ]);

    $id = $pdo->lastInsertId();
    
    $stmt = $pdo->prepare("SELECT * FROM student_discounts WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'discount' => $stmt->fetch(PDO::FETCH_ASSOC), 'message' => 'Discount created successfully']);
}

function updateDiscount($pdo, $id, $data) {
    $stmt = $pdo->prepare("
        UPDATE student_discounts SET
            discount_name = ?,
            discount_type = ?,
            discount_value = ?,
            applies_to = ?,
            fee_rule_id = ?,
            duration = ?,
            start_date = ?,
            end_date = ?,
            max_discount_amount = ?,
            reason = ?,
            is_active = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['discount_name'],
        $data['discount_type'] ?? 'percentage',
        $data['discount_value'],
        $data['applies_to'] ?? 'tuition',
        $data['fee_rule_id'] ?: null,
        $data['duration'] ?? 'permanent',
        $data['start_date'] ?: null,
        $data['end_date'] ?: null,
        $data['max_discount_amount'] ?: null,
        $data['reason'] ?? null,
        $data['is_active'] ?? 1,
        $id
    ]);

    $stmt = $pdo->prepare("SELECT * FROM student_discounts WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'discount' => $stmt->fetch(PDO::FETCH_ASSOC)]);
}

function deleteDiscount($pdo, $id) {
    $stmt = $pdo->prepare("DELETE FROM student_discounts WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Discount deleted']);
}

// ============================================
// Discount Rules Functions
// ============================================

function getDiscountRules($pdo) {
    $stmt = $pdo->query("SELECT * FROM discount_rules ORDER BY rule_type, priority");
    echo json_encode(['success' => true, 'rules' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createDiscountRule($pdo, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO discount_rules 
        (rule_name, rule_type, condition_type, condition_value, discount_type, discount_value, applies_to, is_active, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['rule_name'],
        $data['rule_type'],
        $data['condition_type'] ?? null,
        $data['condition_value'] ?? null,
        $data['discount_type'] ?? 'percentage',
        $data['discount_value'],
        $data['applies_to'] ?? 'tuition',
        $data['is_active'] ?? 1,
        $data['priority'] ?? 0
    ]);

    echo json_encode(['success' => true, 'message' => 'Discount rule created']);
}

function updateDiscountRule($pdo, $id, $data) {
    $stmt = $pdo->prepare("
        UPDATE discount_rules SET
            rule_name = ?,
            rule_type = ?,
            condition_type = ?,
            condition_value = ?,
            discount_type = ?,
            discount_value = ?,
            applies_to = ?,
            is_active = ?,
            priority = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['rule_name'],
        $data['rule_type'],
        $data['condition_type'] ?? null,
        $data['condition_value'] ?? null,
        $data['discount_type'] ?? 'percentage',
        $data['discount_value'],
        $data['applies_to'] ?? 'tuition',
        $data['is_active'] ?? 1,
        $data['priority'] ?? 0,
        $id
    ]);

    echo json_encode(['success' => true, 'message' => 'Discount rule updated']);
}

function deleteDiscountRule($pdo, $id) {
    $stmt = $pdo->prepare("DELETE FROM discount_rules WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true, 'message' => 'Discount rule deleted']);
}

// ============================================
// Sibling Functions
// ============================================

function getSiblingGroups($pdo, $studentId = null) {
    if ($studentId) {
        // Get siblings of a specific student
        $stmt = $pdo->prepare("
            SELECT s.id, s.student_id as admission_number, s.first_name, s.last_name,
                   c.class_name, sgm.birth_order, sg.group_name
            FROM sibling_group_members sgm
            JOIN sibling_groups sg ON sgm.sibling_group_id = sg.id
            JOIN sibling_group_members sgm2 ON sgm2.sibling_group_id = sg.id
            JOIN students s ON sgm2.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE sgm.student_id = ?
            ORDER BY sgm2.birth_order
        ");
        $stmt->execute([$studentId]);
        echo json_encode(['success' => true, 'siblings' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } else {
        // Get all sibling groups
        $stmt = $pdo->query("
            SELECT sg.*, 
                   (SELECT COUNT(*) FROM sibling_group_members WHERE sibling_group_id = sg.id) as member_count,
                   (SELECT GROUP_CONCAT(CONCAT(s.first_name, ' ', s.last_name) SEPARATOR ', ')
                    FROM sibling_group_members sgm 
                    JOIN students s ON sgm.student_id = s.id 
                    WHERE sgm.sibling_group_id = sg.id) as members
            FROM sibling_groups sg
            ORDER BY sg.group_name
        ");
        echo json_encode(['success' => true, 'groups' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
}

function addSiblingRelation($pdo, $data) {
    if (empty($data['student_ids']) || count($data['student_ids']) < 2) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'At least 2 student_ids are required']);
        return;
    }

    // Check if any student is already in a sibling group
    $placeholders = implode(',', array_fill(0, count($data['student_ids']), '?'));
    $stmt = $pdo->prepare("SELECT student_id, sibling_group_id FROM sibling_group_members WHERE student_id IN ($placeholders)");
    $stmt->execute($data['student_ids']);
    $existing = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $groupId = null;
    if (count($existing) > 0) {
        // Use existing group
        $groupId = $existing[0]['sibling_group_id'];
    } else {
        // Create new group
        $groupName = $data['group_name'] ?? 'Sibling Group ' . date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("INSERT INTO sibling_groups (group_name, parent_guardian_id) VALUES (?, ?)");
        $stmt->execute([$groupName, $data['parent_guardian_id'] ?? null]);
        $groupId = $pdo->lastInsertId();
    }

    // Add students to group
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO sibling_group_members (sibling_group_id, student_id, birth_order)
        VALUES (?, ?, ?)
    ");
    
    $order = 1;
    foreach ($data['student_ids'] as $studentId) {
        $stmt->execute([$groupId, $studentId, $data['birth_orders'][$studentId] ?? $order]);
        $order++;
    }

    // Auto-apply sibling discounts based on rules
    autoApplySiblingDiscounts($pdo, $groupId);

    echo json_encode(['success' => true, 'group_id' => $groupId, 'message' => 'Siblings linked successfully']);
}

function removeSiblingRelation($pdo, $data) {
    if (empty($data['student_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'student_id is required']);
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM sibling_group_members WHERE student_id = ?");
    $stmt->execute([$data['student_id']]);
    
    echo json_encode(['success' => true, 'message' => 'Student removed from sibling group']);
}

function autoApplySiblingDiscounts($pdo, $groupId) {
    // Get sibling count and members
    $stmt = $pdo->prepare("
        SELECT sgm.student_id, sgm.birth_order
        FROM sibling_group_members sgm
        WHERE sgm.sibling_group_id = ?
        ORDER BY sgm.birth_order
    ");
    $stmt->execute([$groupId]);
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $siblingCount = count($members);

    if ($siblingCount < 2) return;

    // Get applicable discount rules
    $stmt = $pdo->query("
        SELECT * FROM discount_rules 
        WHERE rule_type = 'sibling' AND is_active = 1
        ORDER BY priority DESC
    ");
    $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($members as $index => $member) {
        $childNumber = $index + 1; // 1st child, 2nd child, etc.
        
        // Skip first child (no discount)
        if ($childNumber == 1) continue;

        // Find applicable rule
        foreach ($rules as $rule) {
            $conditionValue = (int)$rule['condition_value'];
            
            // Check if rule applies (e.g., "2" means 2nd child, "4" means 4th+ child)
            if ($conditionValue == $childNumber || ($conditionValue == 4 && $childNumber >= 4)) {
                // Check if discount already exists
                $checkStmt = $pdo->prepare("
                    SELECT id FROM student_discounts 
                    WHERE student_id = ? AND discount_name LIKE '%Sibling%' AND is_active = 1
                ");
                $checkStmt->execute([$member['student_id']]);
                
                if (!$checkStmt->fetch()) {
                    // Create discount
                    $insertStmt = $pdo->prepare("
                        INSERT INTO student_discounts 
                        (student_id, discount_name, discount_type, discount_value, applies_to, duration, reason, is_active)
                        VALUES (?, ?, ?, ?, ?, 'permanent', ?, 1)
                    ");
                    $insertStmt->execute([
                        $member['student_id'],
                        $rule['rule_name'],
                        $rule['discount_type'],
                        $rule['discount_value'],
                        $rule['applies_to'],
                        "Auto-applied: Child #{$childNumber} of {$siblingCount} siblings"
                    ]);
                }
                break; // Only apply one rule per child
            }
        }
    }
}

// ============================================
// Discount Calculation & Application
// ============================================

function calculateStudentDiscount($pdo, $studentId, $amount, $feeType = 'tuition') {
    $amount = floatval($amount);
    
    // Get active discounts for student
    $stmt = $pdo->prepare("
        SELECT * FROM student_discounts 
        WHERE student_id = ? AND is_active = 1
        AND (applies_to = ? OR applies_to = 'all_fees')
        AND (end_date IS NULL OR end_date >= CURDATE())
        AND (start_date IS NULL OR start_date <= CURDATE())
    ");
    $stmt->execute([$studentId, $feeType]);
    $discounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalDiscount = 0;
    $appliedDiscounts = [];

    foreach ($discounts as $discount) {
        $discountAmount = 0;
        
        if ($discount['discount_type'] === 'percentage') {
            $discountAmount = ($amount * $discount['discount_value']) / 100;
        } else {
            $discountAmount = $discount['discount_value'];
        }

        // Apply max cap if set
        if ($discount['max_discount_amount'] && $discountAmount > $discount['max_discount_amount']) {
            $discountAmount = $discount['max_discount_amount'];
        }

        $totalDiscount += $discountAmount;
        $appliedDiscounts[] = [
            'id' => $discount['id'],
            'name' => $discount['discount_name'],
            'type' => $discount['discount_type'],
            'value' => $discount['discount_value'],
            'amount' => $discountAmount
        ];
    }

    // Ensure discount doesn't exceed original amount
    if ($totalDiscount > $amount) {
        $totalDiscount = $amount;
    }

    echo json_encode([
        'success' => true,
        'original_amount' => $amount,
        'total_discount' => round($totalDiscount, 2),
        'final_amount' => round($amount - $totalDiscount, 2),
        'applied_discounts' => $appliedDiscounts
    ]);
}

function applyDiscountToInvoice($pdo, $data) {
    if (empty($data['discount_id']) || empty($data['invoice_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'discount_id and invoice_id are required']);
        return;
    }

    // Check if already applied
    $checkStmt = $pdo->prepare("SELECT id FROM discount_applications WHERE discount_id = ? AND invoice_id = ?");
    $checkStmt->execute([$data['discount_id'], $data['invoice_id']]);
    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Discount already applied to this invoice']);
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO discount_applications (discount_id, invoice_id, original_amount, discount_amount, final_amount)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['discount_id'],
        $data['invoice_id'],
        $data['original_amount'],
        $data['discount_amount'],
        $data['final_amount']
    ]);

    // If one-time discount, deactivate it
    $discountStmt = $pdo->prepare("SELECT duration FROM student_discounts WHERE id = ?");
    $discountStmt->execute([$data['discount_id']]);
    $discount = $discountStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($discount && $discount['duration'] === 'one_time') {
        $pdo->prepare("UPDATE student_discounts SET is_active = 0 WHERE id = ?")->execute([$data['discount_id']]);
    }

    echo json_encode(['success' => true, 'message' => 'Discount applied to invoice']);
}

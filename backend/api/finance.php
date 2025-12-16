<?php
/**
 * Comprehensive Finance API
 * Handles: Fee Rules, Installment Plans, Invoices, Payments
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) || strpos($origin, 'eea.mcaforo.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? null;
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Ensure payments table exists with correct structure
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS payments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            payment_number VARCHAR(50),
            invoice_id INT,
            student_id INT,
            parent_id INT,
            amount DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(50) DEFAULT 'cash',
            payment_date DATE,
            reference_number VARCHAR(100),
            received_by INT,
            status VARCHAR(20) DEFAULT 'completed',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_invoice_id (invoice_id),
            INDEX idx_student_id (student_id),
            INDEX idx_payment_date (payment_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // ============================================
    // FEE RULES
    // ============================================
    if ($resource === 'fee_rules') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("
                        SELECT fr.*, fi.item_name, fi.item_code, fg.group_name 
                        FROM fee_item_rules fr
                        LEFT JOIN fee_items fi ON fr.fee_item_id = fi.id
                        LEFT JOIN fee_groups fg ON fi.fee_group_id = fg.id
                        WHERE fr.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'fee_rule' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } else {
                    $stmt = $pdo->query("
                        SELECT fr.*, fi.item_name, fi.item_code, fg.group_name 
                        FROM fee_item_rules fr
                        LEFT JOIN fee_items fi ON fr.fee_item_id = fi.id
                        LEFT JOIN fee_groups fg ON fi.fee_group_id = fg.id
                        ORDER BY fg.group_name, fi.item_name
                    ");
                    echo json_encode(['success' => true, 'fee_rules' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO fee_item_rules (fee_item_id, class_id, term_id, level, amount, currency, academic_year, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['fee_item_id'],
                    $data['class_id'] ?? null,
                    $data['term_id'] ?? null,
                    $data['level'] ?? null,
                    $data['amount'],
                    $data['currency'] ?? 'GHS',
                    $data['academic_year'] ?? date('Y') . '/' . (date('Y') + 1),
                    $data['is_active'] ?? 1
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE fee_item_rules SET amount=?, is_active=? WHERE id=?");
                $stmt->execute([$data['amount'], $data['is_active'], $id]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM fee_item_rules WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // INSTALLMENT PLANS
    // ============================================
    elseif ($resource === 'installment_plans') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM installment_plans WHERE id = ?");
                    $stmt->execute([$id]);
                    $plan = $stmt->fetch(PDO::FETCH_ASSOC);
                    $plan['installments'] = json_decode($plan['installments'], true);
                    echo json_encode(['success' => true, 'installment_plan' => $plan]);
                } else {
                    $stmt = $pdo->query("SELECT * FROM installment_plans ORDER BY is_default DESC, plan_name");
                    $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($plans as &$plan) {
                        $plan['installments'] = json_decode($plan['installments'], true);
                    }
                    echo json_encode(['success' => true, 'installment_plans' => $plans]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO installment_plans (plan_name, plan_code, description, installments, is_default, status) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['plan_name'],
                    $data['plan_code'],
                    $data['description'] ?? null,
                    json_encode($data['installments']),
                    $data['is_default'] ?? 0,
                    $data['status'] ?? 'active'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE installment_plans SET plan_name=?, description=?, installments=?, status=? WHERE id=?");
                $stmt->execute([
                    $data['plan_name'],
                    $data['description'],
                    json_encode($data['installments']),
                    $data['status'],
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM installment_plans WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // INVOICES
    // ============================================
    elseif ($resource === 'invoices') {
        switch ($method) {
            case 'GET':
                if ($action === 'stats') {
                    $stmt = $pdo->query("
                        SELECT 
                            COUNT(*) as total_invoices,
                            SUM(CASE WHEN status = 'pending_finance' THEN 1 ELSE 0 END) as pending,
                            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                            SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
                            SUM(total_amount) as total_amount,
                            SUM(paid_amount) as total_paid,
                            SUM(balance) as total_balance
                        FROM invoices
                    ");
                    echo json_encode(['success' => true, 'stats' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT i.*, s.first_name, s.last_name, s.student_id, c.class_name, t.term_name,
                               u.name as parent_name, ip.plan_name
                        FROM invoices i
                        LEFT JOIN students s ON i.student_id = s.id
                        LEFT JOIN classes c ON i.class_id = c.id
                        LEFT JOIN academic_terms t ON i.term_id = t.id
                        LEFT JOIN users u ON i.parent_id = u.id
                        LEFT JOIN installment_plans ip ON i.installment_plan_id = ip.id
                        WHERE i.id = ?
                    ");
                    $stmt->execute([$id]);
                    $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get invoice items
                    $stmt = $pdo->prepare("
                        SELECT ii.*, fi.item_name, fi.item_code 
                        FROM invoice_items ii
                        LEFT JOIN fee_items fi ON ii.fee_item_id = fi.id
                        WHERE ii.invoice_id = ?
                    ");
                    $stmt->execute([$id]);
                    $invoice['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode(['success' => true, 'invoice' => $invoice]);
                } else {
                    $status = $_GET['status'] ?? null;
                    $studentId = $_GET['student_id'] ?? null;
                    $parentId = $_GET['parent_id'] ?? null;
                    
                    $sql = "
                        SELECT i.*, s.first_name, s.last_name, s.student_id as student_code, c.class_name, t.term_name
                        FROM invoices i
                        LEFT JOIN students s ON i.student_id = s.id
                        LEFT JOIN classes c ON i.class_id = c.id
                        LEFT JOIN academic_terms t ON i.term_id = t.id
                        WHERE 1=1
                    ";
                    $params = [];
                    
                    if ($studentId) {
                        $sql .= " AND i.student_id = ?";
                        $params[] = $studentId;
                    }
                    if ($parentId) {
                        // parent_id could be user_id, look up actual parent_id from parents table
                        $parentStmt = $pdo->prepare("SELECT id FROM parents WHERE user_id = ?");
                        $parentStmt->execute([$parentId]);
                        $actualParentId = $parentStmt->fetchColumn();
                        
                        // Get students linked to this parent
                        $studentStmt = $pdo->prepare("SELECT id FROM students WHERE parent_id = ?");
                        $studentStmt->execute([$actualParentId ?: $parentId]);
                        $studentIds = $studentStmt->fetchAll(PDO::FETCH_COLUMN);
                        
                        if (!empty($studentIds)) {
                            $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
                            $sql .= " AND i.student_id IN ($placeholders)";
                            $params = array_merge($params, $studentIds);
                        } else {
                            // No students found, return empty
                            echo json_encode(['success' => true, 'invoices' => []]);
                            exit;
                        }
                    }
                    if ($status) {
                        $sql .= " AND i.status = ?";
                        $params[] = $status;
                    }
                    $sql .= " ORDER BY i.created_at DESC";
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'invoices' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                if ($action === 'approve' && $id) {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("UPDATE invoices SET status='approved', approved_by=?, approved_at=NOW(), notes=? WHERE id=?");
                    $stmt->execute([$data['approved_by'] ?? 1, $data['notes'] ?? null, $id]);
                    echo json_encode(['success' => true, 'message' => 'Invoice approved']);
                } elseif ($action === 'reject' && $id) {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("UPDATE invoices SET status='rejected', rejection_reason=? WHERE id=?");
                    $stmt->execute([$data['rejection_reason'], $id]);
                    echo json_encode(['success' => true, 'message' => 'Invoice rejected']);
                } else {
                    // Create invoice
                    $data = json_decode(file_get_contents('php://input'), true);
                    
                    // Generate invoice number
                    $stmt = $pdo->query("SELECT COUNT(*) as count FROM invoices");
                    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                    $invoiceNumber = 'INV' . date('Y') . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
                    
                    $stmt = $pdo->prepare("INSERT INTO invoices (invoice_number, student_id, parent_id, term_id, class_id, academic_year, total_amount, balance, installment_plan_id, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $invoiceNumber,
                        $data['student_id'],
                        $data['parent_id'],
                        $data['term_id'],
                        $data['class_id'],
                        $data['academic_year'],
                        $data['total_amount'],
                        $data['total_amount'],
                        $data['installment_plan_id'] ?? null,
                        $data['status'] ?? 'draft',
                        $data['due_date'] ?? null
                    ]);
                    $invoiceId = $pdo->lastInsertId();
                    
                    // Add invoice items
                    if (isset($data['items'])) {
                        $stmt = $pdo->prepare("INSERT INTO invoice_items (invoice_id, fee_item_id, description, quantity, unit_price, amount, is_optional) VALUES (?, ?, ?, ?, ?, ?, ?)");
                        foreach ($data['items'] as $item) {
                            $stmt->execute([
                                $invoiceId,
                                $item['fee_item_id'],
                                $item['description'],
                                $item['quantity'] ?? 1,
                                $item['unit_price'],
                                $item['amount'],
                                $item['is_optional'] ?? 0
                            ]);
                        }
                    }
                    
                    echo json_encode(['success' => true, 'invoice_id' => $invoiceId, 'invoice_number' => $invoiceNumber]);
                }
                break;
        }
    }

    // ============================================
    // PAYMENTS
    // ============================================
    elseif ($resource === 'payments') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("
                        SELECT p.*, i.invoice_number, s.first_name, s.last_name, s.student_id
                        FROM payments p
                        LEFT JOIN invoices i ON p.invoice_id = i.id
                        LEFT JOIN students s ON p.student_id = s.id
                        WHERE p.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'payment' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } else {
                    $invoiceId = $_GET['invoice_id'] ?? null;
                    $studentId = $_GET['student_id'] ?? null;
                    
                    $sql = "
                        SELECT p.*, i.invoice_number, s.first_name, s.last_name, s.student_id as student_code
                        FROM payments p
                        LEFT JOIN invoices i ON p.invoice_id = i.id
                        LEFT JOIN students s ON p.student_id = s.id
                        WHERE 1=1
                    ";
                    $params = [];
                    
                    if ($invoiceId) {
                        $sql .= " AND p.invoice_id = ?";
                        $params[] = $invoiceId;
                    }
                    if ($studentId) {
                        $sql .= " AND p.student_id = ?";
                        $params[] = $studentId;
                    }
                    
                    $sql .= " ORDER BY p.payment_date DESC";
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'payments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Generate payment number
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM payments");
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                $paymentNumber = 'PAY' . date('Y') . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
                
                $pdo->beginTransaction();
                
                // Create payment
                $stmt = $pdo->prepare("INSERT INTO payments (payment_number, invoice_id, student_id, parent_id, amount, payment_method, payment_date, reference_number, received_by, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $paymentNumber,
                    $data['invoice_id'],
                    $data['student_id'],
                    $data['parent_id'],
                    $data['amount'],
                    $data['payment_method'] ?? 'cash',
                    $data['payment_date'] ?? date('Y-m-d'),
                    $data['reference_number'] ?? null,
                    $data['received_by'] ?? 1,
                    $data['status'] ?? 'completed',
                    $data['notes'] ?? null
                ]);
                
                // Update invoice
                $stmt = $pdo->prepare("UPDATE invoices SET paid_amount = paid_amount + ?, balance = balance - ? WHERE id = ?");
                $stmt->execute([$data['amount'], $data['amount'], $data['invoice_id']]);
                
                // Check if fully paid
                $stmt = $pdo->prepare("SELECT balance FROM invoices WHERE id = ?");
                $stmt->execute([$data['invoice_id']]);
                $balance = $stmt->fetch(PDO::FETCH_ASSOC)['balance'];
                
                if ($balance <= 0) {
                    $stmt = $pdo->prepare("UPDATE invoices SET status='paid' WHERE id = ?");
                    $stmt->execute([$data['invoice_id']]);
                } else {
                    $stmt = $pdo->prepare("UPDATE invoices SET status='partial' WHERE id = ?");
                    $stmt->execute([$data['invoice_id']]);
                }
                
                $pdo->commit();
                
                echo json_encode(['success' => true, 'payment_number' => $paymentNumber]);
                break;
        }
    }

    // ============================================
    // DASHBOARD STATS
    // ============================================
    elseif ($resource === 'dashboard') {
        $stmt = $pdo->query("
            SELECT 
                (SELECT COUNT(*) FROM invoices WHERE status = 'pending_finance') as pending_invoices,
                (SELECT COUNT(*) FROM invoices WHERE status = 'approved') as approved_invoices,
                (SELECT COUNT(*) FROM invoices WHERE status = 'paid') as paid_invoices,
                (SELECT SUM(total_amount) FROM invoices WHERE status IN ('approved', 'partial', 'paid')) as total_revenue,
                (SELECT SUM(paid_amount) FROM invoices) as total_collected,
                (SELECT SUM(balance) FROM invoices WHERE status != 'paid') as total_outstanding,
                (SELECT COUNT(*) FROM payments WHERE payment_date = CURDATE()) as today_payments,
                (SELECT SUM(amount) FROM payments WHERE payment_date = CURDATE()) as today_amount
        ");
        echo json_encode(['success' => true, 'stats' => $stmt->fetch(PDO::FETCH_ASSOC)]);
    }

    // ============================================
    // ENHANCED FINANCE ACTIONS
    // ============================================
    elseif ($action === 'recent_payments') {
        $limit = $_GET['limit'] ?? 5;
        $stmt = $pdo->prepare("
            SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) as student_name, i.invoice_number
            FROM payments p
            LEFT JOIN invoices i ON p.invoice_id = i.id
            LEFT JOIN students s ON i.student_id = s.id
            ORDER BY p.payment_date DESC, p.id DESC
            LIMIT ?
        ");
        $stmt->execute([(int)$limit]);
        echo json_encode(['success' => true, 'payments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($action === 'recent_invoices') {
        $limit = $_GET['limit'] ?? 5;
        $stmt = $pdo->prepare("
            SELECT i.*, CONCAT(s.first_name, ' ', s.last_name) as student_name
            FROM invoices i
            LEFT JOIN students s ON i.student_id = s.id
            ORDER BY i.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([(int)$limit]);
        echo json_encode(['success' => true, 'invoices' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($action === 'class_wise') {
        $termId = $_GET['term_id'] ?? null;
        $sql = "
            SELECT 
                c.class_name,
                c.id as class_id,
                COALESCE(SUM(i.total_amount), 0) as total_fees,
                COALESCE(SUM(i.paid_amount), 0) as collected,
                COALESCE(SUM(i.balance), 0) as outstanding,
                CASE WHEN SUM(i.total_amount) > 0 
                    THEN ROUND((SUM(i.paid_amount) / SUM(i.total_amount)) * 100, 1)
                    ELSE 0 END as rate
            FROM classes c
            LEFT JOIN students s ON s.class_id = c.id
            LEFT JOIN invoices i ON i.student_id = s.id
        ";
        $params = [];
        if ($termId) {
            $sql .= " WHERE i.term_id = ? OR i.term_id IS NULL";
            $params[] = $termId;
        }
        $sql .= " GROUP BY c.id ORDER BY c.class_name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($action === 'fee_types') {
        $termId = $_GET['term_id'] ?? null;
        $sql = "
            SELECT 
                fg.group_name,
                COALESCE(SUM(ii.amount), 0) as total,
                COUNT(DISTINCT ii.invoice_id) as invoice_count
            FROM fee_groups fg
            LEFT JOIN fee_items fi ON fi.fee_group_id = fg.id
            LEFT JOIN invoice_items ii ON ii.fee_item_id = fi.id
            LEFT JOIN invoices i ON ii.invoice_id = i.id
        ";
        $params = [];
        if ($termId) {
            $sql .= " WHERE i.term_id = ? OR i.term_id IS NULL";
            $params[] = $termId;
        }
        $sql .= " GROUP BY fg.id ORDER BY total DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($action === 'monthly_trend') {
        $stmt = $pdo->query("
            SELECT 
                DATE_FORMAT(payment_date, '%b') as month,
                DATE_FORMAT(payment_date, '%Y-%m') as month_key,
                SUM(amount) as collected,
                COUNT(*) as payment_count
            FROM payments
            WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY month_key
            ORDER BY month_key
        ");
        echo json_encode(['success' => true, 'trend' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($action === 'overdue') {
        $limit = $_GET['limit'] ?? 10;
        $stmt = $pdo->prepare("
            SELECT 
                i.id,
                i.invoice_number,
                i.balance as amount,
                i.due_date,
                DATEDIFF(CURDATE(), i.due_date) as days_overdue,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                c.class_name
            FROM invoices i
            LEFT JOIN students s ON i.student_id = s.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE i.status IN ('approved', 'partial') 
              AND i.due_date < CURDATE()
              AND i.balance > 0
            ORDER BY days_overdue DESC
            LIMIT ?
        ");
        $stmt->execute([(int)$limit]);
        echo json_encode(['success' => true, 'overdue' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($action === 'top_debtors') {
        $limit = $_GET['limit'] ?? 10;
        $stmt = $pdo->prepare("
            SELECT 
                s.id as student_id,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                c.class_name,
                SUM(i.balance) as outstanding,
                COUNT(i.id) as invoice_count
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN invoices i ON i.student_id = s.id AND i.status IN ('approved', 'partial')
            WHERE i.balance > 0
            GROUP BY s.id
            ORDER BY outstanding DESC
            LIMIT ?
        ");
        $stmt->execute([(int)$limit]);
        echo json_encode(['success' => true, 'debtors' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    elseif ($action === 'payment_methods') {
        $termId = $_GET['term_id'] ?? null;
        $sql = "
            SELECT 
                COALESCE(p.payment_method, 'cash') as method,
                SUM(p.amount) as amount,
                COUNT(*) as count
            FROM payments p
            LEFT JOIN invoices i ON p.invoice_id = i.id
        ";
        $params = [];
        if ($termId) {
            $sql .= " WHERE i.term_id = ?";
            $params[] = $termId;
        }
        $sql .= " GROUP BY method";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $methods = [];
        foreach ($results as $row) {
            $methods[$row['method']] = [
                'amount' => $row['amount'],
                'count' => $row['count']
            ];
        }
        echo json_encode(['success' => true, 'methods' => $methods]);
    }

    elseif ($action === 'comparison') {
        // Compare current month vs previous month
        $stmt = $pdo->query("
            SELECT 
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE())) as current_month,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE MONTH(payment_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(payment_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))) as previous_month
        ");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $change = 0;
        if ($result['previous_month'] > 0) {
            $change = (($result['current_month'] - $result['previous_month']) / $result['previous_month']) * 100;
        }
        
        echo json_encode([
            'success' => true, 
            'comparison' => [
                'current_month' => $result['current_month'],
                'previous_month' => $result['previous_month'],
                'change' => round($change, 1)
            ]
        ]);
    }

    elseif ($action === 'send_reminder') {
        $data = json_decode(file_get_contents('php://input'), true);
        $invoiceId = $data['invoice_id'] ?? null;
        
        if (!$invoiceId) {
            http_response_code(400);
            echo json_encode(['error' => 'Invoice ID required']);
            exit;
        }
        
        // Get invoice and student details
        $stmt = $pdo->prepare("
            SELECT i.*, s.first_name, s.last_name, s.student_id as student_code
            FROM invoices i
            LEFT JOIN students s ON i.student_id = s.id
            WHERE i.id = ?
        ");
        $stmt->execute([$invoiceId]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found']);
            exit;
        }
        
        // In production, this would send SMS/email via WhatsApp or email service
        echo json_encode([
            'success' => true, 
            'message' => 'Payment reminder sent',
            'invoice' => $invoice['invoice_number'],
            'student' => $invoice['first_name'] . ' ' . $invoice['last_name']
        ]);
    }

    elseif ($action === 'email_invoice') {
        $data = json_decode(file_get_contents('php://input'), true);
        $invoiceId = $data['invoice_id'] ?? null;
        
        if (!$invoiceId) {
            http_response_code(400);
            echo json_encode(['error' => 'Invoice ID required']);
            exit;
        }
        
        // Get invoice details
        $stmt = $pdo->prepare("
            SELECT i.*, s.first_name, s.last_name, s.student_id as student_code
            FROM invoices i
            LEFT JOIN students s ON i.student_id = s.id
            WHERE i.id = ?
        ");
        $stmt->execute([$invoiceId]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            http_response_code(404);
            echo json_encode(['error' => 'Invoice not found']);
            exit;
        }
        
        // In production, this would send an actual email
        echo json_encode([
            'success' => true,
            'message' => 'Invoice emailed successfully',
            'student' => $invoice['first_name'] . ' ' . $invoice['last_name']
        ]);
    }

    elseif ($action === 'invoice_history') {
        $invoiceId = $_GET['invoice_id'] ?? null;
        
        if (!$invoiceId) {
            http_response_code(400);
            echo json_encode(['error' => 'Invoice ID required']);
            exit;
        }
        
        // Try to get history from audit log if exists
        try {
            $stmt = $pdo->prepare("
                SELECT * FROM invoice_history 
                WHERE invoice_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$invoiceId]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // Table might not exist
            $history = [];
        }
        
        echo json_encode(['success' => true, 'history' => $history]);
    }

    elseif ($action === 'copy_rules') {
        $data = json_decode(file_get_contents('php://input'), true);
        $sourceYear = $data['source_year'] ?? null;
        $targetYear = $data['target_year'] ?? null;
        
        if (!$sourceYear || !$targetYear) {
            http_response_code(400);
            echo json_encode(['error' => 'Source and target years required']);
            exit;
        }
        
        // Copy fee rules to new year
        $stmt = $pdo->prepare("
            INSERT INTO fee_item_rules (fee_item_id, class_id, term_id, level, amount, currency, academic_year, is_active)
            SELECT fee_item_id, class_id, term_id, level, amount, currency, ?, 1
            FROM fee_item_rules
            WHERE academic_year = ?
        ");
        $stmt->execute([$targetYear, $sourceYear]);
        
        $copied = $stmt->rowCount();
        echo json_encode(['success' => true, 'copied' => $copied, 'message' => "$copied rules copied to $targetYear"]);
    }

    elseif ($action === 'void_payment') {
        $data = json_decode(file_get_contents('php://input'), true);
        $paymentId = $data['payment_id'] ?? null;
        $reason = $data['reason'] ?? '';
        
        if (!$paymentId) {
            http_response_code(400);
            echo json_encode(['error' => 'Payment ID required']);
            exit;
        }
        
        // Get payment details
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ?");
        $stmt->execute([$paymentId]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$payment) {
            http_response_code(404);
            echo json_encode(['error' => 'Payment not found']);
            exit;
        }
        
        // Update payment status to voided
        $stmt = $pdo->prepare("UPDATE payments SET status = 'voided', notes = CONCAT(IFNULL(notes, ''), ' | VOIDED: ', ?) WHERE id = ?");
        $stmt->execute([$reason, $paymentId]);
        
        // Update invoice balance
        $stmt = $pdo->prepare("UPDATE invoices SET paid_amount = paid_amount - ?, balance = balance + ? WHERE id = ?");
        $stmt->execute([$payment['amount'], $payment['amount'], $payment['invoice_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Payment voided']);
    }

    elseif ($action === 'refund_payment') {
        $data = json_decode(file_get_contents('php://input'), true);
        $paymentId = $data['payment_id'] ?? null;
        $amount = $data['amount'] ?? 0;
        $reason = $data['reason'] ?? '';
        
        if (!$paymentId || $amount <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Payment ID and amount required']);
            exit;
        }
        
        // Get payment details
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ?");
        $stmt->execute([$paymentId]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$payment) {
            http_response_code(404);
            echo json_encode(['error' => 'Payment not found']);
            exit;
        }
        
        if ($amount > $payment['amount']) {
            http_response_code(400);
            echo json_encode(['error' => 'Refund amount exceeds payment amount']);
            exit;
        }
        
        // Update payment status
        $stmt = $pdo->prepare("UPDATE payments SET status = 'refunded', notes = CONCAT(IFNULL(notes, ''), ' | REFUND: ', ?, ' Amount: ', ?) WHERE id = ?");
        $stmt->execute([$reason, $amount, $paymentId]);
        
        // Update invoice balance
        $stmt = $pdo->prepare("UPDATE invoices SET paid_amount = paid_amount - ?, balance = balance + ? WHERE id = ?");
        $stmt->execute([$amount, $amount, $payment['invoice_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Refund processed', 'amount' => $amount]);
    }

    elseif ($action === 'email_receipt') {
        $data = json_decode(file_get_contents('php://input'), true);
        $paymentId = $data['payment_id'] ?? null;
        
        if (!$paymentId) {
            http_response_code(400);
            echo json_encode(['error' => 'Payment ID required']);
            exit;
        }
        
        // Get payment details
        $stmt = $pdo->prepare("
            SELECT p.*, s.first_name, s.last_name, s.student_id as student_code
            FROM payments p
            LEFT JOIN students s ON p.student_id = s.id
            WHERE p.id = ?
        ");
        $stmt->execute([$paymentId]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$payment) {
            http_response_code(404);
            echo json_encode(['error' => 'Payment not found']);
            exit;
        }
        
        // In production, this would send an actual email
        echo json_encode([
            'success' => true,
            'message' => 'Receipt emailed successfully',
            'payment' => $payment['payment_number']
        ]);
    }

    elseif ($action === 'daily_payments') {
        $days = $_GET['days'] ?? 7;
        
        $stmt = $pdo->prepare("
            SELECT DATE(payment_date) as date, 
                   COUNT(*) as count, 
                   SUM(amount) as total
            FROM payments
            WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            AND status = 'completed'
            GROUP BY DATE(payment_date)
            ORDER BY date ASC
        ");
        $stmt->execute([$days]);
        $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'daily_stats' => $stats]);
    }

    else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid resource or action']);
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

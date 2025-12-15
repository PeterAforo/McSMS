<?php
/**
 * Comprehensive Finance API
 * Handles: Fee Rules, Installment Plans, Invoices, Payments
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

$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? null;
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

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
                    $sql = "
                        SELECT i.*, s.first_name, s.last_name, s.student_id, c.class_name, t.term_name
                        FROM invoices i
                        LEFT JOIN students s ON i.student_id = s.id
                        LEFT JOIN classes c ON i.class_id = c.id
                        LEFT JOIN academic_terms t ON i.term_id = t.id
                        WHERE 1=1
                    ";
                    $params = [];
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
                    $stmt = $pdo->query("
                        SELECT p.*, i.invoice_number, s.first_name, s.last_name, s.student_id
                        FROM payments p
                        LEFT JOIN invoices i ON p.invoice_id = i.id
                        LEFT JOIN students s ON p.student_id = s.id
                        ORDER BY p.payment_date DESC
                    ");
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

    else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid resource']);
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

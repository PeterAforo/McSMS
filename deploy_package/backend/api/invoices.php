<?php
/**
 * Invoices API
 * Manage student invoices
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
    $id = $_GET['id'] ?? null;

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single invoice
                $stmt = $pdo->prepare("
                    SELECT i.*, 
                           CONCAT(s.first_name, ' ', s.last_name) as student_name, 
                           s.student_id as student_number
                    FROM invoices i
                    LEFT JOIN students s ON i.student_id = s.id
                    WHERE i.id = ?
                ");
                $stmt->execute([$id]);
                $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$invoice) {
                    throw new Exception('Invoice not found');
                }
                
                echo json_encode(['success' => true, 'invoice' => $invoice]);
            } else {
                // Get all invoices with filters
                $where = [];
                $params = [];

                if (isset($_GET['student_id'])) {
                    $where[] = "i.student_id = ?";
                    $params[] = $_GET['student_id'];
                }

                if (isset($_GET['status'])) {
                    $where[] = "i.status = ?";
                    $params[] = $_GET['status'];
                }

                if (isset($_GET['term_id'])) {
                    $where[] = "i.term_id = ?";
                    $params[] = $_GET['term_id'];
                }

                $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

                $sql = "
                    SELECT i.*, 
                           CONCAT(s.first_name, ' ', s.last_name) as student_name, 
                           s.student_id as student_number,
                           t.term_name, t.academic_year as term_academic_year
                    FROM invoices i
                    LEFT JOIN students s ON i.student_id = s.id
                    LEFT JOIN terms t ON i.term_id = t.id
                    $whereClause
                    ORDER BY i.created_at DESC
                    LIMIT 100
                ";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'invoices' => $invoices, 'count' => count($invoices)]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT INTO invoices (student_id, term_id, invoice_number, total_amount, paid_amount, balance, due_date, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['student_id'],
                $data['term_id'],
                $data['invoice_number'],
                $data['total_amount'],
                $data['paid_amount'] ?? 0,
                $data['balance'] ?? $data['total_amount'],
                $data['due_date'],
                $data['status'] ?? 'pending'
            ]);
            
            $newId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
            $stmt->execute([$newId]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'invoice' => $invoice]);
            break;

        case 'PUT':
            if (!$id) {
                throw new Exception('Invoice ID is required');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE invoices 
                SET student_id = ?, term_id = ?, total_amount = ?, paid_amount = ?, 
                    balance = ?, due_date = ?, status = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $data['student_id'],
                $data['term_id'],
                $data['total_amount'],
                $data['paid_amount'],
                $data['balance'],
                $data['due_date'],
                $data['status'],
                $id
            ]);
            
            $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ?");
            $stmt->execute([$id]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'invoice' => $invoice]);
            break;

        case 'DELETE':
            if (!$id) {
                throw new Exception('Invoice ID is required');
            }
            
            $stmt = $pdo->prepare("DELETE FROM invoices WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Invoice deleted successfully']);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

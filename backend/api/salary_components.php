<?php
/**
 * Salary Components Management API
 * Manage salary components, allowances, and deductions
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

require_once dirname(dirname(__DIR__)) . '/config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;

    // ============================================
    // SALARY COMPONENTS CRUD
    // ============================================
    switch ($method) {
        case 'GET':
            if ($action === 'by_employee') {
                $employeeId = $_GET['employee_id'] ?? null;
                $stmt = $pdo->prepare("
                    SELECT 
                        ess.*,
                        sc.component_name,
                        sc.component_type,
                        sc.calculation_type,
                        sc.description
                    FROM employee_salary_structure ess
                    JOIN salary_components sc ON ess.component_id = sc.id
                    WHERE ess.employee_id = ? AND ess.status = 'active'
                    ORDER BY sc.component_type, sc.component_name
                ");
                $stmt->execute([$employeeId]);
                echo json_encode(['success' => true, 'components' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                
            } elseif ($id) {
                $stmt = $pdo->prepare("SELECT * FROM salary_components WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'component' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                
            } else {
                $type = $_GET['type'] ?? null;
                $where = $type ? "WHERE component_type = ?" : "";
                $params = $type ? [$type] : [];
                
                $stmt = $pdo->prepare("
                    SELECT * FROM salary_components 
                    $where
                    ORDER BY component_type, component_name
                ");
                $stmt->execute($params);
                echo json_encode(['success' => true, 'components' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'assign_to_employee') {
                // Assign component to employee
                $stmt = $pdo->prepare("
                    INSERT INTO employee_salary_structure 
                    (employee_id, component_id, amount, effective_from, status)
                    VALUES (?, ?, ?, ?, 'active')
                ");
                $stmt->execute([
                    $data['employee_id'],
                    $data['component_id'],
                    $data['amount'],
                    $data['effective_from'] ?? date('Y-m-d')
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                
            } else {
                // Create new component
                $stmt = $pdo->prepare("
                    INSERT INTO salary_components 
                    (component_name, component_type, description, calculation_type, 
                     calculation_value, is_taxable, is_provident_fund, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['component_name'],
                    $data['component_type'],
                    $data['description'] ?? null,
                    $data['calculation_type'] ?? 'fixed',
                    $data['calculation_value'] ?? 0,
                    $data['is_taxable'] ?? 1,
                    $data['is_provident_fund'] ?? 0,
                    $data['status'] ?? 'active'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'update_employee_component') {
                $stmt = $pdo->prepare("
                    UPDATE employee_salary_structure 
                    SET amount = ?, effective_from = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['amount'],
                    $data['effective_from'],
                    $data['status'] ?? 'active',
                    $id
                ]);
                
            } else {
                $stmt = $pdo->prepare("
                    UPDATE salary_components 
                    SET component_name = ?, component_type = ?, description = ?,
                        calculation_type = ?, calculation_value = ?, 
                        is_taxable = ?, is_provident_fund = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['component_name'],
                    $data['component_type'],
                    $data['description'] ?? null,
                    $data['calculation_type'] ?? 'fixed',
                    $data['calculation_value'] ?? 0,
                    $data['is_taxable'] ?? 1,
                    $data['is_provident_fund'] ?? 0,
                    $data['status'] ?? 'active',
                    $id
                ]);
            }
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            if ($action === 'remove_from_employee') {
                $stmt = $pdo->prepare("DELETE FROM employee_salary_structure WHERE id = ?");
            } else {
                $stmt = $pdo->prepare("DELETE FROM salary_components WHERE id = ?");
            }
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

<?php
/**
 * Multi-School Management API
 * Centralized management for multiple school branches
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
    $resource = $_GET['resource'] ?? '';
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;

    // ============================================
    // BRANCHES
    // ============================================
    if ($resource === 'branches') {
        switch ($method) {
            case 'GET':
                if ($action === 'metrics') {
                    $branchId = $_GET['branch_id'] ?? null;
                    $date = $_GET['date'] ?? date('Y-m-d');
                    
                    $stmt = $pdo->prepare("
                        SELECT * FROM branch_performance_metrics 
                        WHERE branch_id = ? AND metric_date = ?
                    ");
                    $stmt->execute([$branchId, $date]);
                    echo json_encode(['success' => true, 'metrics' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            sb.*,
                            (SELECT COUNT(*) FROM students WHERE branch_id = sb.id) as total_students,
                            (SELECT COUNT(*) FROM teachers WHERE branch_id = sb.id) as total_teachers,
                            (SELECT COUNT(*) FROM employees WHERE branch_id = sb.id) as total_employees
                        FROM school_branches sb
                        WHERE sb.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'branch' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                    
                } else {
                    $stmt = $pdo->query("
                        SELECT 
                            sb.*,
                            (SELECT COUNT(*) FROM students WHERE branch_id = sb.id) as total_students,
                            (SELECT COUNT(*) FROM teachers WHERE branch_id = sb.id) as total_teachers
                        FROM school_branches sb
                        ORDER BY sb.is_headquarters DESC, sb.branch_name
                    ");
                    echo json_encode(['success' => true, 'branches' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO school_branches 
                    (branch_name, branch_code, branch_type, address, city, state, country, 
                     phone, email, subscription_plan, max_students, max_staff, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['branch_name'],
                    $data['branch_code'],
                    $data['branch_type'] ?? 'branch',
                    $data['address'] ?? null,
                    $data['city'] ?? null,
                    $data['state'] ?? null,
                    $data['country'] ?? 'Ghana',
                    $data['phone'] ?? null,
                    $data['email'] ?? null,
                    $data['subscription_plan'] ?? 'pro',
                    $data['max_students'] ?? 2000,
                    $data['max_staff'] ?? 200,
                    $data['status'] ?? 'active'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE school_branches 
                    SET branch_name = ?, address = ?, city = ?, phone = ?, email = ?, 
                        subscription_plan = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['branch_name'],
                    $data['address'] ?? null,
                    $data['city'] ?? null,
                    $data['phone'] ?? null,
                    $data['email'] ?? null,
                    $data['subscription_plan'] ?? 'pro',
                    $data['status'] ?? 'active',
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // CONSOLIDATED REPORTS
    // ============================================
    elseif ($resource === 'consolidated_reports') {
        switch ($method) {
            case 'GET':
                if ($action === 'generate') {
                    $reportType = $_GET['report_type'] ?? 'financial';
                    $branches = json_decode($_GET['branches'] ?? '[]', true);
                    $startDate = $_GET['start_date'] ?? date('Y-m-01');
                    $endDate = $_GET['end_date'] ?? date('Y-m-d');
                    
                    $reportData = generateConsolidatedReport($pdo, $reportType, $branches, $startDate, $endDate);
                    
                    // Save report
                    $stmt = $pdo->prepare("
                        INSERT INTO consolidated_reports 
                        (report_type, report_name, start_date, end_date, branches, report_data, generated_by, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
                    ");
                    $stmt->execute([
                        $reportType,
                        ucfirst($reportType) . ' Report ' . date('Y-m-d'),
                        $startDate,
                        $endDate,
                        json_encode($branches),
                        json_encode($reportData),
                        1
                    ]);
                    
                    echo json_encode(['success' => true, 'report' => $reportData, 'report_id' => $pdo->lastInsertId()]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM consolidated_reports WHERE id = ?");
                    $stmt->execute([$id]);
                    $report = $stmt->fetch(PDO::FETCH_ASSOC);
                    $report['report_data'] = json_decode($report['report_data'], true);
                    $report['branches'] = json_decode($report['branches'], true);
                    echo json_encode(['success' => true, 'report' => $report]);
                    
                } else {
                    $stmt = $pdo->query("
                        SELECT * FROM consolidated_reports 
                        ORDER BY generated_at DESC 
                        LIMIT 50
                    ");
                    echo json_encode(['success' => true, 'reports' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;
        }
    }

    // ============================================
    // BRANCH COMPARISON
    // ============================================
    elseif ($resource === 'comparison') {
        if ($method === 'GET') {
            $branches = json_decode($_GET['branches'] ?? '[]', true);
            $comparisonType = $_GET['type'] ?? 'performance';
            $startDate = $_GET['start_date'] ?? date('Y-m-01');
            $endDate = $_GET['end_date'] ?? date('Y-m-d');
            
            $comparison = compareBranches($pdo, $branches, $comparisonType, $startDate, $endDate);
            
            // Save comparison
            $stmt = $pdo->prepare("
                INSERT INTO branch_comparison_reports 
                (report_name, comparison_type, branches, period_start, period_end, report_data, generated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                'Branch Comparison ' . date('Y-m-d'),
                $comparisonType,
                json_encode($branches),
                $startDate,
                $endDate,
                json_encode($comparison),
                1
            ]);
            
            echo json_encode(['success' => true, 'comparison' => $comparison]);
        }
    }

    // ============================================
    // INTER-BRANCH TRANSFERS
    // ============================================
    elseif ($resource === 'transfers') {
        switch ($method) {
            case 'GET':
                if ($action === 'pending') {
                    $stmt = $pdo->query("
                        SELECT 
                            t.*,
                            sb1.branch_name as from_branch_name,
                            sb2.branch_name as to_branch_name
                        FROM inter_branch_transfers t
                        JOIN school_branches sb1 ON t.from_branch_id = sb1.id
                        JOIN school_branches sb2 ON t.to_branch_id = sb2.id
                        WHERE t.status = 'pending'
                        ORDER BY t.created_at DESC
                    ");
                    echo json_encode(['success' => true, 'transfers' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            t.*,
                            sb1.branch_name as from_branch_name,
                            sb2.branch_name as to_branch_name
                        FROM inter_branch_transfers t
                        JOIN school_branches sb1 ON t.from_branch_id = sb1.id
                        JOIN school_branches sb2 ON t.to_branch_id = sb2.id
                        WHERE t.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'transfer' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO inter_branch_transfers 
                    (transfer_type, entity_id, from_branch_id, to_branch_id, transfer_date, reason, requested_by, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
                ");
                $stmt->execute([
                    $data['transfer_type'],
                    $data['entity_id'],
                    $data['from_branch_id'],
                    $data['to_branch_id'],
                    $data['transfer_date'],
                    $data['reason'] ?? null,
                    $data['requested_by'] ?? 1
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'approve') {
                    $stmt = $pdo->prepare("
                        UPDATE inter_branch_transfers 
                        SET status = 'approved', approved_by = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$data['approved_by'] ?? 1, $id]);
                    
                    // Execute transfer
                    executeTransfer($pdo, $id);
                    
                } elseif ($action === 'reject') {
                    $stmt = $pdo->prepare("
                        UPDATE inter_branch_transfers 
                        SET status = 'rejected', approved_by = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$data['approved_by'] ?? 1, $id]);
                }
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // SHARED RESOURCES
    // ============================================
    elseif ($resource === 'shared_resources') {
        switch ($method) {
            case 'GET':
                $branchId = $_GET['branch_id'] ?? null;
                
                $stmt = $pdo->prepare("
                    SELECT 
                        sr.*,
                        sb.branch_name as owner_branch_name
                    FROM shared_resources sr
                    JOIN school_branches sb ON sr.owner_branch_id = sb.id
                    WHERE sr.is_public = TRUE 
                    OR sr.owner_branch_id = ?
                    OR JSON_CONTAINS(sr.shared_with, ?)
                    ORDER BY sr.created_at DESC
                ");
                $stmt->execute([$branchId, json_encode($branchId)]);
                echo json_encode(['success' => true, 'resources' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO shared_resources 
                    (resource_type, resource_name, description, file_path, owner_branch_id, 
                     shared_with, category, is_public, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['resource_type'],
                    $data['resource_name'],
                    $data['description'] ?? null,
                    $data['file_path'] ?? null,
                    $data['owner_branch_id'],
                    json_encode($data['shared_with'] ?? []),
                    $data['category'] ?? null,
                    $data['is_public'] ?? false,
                    $data['created_by'] ?? 1
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
        }
    }

    // ============================================
    // BRANCH COMMUNICATIONS
    // ============================================
    elseif ($resource === 'communications') {
        switch ($method) {
            case 'GET':
                $branchId = $_GET['branch_id'] ?? null;
                
                $stmt = $pdo->prepare("
                    SELECT 
                        bc.*,
                        sb.branch_name as from_branch_name
                    FROM branch_communications bc
                    LEFT JOIN school_branches sb ON bc.from_branch_id = sb.id
                    WHERE bc.to_branches = 'all' 
                    OR JSON_CONTAINS(bc.to_branches, ?)
                    ORDER BY bc.sent_at DESC
                    LIMIT 50
                ");
                $stmt->execute([json_encode($branchId)]);
                echo json_encode(['success' => true, 'communications' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO branch_communications 
                    (communication_type, subject, message, from_branch_id, to_branches, priority, sent_by, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'sent')
                ");
                $stmt->execute([
                    $data['communication_type'] ?? 'announcement',
                    $data['subject'],
                    $data['message'],
                    $data['from_branch_id'] ?? null,
                    json_encode($data['to_branches'] ?? 'all'),
                    $data['priority'] ?? 'normal',
                    $data['sent_by'] ?? 1
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
        }
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateConsolidatedReport($pdo, $reportType, $branches, $startDate, $endDate) {
    $data = [];
    
    foreach ($branches as $branchId) {
        $branchData = [];
        
        if ($reportType === 'financial') {
            $stmt = $pdo->prepare("
                SELECT 
                    SUM(amount) as total_revenue,
                    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as collected,
                    SUM(CASE WHEN status IN ('pending', 'partial') THEN amount ELSE 0 END) as outstanding
                FROM invoices
                WHERE branch_id = ? AND created_at BETWEEN ? AND ?
            ");
            $stmt->execute([$branchId, $startDate, $endDate]);
            $branchData = $stmt->fetch(PDO::FETCH_ASSOC);
            
        } elseif ($reportType === 'academic') {
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(DISTINCT s.id) as total_students,
                    AVG(er.percentage) as average_score,
                    COUNT(CASE WHEN er.percentage >= 50 THEN 1 END) / COUNT(*) * 100 as pass_rate
                FROM students s
                LEFT JOIN exam_results er ON s.id = er.student_id
                WHERE s.branch_id = ?
            ");
            $stmt->execute([$branchId]);
            $branchData = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        $data[$branchId] = $branchData;
    }
    
    return $data;
}

function compareBranches($pdo, $branches, $comparisonType, $startDate, $endDate) {
    $comparison = [];
    
    foreach ($branches as $branchId) {
        $stmt = $pdo->prepare("
            SELECT * FROM branch_performance_metrics 
            WHERE branch_id = ? AND metric_date BETWEEN ? AND ?
            ORDER BY metric_date DESC
            LIMIT 1
        ");
        $stmt->execute([$branchId, $startDate, $endDate]);
        $metrics = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($metrics) {
            $comparison[$branchId] = $metrics;
        }
    }
    
    return $comparison;
}

function executeTransfer($pdo, $transferId) {
    $stmt = $pdo->prepare("SELECT * FROM inter_branch_transfers WHERE id = ?");
    $stmt->execute([$transferId]);
    $transfer = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($transfer['transfer_type'] === 'student') {
        $stmt = $pdo->prepare("UPDATE students SET branch_id = ? WHERE id = ?");
        $stmt->execute([$transfer['to_branch_id'], $transfer['entity_id']]);
    } elseif ($transfer['transfer_type'] === 'staff') {
        $stmt = $pdo->prepare("UPDATE teachers SET branch_id = ? WHERE id = ?");
        $stmt->execute([$transfer['to_branch_id'], $transfer['entity_id']]);
    }
    
    $stmt = $pdo->prepare("UPDATE inter_branch_transfers SET status = 'completed' WHERE id = ?");
    $stmt->execute([$transferId]);
}

<?php
/**
 * Custom Report Builder API
 * Allows users to create, save, and generate custom reports
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

    // Create report builder tables
    createReportTables($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'list';
    $reportId = $_GET['id'] ?? null;

    switch ($action) {
        case 'list':
            // List all saved reports
            echo json_encode(listReports($pdo));
            break;
            
        case 'get':
            // Get a specific report
            echo json_encode(getReport($pdo, $reportId));
            break;
            
        case 'save':
            // Save a new or update existing report
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(saveReport($pdo, $data));
            break;
            
        case 'delete':
            // Delete a report
            if ($method !== 'DELETE' && $method !== 'POST') {
                echo json_encode(['error' => 'DELETE required']);
                break;
            }
            echo json_encode(deleteReport($pdo, $reportId));
            break;
            
        case 'generate':
            // Generate report data
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(generateReport($pdo, $data));
            break;
            
        case 'templates':
            // Get report templates
            echo json_encode(getTemplates());
            break;
            
        case 'data_sources':
            // Get available data sources
            echo json_encode(getDataSources($pdo));
            break;
            
        case 'fields':
            // Get available fields for a data source
            $source = $_GET['source'] ?? '';
            echo json_encode(getFields($pdo, $source));
            break;
            
        case 'schedule':
            // Schedule a report
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(scheduleReport($pdo, $data));
            break;
            
        case 'scheduled':
            // Get scheduled reports
            echo json_encode(getScheduledReports($pdo));
            break;
            
        default:
            echo json_encode(['error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

function createReportTables($pdo) {
    // Custom reports table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS custom_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            data_source VARCHAR(100) NOT NULL,
            columns JSON,
            filters JSON,
            grouping JSON,
            sorting JSON,
            chart_type VARCHAR(50),
            chart_config JSON,
            created_by INT,
            is_public TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_created_by (created_by),
            INDEX idx_data_source (data_source)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Scheduled reports table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS scheduled_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            report_id INT NOT NULL,
            schedule_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
            schedule_day INT,
            schedule_time TIME,
            recipients JSON,
            format ENUM('pdf', 'excel', 'csv') DEFAULT 'pdf',
            is_active TINYINT(1) DEFAULT 1,
            last_run DATETIME,
            next_run DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_report_id (report_id),
            INDEX idx_next_run (next_run)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Report history table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS report_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            report_id INT,
            report_name VARCHAR(255),
            generated_by INT,
            parameters JSON,
            row_count INT,
            file_path VARCHAR(500),
            format VARCHAR(20),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_report_id (report_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

function listReports($pdo) {
    $stmt = $pdo->query("
        SELECT r.*, u.name as created_by_name
        FROM custom_reports r
        LEFT JOIN users u ON r.created_by = u.id
        ORDER BY r.updated_at DESC
    ");
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($reports as &$report) {
        $report['columns'] = json_decode($report['columns'], true);
        $report['filters'] = json_decode($report['filters'], true);
        $report['grouping'] = json_decode($report['grouping'], true);
        $report['sorting'] = json_decode($report['sorting'], true);
        $report['chart_config'] = json_decode($report['chart_config'], true);
    }
    
    return ['success' => true, 'reports' => $reports];
}

function getReport($pdo, $reportId) {
    if (!$reportId) {
        return ['success' => false, 'error' => 'Report ID required'];
    }
    
    $stmt = $pdo->prepare("SELECT * FROM custom_reports WHERE id = ?");
    $stmt->execute([$reportId]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$report) {
        return ['success' => false, 'error' => 'Report not found'];
    }
    
    $report['columns'] = json_decode($report['columns'], true);
    $report['filters'] = json_decode($report['filters'], true);
    $report['grouping'] = json_decode($report['grouping'], true);
    $report['sorting'] = json_decode($report['sorting'], true);
    $report['chart_config'] = json_decode($report['chart_config'], true);
    
    return ['success' => true, 'report' => $report];
}

function saveReport($pdo, $data) {
    $id = $data['id'] ?? null;
    $name = $data['name'] ?? 'Untitled Report';
    $description = $data['description'] ?? '';
    $dataSource = $data['data_source'] ?? '';
    $columns = json_encode($data['columns'] ?? []);
    $filters = json_encode($data['filters'] ?? []);
    $grouping = json_encode($data['grouping'] ?? []);
    $sorting = json_encode($data['sorting'] ?? []);
    $chartType = $data['chart_type'] ?? null;
    $chartConfig = json_encode($data['chart_config'] ?? []);
    $createdBy = $data['created_by'] ?? null;
    $isPublic = $data['is_public'] ?? 0;
    
    try {
        if ($id) {
            // Update existing
            $stmt = $pdo->prepare("
                UPDATE custom_reports SET
                    name = ?, description = ?, data_source = ?, columns = ?,
                    filters = ?, grouping = ?, sorting = ?, chart_type = ?,
                    chart_config = ?, is_public = ?
                WHERE id = ?
            ");
            $stmt->execute([$name, $description, $dataSource, $columns, $filters, $grouping, $sorting, $chartType, $chartConfig, $isPublic, $id]);
            return ['success' => true, 'message' => 'Report updated', 'id' => $id];
        } else {
            // Create new
            $stmt = $pdo->prepare("
                INSERT INTO custom_reports 
                (name, description, data_source, columns, filters, grouping, sorting, chart_type, chart_config, created_by, is_public)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$name, $description, $dataSource, $columns, $filters, $grouping, $sorting, $chartType, $chartConfig, $createdBy, $isPublic]);
            return ['success' => true, 'message' => 'Report created', 'id' => $pdo->lastInsertId()];
        }
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function deleteReport($pdo, $reportId) {
    if (!$reportId) {
        return ['success' => false, 'error' => 'Report ID required'];
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM custom_reports WHERE id = ?");
        $stmt->execute([$reportId]);
        
        $stmt = $pdo->prepare("DELETE FROM scheduled_reports WHERE report_id = ?");
        $stmt->execute([$reportId]);
        
        return ['success' => true, 'message' => 'Report deleted'];
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function generateReport($pdo, $data) {
    $dataSource = $data['data_source'] ?? '';
    $columns = $data['columns'] ?? [];
    $filters = $data['filters'] ?? [];
    $grouping = $data['grouping'] ?? [];
    $sorting = $data['sorting'] ?? [];
    $limit = min($data['limit'] ?? 1000, 10000);
    
    if (empty($dataSource)) {
        return ['success' => false, 'error' => 'Data source required'];
    }
    
    try {
        // Build query based on data source
        $query = buildQuery($dataSource, $columns, $filters, $grouping, $sorting, $limit);
        
        $stmt = $pdo->prepare($query['sql']);
        $stmt->execute($query['params']);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate aggregates if grouping
        $aggregates = [];
        if (!empty($grouping)) {
            $aggregates = calculateAggregates($rows, $columns);
        }
        
        // Log report generation
        logReportGeneration($pdo, $data, count($rows));
        
        return [
            'success' => true,
            'data' => $rows,
            'row_count' => count($rows),
            'columns' => $columns,
            'aggregates' => $aggregates
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function buildQuery($dataSource, $columns, $filters, $grouping, $sorting, $limit) {
    $params = [];
    
    // Define data source mappings
    $sources = [
        'students' => [
            'table' => 'students s',
            'joins' => 'LEFT JOIN classes c ON s.class_id = c.id',
            'default_columns' => ['s.id', 's.student_id', 's.first_name', 's.last_name', 'c.class_name', 's.status']
        ],
        'teachers' => [
            'table' => 'teachers t',
            'joins' => '',
            'default_columns' => ['t.id', 't.staff_id', 't.first_name', 't.last_name', 't.department', 't.status']
        ],
        'attendance' => [
            'table' => 'attendance a',
            'joins' => 'JOIN students s ON a.student_id = s.id LEFT JOIN classes c ON s.class_id = c.id',
            'default_columns' => ['a.id', 's.first_name', 's.last_name', 'c.class_name', 'a.date', 'a.status']
        ],
        'grades' => [
            'table' => 'grades g',
            'joins' => 'JOIN students s ON g.student_id = s.id JOIN subjects sub ON g.subject_id = sub.id LEFT JOIN classes c ON s.class_id = c.id',
            'default_columns' => ['g.id', 's.first_name', 's.last_name', 'c.class_name', 'sub.name as subject', 'g.score', 'g.grade']
        ],
        'invoices' => [
            'table' => 'invoices i',
            'joins' => 'JOIN students s ON i.student_id = s.id LEFT JOIN classes c ON s.class_id = c.id',
            'default_columns' => ['i.id', 'i.invoice_number', 's.first_name', 's.last_name', 'c.class_name', 'i.total_amount', 'i.amount_paid', 'i.status']
        ],
        'payments' => [
            'table' => 'payments p',
            'joins' => 'JOIN invoices i ON p.invoice_id = i.id JOIN students s ON i.student_id = s.id',
            'default_columns' => ['p.id', 'p.receipt_number', 's.first_name', 's.last_name', 'p.amount', 'p.payment_method', 'p.payment_date']
        ],
        'homework' => [
            'table' => 'homework h',
            'joins' => 'JOIN subjects sub ON h.subject_id = sub.id LEFT JOIN classes c ON h.class_id = c.id',
            'default_columns' => ['h.id', 'h.title', 'sub.name as subject', 'c.class_name', 'h.due_date', 'h.status']
        ],
        'classes' => [
            'table' => 'classes c',
            'joins' => '',
            'default_columns' => ['c.id', 'c.class_name', 'c.section', 'c.capacity']
        ]
    ];
    
    if (!isset($sources[$dataSource])) {
        throw new Exception("Invalid data source: $dataSource");
    }
    
    $source = $sources[$dataSource];
    $selectColumns = empty($columns) ? implode(', ', $source['default_columns']) : implode(', ', array_map(fn($c) => $c['field'] . ($c['alias'] ? " as {$c['alias']}" : ''), $columns));
    
    $sql = "SELECT $selectColumns FROM {$source['table']} {$source['joins']}";
    
    // Add WHERE clauses
    $whereClauses = [];
    foreach ($filters as $filter) {
        $field = $filter['field'];
        $operator = $filter['operator'] ?? '=';
        $value = $filter['value'];
        
        switch ($operator) {
            case 'equals':
                $whereClauses[] = "$field = ?";
                $params[] = $value;
                break;
            case 'contains':
                $whereClauses[] = "$field LIKE ?";
                $params[] = "%$value%";
                break;
            case 'starts_with':
                $whereClauses[] = "$field LIKE ?";
                $params[] = "$value%";
                break;
            case 'greater_than':
                $whereClauses[] = "$field > ?";
                $params[] = $value;
                break;
            case 'less_than':
                $whereClauses[] = "$field < ?";
                $params[] = $value;
                break;
            case 'between':
                $whereClauses[] = "$field BETWEEN ? AND ?";
                $params[] = $value[0];
                $params[] = $value[1];
                break;
            case 'in':
                $placeholders = implode(',', array_fill(0, count($value), '?'));
                $whereClauses[] = "$field IN ($placeholders)";
                $params = array_merge($params, $value);
                break;
        }
    }
    
    if (!empty($whereClauses)) {
        $sql .= " WHERE " . implode(' AND ', $whereClauses);
    }
    
    // Add GROUP BY
    if (!empty($grouping)) {
        $groupFields = array_map(fn($g) => $g['field'], $grouping);
        $sql .= " GROUP BY " . implode(', ', $groupFields);
    }
    
    // Add ORDER BY
    if (!empty($sorting)) {
        $orderClauses = array_map(fn($s) => "{$s['field']} {$s['direction']}", $sorting);
        $sql .= " ORDER BY " . implode(', ', $orderClauses);
    }
    
    $sql .= " LIMIT $limit";
    
    return ['sql' => $sql, 'params' => $params];
}

function calculateAggregates($rows, $columns) {
    $aggregates = [];
    
    foreach ($columns as $col) {
        if (isset($col['aggregate'])) {
            $field = $col['alias'] ?? $col['field'];
            $values = array_column($rows, $field);
            $numericValues = array_filter($values, 'is_numeric');
            
            switch ($col['aggregate']) {
                case 'sum':
                    $aggregates[$field] = array_sum($numericValues);
                    break;
                case 'avg':
                    $aggregates[$field] = count($numericValues) > 0 ? array_sum($numericValues) / count($numericValues) : 0;
                    break;
                case 'min':
                    $aggregates[$field] = count($numericValues) > 0 ? min($numericValues) : 0;
                    break;
                case 'max':
                    $aggregates[$field] = count($numericValues) > 0 ? max($numericValues) : 0;
                    break;
                case 'count':
                    $aggregates[$field] = count($values);
                    break;
            }
        }
    }
    
    return $aggregates;
}

function logReportGeneration($pdo, $data, $rowCount) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO report_history (report_id, report_name, generated_by, parameters, row_count)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['report_id'] ?? null,
            $data['name'] ?? 'Ad-hoc Report',
            $data['generated_by'] ?? null,
            json_encode($data),
            $rowCount
        ]);
    } catch (Exception $e) {
        // Silently fail
    }
}

function getTemplates() {
    $templates = [
        [
            'id' => 'student_list',
            'name' => 'Student List',
            'description' => 'List of all students with class information',
            'data_source' => 'students',
            'columns' => [
                ['field' => 's.student_id', 'alias' => 'Student ID'],
                ['field' => 's.first_name', 'alias' => 'First Name'],
                ['field' => 's.last_name', 'alias' => 'Last Name'],
                ['field' => 'c.class_name', 'alias' => 'Class'],
                ['field' => 's.status', 'alias' => 'Status']
            ],
            'filters' => [],
            'sorting' => [['field' => 'c.class_name', 'direction' => 'ASC']]
        ],
        [
            'id' => 'attendance_summary',
            'name' => 'Attendance Summary',
            'description' => 'Daily attendance summary by class',
            'data_source' => 'attendance',
            'columns' => [
                ['field' => 'c.class_name', 'alias' => 'Class'],
                ['field' => 'a.date', 'alias' => 'Date'],
                ['field' => 'COUNT(*)', 'alias' => 'Total', 'aggregate' => 'count'],
                ['field' => "SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)", 'alias' => 'Present'],
                ['field' => "SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END)", 'alias' => 'Absent']
            ],
            'grouping' => [['field' => 'c.class_name'], ['field' => 'a.date']],
            'sorting' => [['field' => 'a.date', 'direction' => 'DESC']]
        ],
        [
            'id' => 'grade_report',
            'name' => 'Grade Report',
            'description' => 'Student grades by subject',
            'data_source' => 'grades',
            'columns' => [
                ['field' => 's.first_name', 'alias' => 'First Name'],
                ['field' => 's.last_name', 'alias' => 'Last Name'],
                ['field' => 'c.class_name', 'alias' => 'Class'],
                ['field' => 'sub.name', 'alias' => 'Subject'],
                ['field' => 'g.score', 'alias' => 'Score'],
                ['field' => 'g.grade', 'alias' => 'Grade']
            ],
            'filters' => [],
            'sorting' => [['field' => 'c.class_name', 'direction' => 'ASC'], ['field' => 's.last_name', 'direction' => 'ASC']]
        ],
        [
            'id' => 'fee_collection',
            'name' => 'Fee Collection Report',
            'description' => 'Invoice and payment status',
            'data_source' => 'invoices',
            'columns' => [
                ['field' => 'i.invoice_number', 'alias' => 'Invoice #'],
                ['field' => 's.first_name', 'alias' => 'First Name'],
                ['field' => 's.last_name', 'alias' => 'Last Name'],
                ['field' => 'c.class_name', 'alias' => 'Class'],
                ['field' => 'i.total_amount', 'alias' => 'Total'],
                ['field' => 'i.amount_paid', 'alias' => 'Paid'],
                ['field' => 'i.status', 'alias' => 'Status']
            ],
            'filters' => [],
            'sorting' => [['field' => 'i.created_at', 'direction' => 'DESC']]
        ],
        [
            'id' => 'payment_history',
            'name' => 'Payment History',
            'description' => 'All payments received',
            'data_source' => 'payments',
            'columns' => [
                ['field' => 'p.receipt_number', 'alias' => 'Receipt #'],
                ['field' => 's.first_name', 'alias' => 'First Name'],
                ['field' => 's.last_name', 'alias' => 'Last Name'],
                ['field' => 'p.amount', 'alias' => 'Amount'],
                ['field' => 'p.payment_method', 'alias' => 'Method'],
                ['field' => 'p.payment_date', 'alias' => 'Date']
            ],
            'filters' => [],
            'sorting' => [['field' => 'p.payment_date', 'direction' => 'DESC']]
        ]
    ];
    
    return ['success' => true, 'templates' => $templates];
}

function getDataSources($pdo) {
    $sources = [
        ['id' => 'students', 'name' => 'Students', 'description' => 'Student records and information', 'icon' => 'users'],
        ['id' => 'teachers', 'name' => 'Teachers', 'description' => 'Teacher/staff records', 'icon' => 'user-check'],
        ['id' => 'attendance', 'name' => 'Attendance', 'description' => 'Daily attendance records', 'icon' => 'calendar-check'],
        ['id' => 'grades', 'name' => 'Grades', 'description' => 'Student grades and scores', 'icon' => 'award'],
        ['id' => 'invoices', 'name' => 'Invoices', 'description' => 'Fee invoices', 'icon' => 'file-text'],
        ['id' => 'payments', 'name' => 'Payments', 'description' => 'Payment transactions', 'icon' => 'credit-card'],
        ['id' => 'homework', 'name' => 'Homework', 'description' => 'Homework assignments', 'icon' => 'book-open'],
        ['id' => 'classes', 'name' => 'Classes', 'description' => 'Class information', 'icon' => 'layout']
    ];
    
    return ['success' => true, 'sources' => $sources];
}

function getFields($pdo, $source) {
    $fields = [
        'students' => [
            ['field' => 's.id', 'name' => 'ID', 'type' => 'number'],
            ['field' => 's.student_id', 'name' => 'Student ID', 'type' => 'string'],
            ['field' => 's.first_name', 'name' => 'First Name', 'type' => 'string'],
            ['field' => 's.last_name', 'name' => 'Last Name', 'type' => 'string'],
            ['field' => 's.email', 'name' => 'Email', 'type' => 'string'],
            ['field' => 's.phone', 'name' => 'Phone', 'type' => 'string'],
            ['field' => 's.gender', 'name' => 'Gender', 'type' => 'string'],
            ['field' => 's.date_of_birth', 'name' => 'Date of Birth', 'type' => 'date'],
            ['field' => 'c.class_name', 'name' => 'Class', 'type' => 'string'],
            ['field' => 's.status', 'name' => 'Status', 'type' => 'string'],
            ['field' => 's.created_at', 'name' => 'Enrolled Date', 'type' => 'datetime']
        ],
        'teachers' => [
            ['field' => 't.id', 'name' => 'ID', 'type' => 'number'],
            ['field' => 't.staff_id', 'name' => 'Staff ID', 'type' => 'string'],
            ['field' => 't.first_name', 'name' => 'First Name', 'type' => 'string'],
            ['field' => 't.last_name', 'name' => 'Last Name', 'type' => 'string'],
            ['field' => 't.email', 'name' => 'Email', 'type' => 'string'],
            ['field' => 't.phone', 'name' => 'Phone', 'type' => 'string'],
            ['field' => 't.department', 'name' => 'Department', 'type' => 'string'],
            ['field' => 't.qualification', 'name' => 'Qualification', 'type' => 'string'],
            ['field' => 't.status', 'name' => 'Status', 'type' => 'string']
        ],
        'attendance' => [
            ['field' => 'a.id', 'name' => 'ID', 'type' => 'number'],
            ['field' => 's.first_name', 'name' => 'First Name', 'type' => 'string'],
            ['field' => 's.last_name', 'name' => 'Last Name', 'type' => 'string'],
            ['field' => 'c.class_name', 'name' => 'Class', 'type' => 'string'],
            ['field' => 'a.date', 'name' => 'Date', 'type' => 'date'],
            ['field' => 'a.status', 'name' => 'Status', 'type' => 'string'],
            ['field' => 'a.time_in', 'name' => 'Time In', 'type' => 'time'],
            ['field' => 'a.time_out', 'name' => 'Time Out', 'type' => 'time']
        ],
        'grades' => [
            ['field' => 'g.id', 'name' => 'ID', 'type' => 'number'],
            ['field' => 's.first_name', 'name' => 'First Name', 'type' => 'string'],
            ['field' => 's.last_name', 'name' => 'Last Name', 'type' => 'string'],
            ['field' => 'c.class_name', 'name' => 'Class', 'type' => 'string'],
            ['field' => 'sub.name', 'name' => 'Subject', 'type' => 'string'],
            ['field' => 'g.score', 'name' => 'Score', 'type' => 'number'],
            ['field' => 'g.grade', 'name' => 'Grade', 'type' => 'string'],
            ['field' => 'g.exam_type', 'name' => 'Exam Type', 'type' => 'string'],
            ['field' => 'g.created_at', 'name' => 'Date', 'type' => 'datetime']
        ],
        'invoices' => [
            ['field' => 'i.id', 'name' => 'ID', 'type' => 'number'],
            ['field' => 'i.invoice_number', 'name' => 'Invoice Number', 'type' => 'string'],
            ['field' => 's.first_name', 'name' => 'First Name', 'type' => 'string'],
            ['field' => 's.last_name', 'name' => 'Last Name', 'type' => 'string'],
            ['field' => 'c.class_name', 'name' => 'Class', 'type' => 'string'],
            ['field' => 'i.total_amount', 'name' => 'Total Amount', 'type' => 'number'],
            ['field' => 'i.amount_paid', 'name' => 'Amount Paid', 'type' => 'number'],
            ['field' => 'i.status', 'name' => 'Status', 'type' => 'string'],
            ['field' => 'i.due_date', 'name' => 'Due Date', 'type' => 'date'],
            ['field' => 'i.created_at', 'name' => 'Created Date', 'type' => 'datetime']
        ],
        'payments' => [
            ['field' => 'p.id', 'name' => 'ID', 'type' => 'number'],
            ['field' => 'p.receipt_number', 'name' => 'Receipt Number', 'type' => 'string'],
            ['field' => 's.first_name', 'name' => 'First Name', 'type' => 'string'],
            ['field' => 's.last_name', 'name' => 'Last Name', 'type' => 'string'],
            ['field' => 'p.amount', 'name' => 'Amount', 'type' => 'number'],
            ['field' => 'p.payment_method', 'name' => 'Payment Method', 'type' => 'string'],
            ['field' => 'p.payment_date', 'name' => 'Payment Date', 'type' => 'date'],
            ['field' => 'p.reference', 'name' => 'Reference', 'type' => 'string']
        ],
        'homework' => [
            ['field' => 'h.id', 'name' => 'ID', 'type' => 'number'],
            ['field' => 'h.title', 'name' => 'Title', 'type' => 'string'],
            ['field' => 'sub.name', 'name' => 'Subject', 'type' => 'string'],
            ['field' => 'c.class_name', 'name' => 'Class', 'type' => 'string'],
            ['field' => 'h.due_date', 'name' => 'Due Date', 'type' => 'date'],
            ['field' => 'h.status', 'name' => 'Status', 'type' => 'string'],
            ['field' => 'h.created_at', 'name' => 'Created Date', 'type' => 'datetime']
        ],
        'classes' => [
            ['field' => 'c.id', 'name' => 'ID', 'type' => 'number'],
            ['field' => 'c.class_name', 'name' => 'Class Name', 'type' => 'string'],
            ['field' => 'c.section', 'name' => 'Section', 'type' => 'string'],
            ['field' => 'c.capacity', 'name' => 'Capacity', 'type' => 'number']
        ]
    ];
    
    return ['success' => true, 'fields' => $fields[$source] ?? []];
}

function scheduleReport($pdo, $data) {
    $reportId = $data['report_id'] ?? null;
    $scheduleType = $data['schedule_type'] ?? 'weekly';
    $scheduleDay = $data['schedule_day'] ?? 1;
    $scheduleTime = $data['schedule_time'] ?? '08:00';
    $recipients = json_encode($data['recipients'] ?? []);
    $format = $data['format'] ?? 'pdf';
    
    if (!$reportId) {
        return ['success' => false, 'error' => 'Report ID required'];
    }
    
    try {
        // Calculate next run
        $nextRun = calculateNextRun($scheduleType, $scheduleDay, $scheduleTime);
        
        $stmt = $pdo->prepare("
            INSERT INTO scheduled_reports 
            (report_id, schedule_type, schedule_day, schedule_time, recipients, format, next_run)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$reportId, $scheduleType, $scheduleDay, $scheduleTime, $recipients, $format, $nextRun]);
        
        return ['success' => true, 'message' => 'Report scheduled', 'id' => $pdo->lastInsertId()];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function calculateNextRun($type, $day, $time) {
    $now = new DateTime();
    $next = new DateTime();
    $next->setTime(...explode(':', $time));
    
    switch ($type) {
        case 'daily':
            if ($next <= $now) {
                $next->modify('+1 day');
            }
            break;
        case 'weekly':
            $next->modify("next " . ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][$day]);
            break;
        case 'monthly':
            $next->setDate($next->format('Y'), $next->format('m'), $day);
            if ($next <= $now) {
                $next->modify('+1 month');
            }
            break;
    }
    
    return $next->format('Y-m-d H:i:s');
}

function getScheduledReports($pdo) {
    $stmt = $pdo->query("
        SELECT sr.*, cr.name as report_name
        FROM scheduled_reports sr
        JOIN custom_reports cr ON sr.report_id = cr.id
        ORDER BY sr.next_run ASC
    ");
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($reports as &$report) {
        $report['recipients'] = json_decode($report['recipients'], true);
    }
    
    return ['success' => true, 'scheduled_reports' => $reports];
}

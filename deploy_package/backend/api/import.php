<?php
/**
 * Bulk Import API
 * Handle CSV/Excel file imports with validation
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'download_template':
            downloadTemplate($_GET['type'] ?? '');
            break;
            
        case 'validate':
            validateImport($pdo);
            break;
            
        case 'import':
            performImport($pdo);
            break;
            
        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function downloadTemplate($type) {
    $templates = [
        'students' => [
            'filename' => 'students_template.csv',
            'headers' => ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'class', 'admission_date', 'parent_name', 'parent_email', 'parent_phone'],
            'sample' => ['John', 'Doe', 'john.doe@email.com', '0244123456', '2010-05-15', 'Male', 'Primary 5', '2024-09-01', 'Jane Doe', 'jane.doe@email.com', '0244654321']
        ],
        'teachers' => [
            'filename' => 'teachers_template.csv',
            'headers' => ['first_name', 'last_name', 'email', 'phone', 'subject', 'qualification', 'hire_date'],
            'sample' => ['Sarah', 'Johnson', 'sarah.j@school.com', '0244111222', 'Mathematics', 'B.Ed Mathematics', '2020-01-15']
        ],
        'classes' => [
            'filename' => 'classes_template.csv',
            'headers' => ['name', 'grade_level', 'capacity', 'class_teacher'],
            'sample' => ['Primary 1', '1', '30', 'Sarah Johnson']
        ],
        'subjects' => [
            'filename' => 'subjects_template.csv',
            'headers' => ['name', 'code', 'description'],
            'sample' => ['Mathematics', 'MATH101', 'Basic Mathematics']
        ]
    ];

    if (!isset($templates[$type])) {
        throw new Exception('Invalid template type');
    }

    $template = $templates[$type];
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $template['filename'] . '"');
    
    $output = fopen('php://output', 'w');
    fputcsv($output, $template['headers']);
    fputcsv($output, $template['sample']);
    fclose($output);
    exit;
}

function validateImport($pdo) {
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $file = $_FILES['file'];
    $type = $_POST['type'] ?? '';
    $mappings = json_decode($_POST['mappings'] ?? '{}', true);

    if (empty($type)) {
        throw new Exception('Import type is required');
    }

    if (empty($mappings)) {
        throw new Exception('Field mappings are required');
    }

    // Parse CSV
    $csv = array_map('str_getcsv', file($file['tmp_name']));
    $headers = array_shift($csv);

    $errors = [];
    $validRows = 0;

    foreach ($csv as $index => $row) {
        $rowNumber = $index + 2; // +2 because of 0-index and header row
        $data = array_combine($headers, $row);
        $mapped = mapData($data, $mappings);

        // Validate based on type
        $rowErrors = validateRow($pdo, $type, $mapped, $rowNumber);
        
        if (!empty($rowErrors)) {
            $errors[] = [
                'row' => $rowNumber,
                'errors' => $rowErrors
            ];
        } else {
            $validRows++;
        }
    }

    echo json_encode([
        'success' => true,
        'validation' => [
            'total_rows' => count($csv),
            'valid_rows' => $validRows,
            'invalid_rows' => count($errors),
            'errors' => array_slice($errors, 0, 10) // Return first 10 errors
        ]
    ]);
}

function performImport($pdo) {
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $file = $_FILES['file'];
    $type = $_POST['type'] ?? '';
    $mappings = json_decode($_POST['mappings'] ?? '{}', true);
    $userId = $_POST['user_id'] ?? 1;

    // Create import history record
    $stmt = $pdo->prepare("
        INSERT INTO import_history (user_id, import_type, filename, status, started_at)
        VALUES (?, ?, ?, 'processing', NOW())
    ");
    $stmt->execute([$userId, $type, $file['name']]);
    $importId = $pdo->lastInsertId();

    // Parse CSV
    $csv = array_map('str_getcsv', file($file['tmp_name']));
    $headers = array_shift($csv);

    $pdo->beginTransaction();

    try {
        $imported = 0;
        $errors = [];

        foreach ($csv as $index => $row) {
            try {
                $data = array_combine($headers, $row);
                $mapped = mapData($data, $mappings);

                switch ($type) {
                    case 'students':
                        importStudent($pdo, $mapped);
                        break;
                    case 'teachers':
                        importTeacher($pdo, $mapped);
                        break;
                    case 'classes':
                        importClass($pdo, $mapped);
                        break;
                    case 'subjects':
                        importSubject($pdo, $mapped);
                        break;
                }

                $imported++;
            } catch (Exception $e) {
                $errors[] = [
                    'row' => $index + 2,
                    'error' => $e->getMessage()
                ];
            }
        }

        // Update import history
        $stmt = $pdo->prepare("
            UPDATE import_history 
            SET total_rows = ?, successful_rows = ?, failed_rows = ?, 
                errors = ?, status = 'completed', completed_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            count($csv),
            $imported,
            count($errors),
            json_encode($errors),
            $importId
        ]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'import_id' => $importId,
            'total_rows' => count($csv),
            'imported' => $imported,
            'failed' => count($errors),
            'errors' => array_slice($errors, 0, 10)
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        
        // Update import history as failed
        $stmt = $pdo->prepare("
            UPDATE import_history 
            SET status = 'failed', completed_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$importId]);
        
        throw $e;
    }
}

function mapData($data, $mappings) {
    $mapped = [];
    foreach ($mappings as $systemField => $csvColumn) {
        $mapped[$systemField] = $data[$csvColumn] ?? null;
    }
    return $mapped;
}

function validateRow($pdo, $type, $data, $rowNumber) {
    $errors = [];

    switch ($type) {
        case 'students':
            if (empty($data['first_name'])) $errors[] = 'First name is required';
            if (empty($data['last_name'])) $errors[] = 'Last name is required';
            if (empty($data['date_of_birth'])) $errors[] = 'Date of birth is required';
            if (empty($data['gender'])) $errors[] = 'Gender is required';
            if (empty($data['class'])) $errors[] = 'Class is required';
            
            if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'Invalid email format';
            }
            break;

        case 'teachers':
            if (empty($data['first_name'])) $errors[] = 'First name is required';
            if (empty($data['last_name'])) $errors[] = 'Last name is required';
            if (empty($data['email'])) $errors[] = 'Email is required';
            if (empty($data['phone'])) $errors[] = 'Phone is required';
            
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'Invalid email format';
            }
            break;

        case 'classes':
            if (empty($data['name'])) $errors[] = 'Class name is required';
            if (empty($data['grade_level'])) $errors[] = 'Grade level is required';
            break;

        case 'subjects':
            if (empty($data['name'])) $errors[] = 'Subject name is required';
            break;
    }

    return $errors;
}

function importStudent($pdo, $data) {
    // Create parent if provided
    $parentId = null;
    if (!empty($data['parent_email'])) {
        $stmt = $pdo->prepare("
            INSERT INTO users (name, email, phone, user_type, password, status)
            VALUES (?, ?, ?, 'parent', ?, 'active')
            ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
        ");
        $stmt->execute([
            $data['parent_name'] ?? 'Parent',
            $data['parent_email'],
            $data['parent_phone'] ?? '',
            password_hash('default123', PASSWORD_DEFAULT)
        ]);
        $parentId = $pdo->lastInsertId();
    }

    // Get class ID
    $classId = getClassIdByName($pdo, $data['class']);

    // Create student
    $stmt = $pdo->prepare("
        INSERT INTO students (
            first_name, last_name, email, phone, date_of_birth, 
            gender, class_id, admission_date, parent_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    ");
    $stmt->execute([
        $data['first_name'],
        $data['last_name'],
        $data['email'] ?? null,
        $data['phone'] ?? null,
        $data['date_of_birth'],
        $data['gender'],
        $classId,
        $data['admission_date'] ?? date('Y-m-d'),
        $parentId
    ]);
}

function importTeacher($pdo, $data) {
    // Create user account
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, phone, user_type, password, status)
        VALUES (?, ?, ?, 'teacher', ?, 'active')
    ");
    $stmt->execute([
        $data['first_name'] . ' ' . $data['last_name'],
        $data['email'],
        $data['phone'],
        password_hash('default123', PASSWORD_DEFAULT)
    ]);
    $userId = $pdo->lastInsertId();

    // Create teacher record
    $stmt = $pdo->prepare("
        INSERT INTO teachers (user_id, first_name, last_name, email, phone, subject, qualification, hire_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    ");
    $stmt->execute([
        $userId,
        $data['first_name'],
        $data['last_name'],
        $data['email'],
        $data['phone'],
        $data['subject'] ?? null,
        $data['qualification'] ?? null,
        $data['hire_date'] ?? date('Y-m-d')
    ]);
}

function importClass($pdo, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO classes (name, grade_level, capacity, academic_year, status)
        VALUES (?, ?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE 
            grade_level = VALUES(grade_level),
            capacity = VALUES(capacity)
    ");
    $stmt->execute([
        $data['name'],
        $data['grade_level'],
        $data['capacity'] ?? 30,
        date('Y') . '/' . (date('Y') + 1)
    ]);
}

function importSubject($pdo, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO subjects (name, code, description, status)
        VALUES (?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE 
            code = VALUES(code),
            description = VALUES(description)
    ");
    $stmt->execute([
        $data['name'],
        $data['code'] ?? strtoupper(substr($data['name'], 0, 4)),
        $data['description'] ?? null
    ]);
}

function getClassIdByName($pdo, $className) {
    $stmt = $pdo->prepare("SELECT id FROM classes WHERE name = ? LIMIT 1");
    $stmt->execute([$className]);
    $result = $stmt->fetch();

    if (!$result) {
        throw new Exception("Class not found: $className");
    }

    return $result['id'];
}
?>

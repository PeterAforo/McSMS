<?php
/**
 * Bulk Data Import API
 * Handles CSV uploads for migrating data to all modules
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($action) {
        case 'get_templates':
            getImportTemplates();
            break;
        case 'preview':
            previewCSV($pdo);
            break;
        case 'import':
            importData($pdo);
            break;
        case 'get_mappings':
            getFieldMappings();
            break;
        case 'get_classes':
            getClasses($pdo);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getImportTemplates() {
    $templates = [
        'students' => [
            'name' => 'Students',
            'description' => 'Import student records with parent information',
            'required_fields' => ['first_name', 'last_name', 'date_of_birth', 'gender', 'class'],
            'optional_fields' => ['admission_number', 'middle_name', 'religion', 'health_info', 'address', 'parent_name', 'parent_phone', 'parent_email', 'father_name', 'father_phone', 'father_email', 'mother_name', 'mother_phone', 'mother_email'],
            'sample_headers' => 'admission_number,first_name,middle_name,last_name,date_of_birth,gender,class,religion,health_info,address,parent_name,parent_phone,parent_email'
        ],
        'teachers' => [
            'name' => 'Teachers',
            'description' => 'Import teacher/staff records',
            'required_fields' => ['first_name', 'last_name', 'email', 'phone'],
            'optional_fields' => ['employee_id', 'department', 'qualification', 'date_of_birth', 'gender', 'address', 'date_joined'],
            'sample_headers' => 'employee_id,first_name,last_name,email,phone,department,qualification,date_of_birth,gender,address'
        ],
        'classes' => [
            'name' => 'Classes',
            'description' => 'Import class/grade information',
            'required_fields' => ['class_name', 'level'],
            'optional_fields' => ['class_code', 'capacity', 'class_teacher'],
            'sample_headers' => 'class_name,class_code,level,capacity,class_teacher'
        ],
        'subjects' => [
            'name' => 'Subjects',
            'description' => 'Import subject information',
            'required_fields' => ['subject_name', 'subject_code'],
            'optional_fields' => ['level', 'description', 'credit_hours'],
            'sample_headers' => 'subject_name,subject_code,level,description,credit_hours'
        ],
        'fee_items' => [
            'name' => 'Fee Items',
            'description' => 'Import fee structure items',
            'required_fields' => ['item_name', 'amount'],
            'optional_fields' => ['item_code', 'fee_group', 'frequency', 'description'],
            'sample_headers' => 'item_name,item_code,amount,fee_group,frequency,description'
        ],
        'parents' => [
            'name' => 'Parents/Guardians',
            'description' => 'Import parent records separately',
            'required_fields' => ['name', 'phone'],
            'optional_fields' => ['email', 'address', 'occupation', 'relationship'],
            'sample_headers' => 'name,email,phone,address,occupation,relationship'
        ]
    ];
    
    echo json_encode(['success' => true, 'templates' => $templates]);
}

function getFieldMappings() {
    $mappings = [
        'students' => [
            'database_fields' => [
                'student_id' => 'Student ID (auto-generated if empty)',
                'admission_number' => 'Admission Number',
                'first_name' => 'First Name *',
                'middle_name' => 'Middle Name',
                'last_name' => 'Last Name/Surname *',
                'date_of_birth' => 'Date of Birth *',
                'gender' => 'Gender *',
                'class_id' => 'Class *',
                'religion' => 'Religion',
                'nationality' => 'Nationality/Country',
                'state_of_origin' => 'State/Region',
                'health_info' => 'Health Information/Allergies',
                'blood_group' => 'Blood Group',
                'address' => 'Address',
                'previous_school' => 'Previous School',
                'photo' => 'Photo URL'
            ],
            'parent_fields' => [
                'parent_name' => 'Parent/Guardian Name',
                'parent_phone' => 'Parent Phone',
                'parent_email' => 'Parent Email',
                'parent_address' => 'Parent Address',
                'father_name' => 'Father Name',
                'father_phone' => 'Father Phone',
                'father_email' => 'Father Email',
                'mother_name' => 'Mother Name',
                'mother_phone' => 'Mother Phone',
                'mother_email' => 'Mother Email'
            ]
        ]
    ];
    
    echo json_encode(['success' => true, 'mappings' => $mappings]);
}

function getClasses($pdo) {
    $stmt = $pdo->query("SELECT id, class_name, class_code, level FROM classes ORDER BY level, class_name");
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'classes' => $classes]);
}

function previewCSV($pdo) {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'error' => 'No file uploaded or upload error']);
        return;
    }
    
    $file = $_FILES['file']['tmp_name'];
    $module = $_POST['module'] ?? 'students';
    $hasHeader = isset($_POST['has_header']) ? $_POST['has_header'] === 'true' : true;
    
    $handle = fopen($file, 'r');
    if (!$handle) {
        echo json_encode(['success' => false, 'error' => 'Could not open file']);
        return;
    }
    
    $rows = [];
    $headers = [];
    $rowCount = 0;
    $maxPreview = 10;
    
    while (($data = fgetcsv($handle)) !== false && $rowCount < $maxPreview + 1) {
        if ($rowCount === 0 && $hasHeader) {
            $headers = array_map('trim', $data);
        } else {
            $rows[] = $data;
        }
        $rowCount++;
    }
    
    // Count total rows
    $totalRows = $rowCount - ($hasHeader ? 1 : 0);
    while (fgetcsv($handle) !== false) {
        $totalRows++;
    }
    
    fclose($handle);
    
    // Get suggested mappings based on headers
    $suggestedMappings = suggestFieldMappings($headers, $module);
    
    // Get available classes for mapping
    $stmt = $pdo->query("SELECT id, class_name, class_code FROM classes ORDER BY class_name");
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'headers' => $headers,
        'preview_rows' => $rows,
        'total_rows' => $totalRows,
        'suggested_mappings' => $suggestedMappings,
        'classes' => $classes
    ]);
}

function suggestFieldMappings($headers, $module) {
    $mappings = [];
    
    $fieldAliases = [
        'first_name' => ['first name', 'firstname', 'first', 'given name'],
        'last_name' => ['last name', 'lastname', 'surname', 'family name'],
        'middle_name' => ['middle name', 'middlename', 'middle'],
        'date_of_birth' => ['date of birth', 'dob', 'birth date', 'birthdate', 'birthday'],
        'gender' => ['gender', 'sex'],
        'class' => ['class', 'grade', 'form', 'level'],
        'admission_number' => ['admission number', 'admission no', 'adm no', 'student id', 'reg no', 'registration number'],
        'religion' => ['religion', 'faith'],
        'health_info' => ['health info', 'health', 'allergies', 'medical', 'health information'],
        'address' => ['address', 'contact address', 'home address', 'residential address'],
        'parent_name' => ['parent', 'guardian', 'parent or guardian', 'parent name'],
        'parent_phone' => ['parent phone', 'guardian phone', 'primary phone', 'primary phone number', 'contact phone'],
        'parent_email' => ['parent email', 'guardian email', 'primary email', 'parent primary email'],
        'father_name' => ['father', 'father name', 'dad'],
        'father_phone' => ['father phone', 'father contact'],
        'father_email' => ['father email'],
        'mother_name' => ['mother', 'mother name', 'mom', 'mum'],
        'mother_phone' => ['mother phone', 'mother contact'],
        'mother_email' => ['mother email'],
        'nationality' => ['country', 'nationality', 'nation'],
        'state_of_origin' => ['state', 'region', 'state of origin'],
        'previous_school' => ['previous school', 'school attended', 'former school'],
        'email' => ['email', 'e-mail', 'mail'],
        'phone' => ['phone', 'telephone', 'mobile', 'cell'],
        'employee_id' => ['employee id', 'staff id', 'emp id'],
        'department' => ['department', 'dept'],
        'qualification' => ['qualification', 'degree', 'education']
    ];
    
    foreach ($headers as $index => $header) {
        $headerLower = strtolower(trim($header));
        $matched = false;
        
        foreach ($fieldAliases as $field => $aliases) {
            if (in_array($headerLower, $aliases) || $headerLower === $field) {
                $mappings[$index] = $field;
                $matched = true;
                break;
            }
        }
        
        if (!$matched) {
            // Try partial matching
            foreach ($fieldAliases as $field => $aliases) {
                foreach ($aliases as $alias) {
                    if (strpos($headerLower, $alias) !== false || strpos($alias, $headerLower) !== false) {
                        $mappings[$index] = $field;
                        $matched = true;
                        break 2;
                    }
                }
            }
        }
        
        if (!$matched) {
            $mappings[$index] = 'skip';
        }
    }
    
    return $mappings;
}

function importData($pdo) {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'error' => 'No file uploaded']);
        return;
    }
    
    $file = $_FILES['file']['tmp_name'];
    $module = $_POST['module'] ?? 'students';
    $mappings = json_decode($_POST['mappings'] ?? '{}', true);
    $classMappings = json_decode($_POST['class_mappings'] ?? '{}', true);
    $hasHeader = isset($_POST['has_header']) ? $_POST['has_header'] === 'true' : true;
    $updateExisting = isset($_POST['update_existing']) ? $_POST['update_existing'] === 'true' : false;
    
    $handle = fopen($file, 'r');
    if (!$handle) {
        echo json_encode(['success' => false, 'error' => 'Could not open file']);
        return;
    }
    
    $results = [
        'total' => 0,
        'imported' => 0,
        'updated' => 0,
        'skipped' => 0,
        'errors' => []
    ];
    
    $rowNum = 0;
    $pdo->beginTransaction();
    
    try {
        while (($data = fgetcsv($handle)) !== false) {
            $rowNum++;
            
            // Skip header row
            if ($rowNum === 1 && $hasHeader) {
                continue;
            }
            
            $results['total']++;
            
            try {
                $rowData = mapRowToFields($data, $mappings);
                
                switch ($module) {
                    case 'students':
                        $result = importStudent($pdo, $rowData, $classMappings, $updateExisting);
                        break;
                    case 'teachers':
                        $result = importTeacher($pdo, $rowData, $updateExisting);
                        break;
                    case 'classes':
                        $result = importClass($pdo, $rowData, $updateExisting);
                        break;
                    case 'subjects':
                        $result = importSubject($pdo, $rowData, $updateExisting);
                        break;
                    case 'fee_items':
                        $result = importFeeItem($pdo, $rowData, $updateExisting);
                        break;
                    default:
                        throw new Exception("Unknown module: $module");
                }
                
                if ($result === 'imported') {
                    $results['imported']++;
                } elseif ($result === 'updated') {
                    $results['updated']++;
                } else {
                    $results['skipped']++;
                }
                
            } catch (Exception $e) {
                $results['errors'][] = [
                    'row' => $rowNum,
                    'error' => $e->getMessage(),
                    'data' => array_slice($data, 0, 5)
                ];
                $results['skipped']++;
            }
        }
        
        $pdo->commit();
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'Import failed: ' . $e->getMessage()]);
        return;
    }
    
    fclose($handle);
    
    // Include first 10 errors in response for debugging
    $debugErrors = array_slice($results['errors'], 0, 10);
    
    echo json_encode([
        'success' => true,
        'results' => $results,
        'debug_errors' => $debugErrors
    ]);
}

function mapRowToFields($data, $mappings) {
    $rowData = [];
    
    // Handle both numeric index mappings and string key mappings
    foreach ($mappings as $index => $field) {
        if ($field !== 'skip' && $field !== '') {
            // Try numeric index first
            if (is_numeric($index) && isset($data[(int)$index])) {
                $value = trim($data[(int)$index]);
            } elseif (isset($data[$index])) {
                $value = trim($data[$index]);
            } else {
                continue;
            }
            // Clean up escaped characters
            $value = str_replace(['\\r\\n', '\\r', '\\n'], ' ', $value);
            $value = preg_replace('/\\\\+/', '', $value);
            $rowData[$field] = $value;
        }
    }
    return $rowData;
}

function importStudent($pdo, $data, $classMappings, $updateExisting) {
    // Normalize field names (handle variations)
    $firstName = $data['first_name'] ?? $data['firstname'] ?? $data['first'] ?? '';
    $lastName = $data['last_name'] ?? $data['lastname'] ?? $data['surname'] ?? '';
    $middleName = $data['middle_name'] ?? $data['middlename'] ?? $data['middle'] ?? '';
    
    // Validate required fields
    if (empty($firstName) && empty($lastName)) {
        throw new Exception('First name or last name is required. Got: ' . json_encode(array_keys($data)));
    }
    
    // Use available name
    if (empty($firstName)) $firstName = 'Unknown';
    if (empty($lastName)) $lastName = 'Unknown';
    
    // Store normalized values back
    $data['first_name'] = $firstName;
    $data['last_name'] = $lastName;
    $data['middle_name'] = $middleName;
    
    // Parse date of birth
    $dob = null;
    if (!empty($data['date_of_birth'])) {
        $dob = parseDate($data['date_of_birth']);
    }
    
    // Parse gender
    $gender = parseGender($data['gender'] ?? '');
    
    // Map class name to class ID
    $classId = null;
    $className = $data['class'] ?? '';
    if (!empty($className)) {
        // Check if we have a direct mapping
        $classNameNormalized = strtolower(trim($className));
        if (isset($classMappings[$classNameNormalized])) {
            $classId = $classMappings[$classNameNormalized];
        } else {
            // Try to find class by name
            $stmt = $pdo->prepare("SELECT id FROM classes WHERE LOWER(class_name) LIKE ? OR LOWER(class_code) LIKE ? LIMIT 1");
            $stmt->execute(["%$classNameNormalized%", "%$classNameNormalized%"]);
            $class = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($class) {
                $classId = $class['id'];
            }
        }
    }
    
    // Check for existing student by admission number
    $admissionNumber = $data['admission_number'] ?? '';
    $existingStudent = null;
    
    if (!empty($admissionNumber)) {
        $stmt = $pdo->prepare("SELECT id FROM students WHERE admission_number = ?");
        $stmt->execute([$admissionNumber]);
        $existingStudent = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // First, create or find parent
    $parentId = null;
    $parentData = extractParentData($data);
    if (!empty($parentData['name']) || !empty($parentData['phone']) || !empty($parentData['email'])) {
        $parentId = createOrFindParent($pdo, $parentData, $updateExisting);
    }
    
    if ($existingStudent && $updateExisting) {
        // Update existing student
        $stmt = $pdo->prepare("
            UPDATE students SET
                first_name = ?,
                middle_name = ?,
                last_name = ?,
                date_of_birth = ?,
                gender = ?,
                class_id = COALESCE(?, class_id),
                religion = COALESCE(?, religion),
                nationality = COALESCE(?, nationality),
                health_info = COALESCE(?, health_info),
                address = COALESCE(?, address),
                previous_school = COALESCE(?, previous_school),
                parent_id = COALESCE(?, parent_id),
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            $data['first_name'],
            $data['middle_name'] ?? null,
            $data['last_name'],
            $dob,
            $gender,
            $classId,
            $data['religion'] ?? null,
            $data['nationality'] ?? null,
            $data['health_info'] ?? null,
            $data['address'] ?? null,
            $data['previous_school'] ?? null,
            $parentId,
            $existingStudent['id']
        ]);
        return 'updated';
        
    } elseif (!$existingStudent) {
        // Generate student ID if not provided
        if (empty($admissionNumber)) {
            $year = date('Y');
            $stmt = $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(admission_number, 4) AS UNSIGNED)), 0) + 1 as next FROM students WHERE admission_number LIKE 'STU%'");
            $next = $stmt->fetch(PDO::FETCH_ASSOC)['next'];
            $admissionNumber = 'STU' . str_pad($next, 6, '0', STR_PAD_LEFT);
        }
        
        // Generate unique student_id
        $stmt = $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING(student_id, 2) AS UNSIGNED)), 0) + 1 as next FROM students WHERE student_id LIKE 'S%'");
        $nextId = $stmt->fetch(PDO::FETCH_ASSOC)['next'];
        $studentId = 'S' . date('Y') . str_pad($nextId, 4, '0', STR_PAD_LEFT);
        
        // Default date of birth if not provided (use a placeholder that can be updated later)
        if (empty($dob)) {
            $dob = '2010-01-01'; // Default placeholder
        }
        
        // Default admission date to today
        $admissionDate = date('Y-m-d');
        
        // Default gender if not provided
        if (empty($gender)) {
            $gender = 'male'; // Default, can be updated later
        }
        
        // Insert new student
        $stmt = $pdo->prepare("
            INSERT INTO students (
                student_id, admission_number, first_name, other_names, last_name,
                date_of_birth, gender, class_id, religion, nationality,
                allergies, address, previous_school, parent_id, admission_date, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
        ");
        $stmt->execute([
            $studentId,
            $admissionNumber,
            $data['first_name'],
            $data['middle_name'] ?? null,
            $data['last_name'],
            $dob,
            $gender,
            $classId,
            $data['religion'] ?? null,
            $data['nationality'] ?? null,
            $data['health_info'] ?? null,
            $data['address'] ?? null,
            $data['previous_school'] ?? null,
            $parentId,
            $admissionDate
        ]);
        return 'imported';
    }
    
    return 'skipped';
}

function extractParentData($data) {
    $parentData = [
        'name' => '',
        'phone' => '',
        'email' => '',
        'address' => '',
        'father_name' => $data['father_name'] ?? '',
        'father_phone' => $data['father_phone'] ?? '',
        'father_email' => $data['father_email'] ?? '',
        'mother_name' => $data['mother_name'] ?? '',
        'mother_phone' => $data['mother_phone'] ?? '',
        'mother_email' => $data['mother_email'] ?? ''
    ];
    
    // Use parent fields if available, otherwise use mother/father
    if (!empty($data['parent_name'])) {
        $parentData['name'] = $data['parent_name'];
    } elseif (!empty($data['mother_name'])) {
        $parentData['name'] = $data['mother_name'];
    } elseif (!empty($data['father_name'])) {
        $parentData['name'] = $data['father_name'];
    }
    
    if (!empty($data['parent_phone'])) {
        $parentData['phone'] = $data['parent_phone'];
    } elseif (!empty($data['mother_phone'])) {
        $parentData['phone'] = $data['mother_phone'];
    } elseif (!empty($data['father_phone'])) {
        $parentData['phone'] = $data['father_phone'];
    }
    
    if (!empty($data['parent_email'])) {
        $parentData['email'] = cleanEmail($data['parent_email']);
    } elseif (!empty($data['mother_email'])) {
        $parentData['email'] = cleanEmail($data['mother_email']);
    } elseif (!empty($data['father_email'])) {
        $parentData['email'] = cleanEmail($data['father_email']);
    }
    
    $parentData['address'] = $data['parent_address'] ?? $data['address'] ?? '';
    
    return $parentData;
}

function cleanEmail($email) {
    // Handle multiple emails separated by comma or slash
    $email = preg_split('/[,\/]/', $email)[0];
    return trim($email);
}

function createOrFindParent($pdo, $parentData, $updateExisting) {
    $phone = cleanPhone($parentData['phone']);
    $email = $parentData['email'];
    
    // Try to find existing parent by phone or email
    if (!empty($phone)) {
        $stmt = $pdo->prepare("SELECT id FROM parents WHERE phone = ? OR phone LIKE ?");
        $stmt->execute([$phone, "%$phone%"]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($existing) return $existing['id'];
    }
    
    if (!empty($email)) {
        $stmt = $pdo->prepare("SELECT id FROM parents WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($existing) return $existing['id'];
    }
    
    // Create new parent
    if (empty($parentData['name']) && empty($phone)) {
        return null;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO parents (name, phone, email, address, father_name, father_phone, father_email, mother_name, mother_phone, mother_email, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $parentData['name'],
        $phone,
        $email ?: null,
        $parentData['address'] ?: null,
        $parentData['father_name'] ?: null,
        cleanPhone($parentData['father_phone']),
        cleanEmail($parentData['father_email']) ?: null,
        $parentData['mother_name'] ?: null,
        cleanPhone($parentData['mother_phone']),
        cleanEmail($parentData['mother_email']) ?: null
    ]);
    
    return $pdo->lastInsertId();
}

function cleanPhone($phone) {
    if (empty($phone)) return null;
    // Remove spaces and keep only digits and +
    return preg_replace('/[^\d+]/', '', trim($phone));
}

function parseDate($dateStr) {
    if (empty($dateStr)) return null;
    
    // Try various date formats
    $formats = [
        'd/m/Y',      // 30/05/2023
        'm/d/Y',      // 05/30/2023
        'Y-m-d',      // 2023-05-30
        'd-m-Y',      // 30-05-2023
        'Y/m/d',      // 2023/05/30
        'd.m.Y',      // 30.05.2023
        'j/n/Y',      // 5/3/2023
    ];
    
    foreach ($formats as $format) {
        $date = DateTime::createFromFormat($format, trim($dateStr));
        if ($date !== false) {
            return $date->format('Y-m-d');
        }
    }
    
    // Try strtotime as fallback
    $timestamp = strtotime($dateStr);
    if ($timestamp !== false) {
        return date('Y-m-d', $timestamp);
    }
    
    return null;
}

function parseGender($gender) {
    $gender = strtolower(trim($gender));
    if (in_array($gender, ['m', 'male', 'boy', 'man'])) {
        return 'male';
    } elseif (in_array($gender, ['f', 'female', 'girl', 'woman'])) {
        return 'female';
    }
    return null;
}

function importTeacher($pdo, $data, $updateExisting) {
    if (empty($data['first_name']) || empty($data['last_name'])) {
        throw new Exception('First name and last name are required');
    }
    
    $email = cleanEmail($data['email'] ?? '');
    $phone = cleanPhone($data['phone'] ?? '');
    
    // Check for existing teacher
    $existing = null;
    if (!empty($email)) {
        $stmt = $pdo->prepare("SELECT id FROM teachers WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if ($existing && $updateExisting) {
        $stmt = $pdo->prepare("
            UPDATE teachers SET
                first_name = ?, last_name = ?, phone = ?,
                department = COALESCE(?, department),
                qualification = COALESCE(?, qualification),
                updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([
            $data['first_name'],
            $data['last_name'],
            $phone,
            $data['department'] ?? null,
            $data['qualification'] ?? null,
            $existing['id']
        ]);
        return 'updated';
    } elseif (!$existing) {
        // Generate teacher ID
        $year = date('Y');
        $stmt = $pdo->query("SELECT teacher_id FROM teachers WHERE teacher_id LIKE 'TCH$year%' ORDER BY teacher_id DESC LIMIT 1");
        $lastId = $stmt->fetchColumn();
        $nextNum = $lastId ? (int)substr($lastId, strlen("TCH$year")) + 1 : 1;
        $teacherId = 'TCH' . $year . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
        
        $stmt = $pdo->prepare("
            INSERT INTO teachers (teacher_id, first_name, last_name, email, phone, department, qualification, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())
        ");
        $stmt->execute([
            $teacherId,
            $data['first_name'],
            $data['last_name'],
            $email ?: null,
            $phone,
            $data['department'] ?? null,
            $data['qualification'] ?? null
        ]);
        return 'imported';
    }
    
    return 'skipped';
}

function importClass($pdo, $data, $updateExisting) {
    if (empty($data['class_name'])) {
        throw new Exception('Class name is required');
    }
    
    $stmt = $pdo->prepare("SELECT id FROM classes WHERE class_name = ?");
    $stmt->execute([$data['class_name']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing && $updateExisting) {
        $stmt = $pdo->prepare("UPDATE classes SET level = ?, capacity = ? WHERE id = ?");
        $stmt->execute([
            $data['level'] ?? null,
            $data['capacity'] ?? null,
            $existing['id']
        ]);
        return 'updated';
    } elseif (!$existing) {
        $classCode = $data['class_code'] ?? strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $data['class_name']), 0, 10));
        
        $stmt = $pdo->prepare("INSERT INTO classes (class_name, class_code, level, capacity, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([
            $data['class_name'],
            $classCode,
            $data['level'] ?? null,
            $data['capacity'] ?? 30
        ]);
        return 'imported';
    }
    
    return 'skipped';
}

function importSubject($pdo, $data, $updateExisting) {
    if (empty($data['subject_name'])) {
        throw new Exception('Subject name is required');
    }
    
    $stmt = $pdo->prepare("SELECT id FROM subjects WHERE subject_name = ? OR subject_code = ?");
    $stmt->execute([$data['subject_name'], $data['subject_code'] ?? '']);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing && $updateExisting) {
        $stmt = $pdo->prepare("UPDATE subjects SET description = ?, level = ? WHERE id = ?");
        $stmt->execute([
            $data['description'] ?? null,
            $data['level'] ?? null,
            $existing['id']
        ]);
        return 'updated';
    } elseif (!$existing) {
        $subjectCode = $data['subject_code'] ?? strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $data['subject_name']), 0, 6));
        
        $stmt = $pdo->prepare("INSERT INTO subjects (subject_name, subject_code, level, description, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([
            $data['subject_name'],
            $subjectCode,
            $data['level'] ?? null,
            $data['description'] ?? null
        ]);
        return 'imported';
    }
    
    return 'skipped';
}

function importFeeItem($pdo, $data, $updateExisting) {
    if (empty($data['item_name'])) {
        throw new Exception('Item name is required');
    }
    
    $stmt = $pdo->prepare("SELECT id FROM fee_items WHERE item_name = ?");
    $stmt->execute([$data['item_name']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        return 'skipped';
    }
    
    $itemCode = $data['item_code'] ?? strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $data['item_name']), 0, 10));
    
    $stmt = $pdo->prepare("INSERT INTO fee_items (item_name, item_code, description, frequency, status, created_at) VALUES (?, ?, ?, ?, 'active', NOW())");
    $stmt->execute([
        $data['item_name'],
        $itemCode,
        $data['description'] ?? null,
        $data['frequency'] ?? 'term'
    ]);
    return 'imported';
}

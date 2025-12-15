<?php
/**
 * Global Search API
 * Search across students, teachers, classes, and pages
 */

header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$query = $_GET['q'] ?? '';
$userType = $_GET['user_type'] ?? 'admin';
$limit = min((int)($_GET['limit'] ?? 10), 50);

if (strlen($query) < 2) {
    echo json_encode(['success' => true, 'results' => []]);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $results = [];
    $searchTerm = '%' . $query . '%';

    // Search students (admin and teacher only)
    if (in_array($userType, ['admin', 'teacher'])) {
        $stmt = $pdo->prepare("
            SELECT id, student_id, first_name, last_name, email, class_id
            FROM students 
            WHERE first_name LIKE ? OR last_name LIKE ? OR student_id LIKE ? OR email LIKE ?
            LIMIT ?
        ");
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm, $limit]);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($students as $student) {
            $results[] = [
                'type' => 'student',
                'id' => $student['id'],
                'name' => $student['first_name'] . ' ' . $student['last_name'],
                'subtitle' => $student['student_id'],
                'path' => '/admin/students/' . $student['id']
            ];
        }
    }

    // Search teachers (admin only)
    if ($userType === 'admin') {
        $stmt = $pdo->prepare("
            SELECT id, staff_id, first_name, last_name, email, department
            FROM teachers 
            WHERE first_name LIKE ? OR last_name LIKE ? OR staff_id LIKE ? OR email LIKE ?
            LIMIT ?
        ");
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm, $limit]);
        $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($teachers as $teacher) {
            $results[] = [
                'type' => 'teacher',
                'id' => $teacher['id'],
                'name' => $teacher['first_name'] . ' ' . $teacher['last_name'],
                'subtitle' => $teacher['department'] ?? $teacher['staff_id'],
                'path' => '/admin/teachers/' . $teacher['id']
            ];
        }
    }

    // Search classes
    if (in_array($userType, ['admin', 'teacher'])) {
        $stmt = $pdo->prepare("
            SELECT id, class_name, section
            FROM classes 
            WHERE class_name LIKE ? OR section LIKE ?
            LIMIT ?
        ");
        $stmt->execute([$searchTerm, $searchTerm, $limit]);
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($classes as $class) {
            $results[] = [
                'type' => 'class',
                'id' => $class['id'],
                'name' => $class['class_name'],
                'subtitle' => $class['section'] ?? 'Class',
                'path' => '/admin/classes/' . $class['id']
            ];
        }
    }

    // Add page results based on search query
    $pages = [
        // Admin pages
        ['title' => 'Dashboard', 'path' => '/admin/dashboard', 'role' => 'admin', 'keywords' => ['dashboard', 'home', 'overview']],
        ['title' => 'Students', 'path' => '/admin/students', 'role' => 'admin', 'keywords' => ['students', 'pupils', 'learners']],
        ['title' => 'Teachers', 'path' => '/admin/teachers', 'role' => 'admin', 'keywords' => ['teachers', 'staff', 'instructors']],
        ['title' => 'Classes', 'path' => '/admin/classes', 'role' => 'admin', 'keywords' => ['classes', 'forms', 'grades']],
        ['title' => 'Admissions', 'path' => '/admin/admissions', 'role' => 'admin', 'keywords' => ['admissions', 'applications', 'enroll']],
        ['title' => 'Finance', 'path' => '/admin/finance', 'role' => 'admin', 'keywords' => ['finance', 'fees', 'payments', 'invoices']],
        ['title' => 'Attendance', 'path' => '/admin/attendance', 'role' => 'admin', 'keywords' => ['attendance', 'present', 'absent']],
        ['title' => 'Exams', 'path' => '/admin/exams', 'role' => 'admin', 'keywords' => ['exams', 'tests', 'assessments']],
        ['title' => 'Reports', 'path' => '/admin/reports', 'role' => 'admin', 'keywords' => ['reports', 'analytics', 'statistics']],
        ['title' => 'Settings', 'path' => '/admin/settings', 'role' => 'admin', 'keywords' => ['settings', 'configuration', 'preferences']],
        ['title' => 'Messages', 'path' => '/admin/messages', 'role' => 'admin', 'keywords' => ['messages', 'inbox', 'communication']],
        ['title' => 'Notifications', 'path' => '/admin/notifications', 'role' => 'admin', 'keywords' => ['notifications', 'alerts']],
        
        // Teacher pages
        ['title' => 'My Classes', 'path' => '/teacher/classes', 'role' => 'teacher', 'keywords' => ['classes', 'my classes']],
        ['title' => 'Homework', 'path' => '/teacher/homework', 'role' => 'teacher', 'keywords' => ['homework', 'assignments']],
        ['title' => 'Grades', 'path' => '/teacher/grades', 'role' => 'teacher', 'keywords' => ['grades', 'marks', 'scores']],
        
        // Parent pages
        ['title' => 'My Children', 'path' => '/parent/dashboard', 'role' => 'parent', 'keywords' => ['children', 'kids', 'wards']],
        ['title' => 'Invoices', 'path' => '/parent/invoices', 'role' => 'parent', 'keywords' => ['invoices', 'bills', 'fees']],
        ['title' => 'Payments', 'path' => '/parent/payments', 'role' => 'parent', 'keywords' => ['payments', 'pay', 'wallet']],
    ];

    $queryLower = strtolower($query);
    foreach ($pages as $page) {
        if ($page['role'] === $userType || $userType === 'admin') {
            $matches = false;
            if (stripos($page['title'], $query) !== false) {
                $matches = true;
            } else {
                foreach ($page['keywords'] as $keyword) {
                    if (stripos($keyword, $queryLower) !== false) {
                        $matches = true;
                        break;
                    }
                }
            }
            
            if ($matches) {
                $results[] = [
                    'type' => 'page',
                    'title' => $page['title'],
                    'path' => $page['path'],
                    'subtitle' => 'Page'
                ];
            }
        }
    }

    // Limit total results
    $results = array_slice($results, 0, $limit);

    echo json_encode(['success' => true, 'results' => $results]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

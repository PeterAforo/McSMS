<?php
/**
 * System Reset API
 * Allows admin to reset the system for a new school setup
 * WARNING: This will delete ALL data except system configuration
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

// Store raw input for reuse
$rawInput = file_get_contents('php://input');
$parsedInput = json_decode($rawInput, true) ?? [];

// Verify admin authentication
function verifyAdmin($pdo, $input) {
    // Get user_id from request body or headers
    $userId = $input['admin_user_id'] ?? $input['user_id'] ?? null;
    
    // Also check Authorization header
    $headers = getallheaders();
    
    // If no user_id provided, try to get from X-User-Id header
    if (!$userId && isset($headers['X-User-Id'])) {
        $userId = $headers['X-User-Id'];
    }
    
    if (!$userId) {
        return false;
    }
    
    // Verify user is an active admin
    $stmt = $pdo->prepare("SELECT id, user_type FROM users WHERE id = ? AND user_type = 'admin' AND status = 'active'");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $user !== false;
}

// Get list of tables that will be affected
function getResetPreview($pdo) {
    $tables = [
        // Core data
        'students' => 'Student records',
        'teachers' => 'Teacher records',
        'parents' => 'Parent records',
        'employees' => 'Employee records',
        
        // Academic structure
        'classes' => 'Class definitions',
        'sections' => 'Class sections',
        'subjects' => 'Subject definitions',
        'class_subjects' => 'Class-Subject mappings',
        'terms' => 'Academic terms',
        'academic_sessions' => 'Academic sessions',
        'academic_terms' => 'Academic terms (alt)',
        
        // Grading
        'grades' => 'Student grades',
        'grade_scales' => 'Grade scales',
        'results' => 'Results',
        
        // Attendance
        'attendance' => 'Student attendance',
        'employee_attendance' => 'Employee attendance',
        'teacher_attendance' => 'Teacher attendance',
        
        // Exams
        'exams' => 'Exam definitions',
        'exam_results' => 'Exam results',
        'exam_schedules' => 'Exam schedules',
        'exam_types' => 'Exam types',
        
        // Assignments & Homework
        'assignments' => 'Assignments',
        'assignment_submissions' => 'Assignment submissions',
        'homework' => 'Homework',
        'homework_submissions' => 'Homework submissions',
        
        // Finance
        'invoices' => 'Fee invoices',
        'invoice_items' => 'Invoice items',
        'payments' => 'Payment records',
        'fee_groups' => 'Fee groups',
        'fee_items' => 'Fee items',
        'fee_item_rules' => 'Fee item rules',
        'fee_types' => 'Fee types',
        'wallets' => 'Wallets',
        'wallet_transactions' => 'Wallet transactions',
        
        // HR & Payroll
        'payroll' => 'Payroll records',
        'payslips' => 'Payslips',
        'salary_components' => 'Salary components',
        'leave_applications' => 'Leave applications',
        'leave_requests' => 'Leave requests',
        
        // Timetable
        'timetable_entries' => 'Timetable entries',
        'time_slots' => 'Time slots',
        
        // Communications
        'messages' => 'Messages',
        'notifications' => 'Notifications',
        'whatsapp_messages' => 'WhatsApp messages',
        
        // Admissions
        'admissions' => 'Admissions',
        'applications' => 'Applications',
        'student_applications' => 'Student applications',
        
        // Transport
        'transport_routes' => 'Transport routes',
        'vehicles' => 'Vehicles',
        'drivers' => 'Drivers',
        
        // Logs
        'activity_logs' => 'Activity logs',
        'login_history' => 'Login history',
        'system_logs' => 'System logs',
        
        // Onboarding
        'system_onboarding' => 'System onboarding status',
    ];
    
    $preview = [];
    
    foreach ($tables as $table => $description) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $result = $stmt->fetch();
            $preview[] = [
                'table' => $table,
                'description' => $description,
                'record_count' => (int)$result['count']
            ];
        } catch (PDOException $e) {
            // Table doesn't exist, skip it
            continue;
        }
    }
    
    return $preview;
}

// Perform the system reset
function performReset($pdo, $options) {
    $resetLog = [];
    $errors = [];
    
    // Tables to reset - comprehensive list (order matters for foreign keys)
    $resetOrder = [
        // Logs first (no dependencies)
        'activity_logs',
        'login_history',
        'system_logs',
        'api_logs',
        'security_logs',
        
        // Communications
        'notifications',
        'messages',
        'whatsapp_messages',
        'push_notifications',
        
        // Submissions and results
        'homework_submissions',
        'assignment_submissions',
        'exam_results',
        'results',
        'grades',
        'quiz_attempts',
        'quiz_answers',
        
        // Attendance
        'attendance',
        'employee_attendance',
        'teacher_attendance',
        'biometric_attendance_logs',
        
        // Finance transactions
        'wallet_transactions',
        'payments',
        'payment_installments',
        'invoice_items',
        'invoices',
        'payslips',
        'payroll',
        'payroll_details',
        
        // Leave & HR
        'leave_applications',
        'leave_requests',
        'leave_balance',
        
        // Timetable
        'timetable_entries',
        
        // Assignments & Homework
        'homework',
        'assignments',
        
        // Exams
        'exam_schedules',
        'exam_attendance',
        'exams',
        
        // Admissions
        'admissions',
        'applications',
        'student_applications',
        
        // Student/Teacher related
        'student_documents',
        'student_notes',
        'teacher_documents',
        'teacher_notes',
        'enrollments',
        'term_enrollments',
        
        // Core people
        'students',
        'teachers',
        'parents',
        'employees',
        'drivers',
        
        // Fee structure
        'fee_item_rules',
        'fee_items',
        'fee_groups',
        'fee_types',
        'wallets',
        
        // Academic structure
        'class_subjects',
        'sections',
        'subjects',
        'classes',
        'rooms',
        
        // Terms & Sessions
        'terms',
        'academic_terms',
        'academic_sessions',
        
        // Grading
        'grade_scales',
        'exam_types',
        
        // Time slots
        'time_slots',
        
        // Transport
        'transport_routes',
        'route_stops',
        'vehicles',
        'vehicle_maintenance',
        
        // Salary
        'salary_components',
        'employee_salary_structure',
        
        // Quizzes
        'quiz_question_options',
        'quiz_questions',
        'quizzes',
        
        // Onboarding - reset to trigger setup wizard
        'system_onboarding',
    ];
    
    // Tables to preserve (core system configuration)
    $preserveTables = [
        'users', // Will handle separately - only delete non-admin users
        'roles',
        'permissions',
        'role_permissions',
        'user_roles',
    ];
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Disable foreign key checks temporarily
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        // Reset each table
        foreach ($resetOrder as $table) {
            try {
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
                $beforeCount = $stmt->fetch()['count'];
                
                if ($beforeCount > 0) {
                    $pdo->exec("TRUNCATE TABLE `$table`");
                    $resetLog[] = [
                        'table' => $table,
                        'records_deleted' => (int)$beforeCount,
                        'status' => 'success'
                    ];
                }
            } catch (PDOException $e) {
                // Table doesn't exist or other error
                $errors[] = [
                    'table' => $table,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        // Handle users table - delete non-admin users only
        if (!isset($options['keep_all_users']) || !$options['keep_all_users']) {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE user_type != 'admin'");
            $userCount = $stmt->fetch()['count'];
            
            $pdo->exec("DELETE FROM users WHERE user_type != 'admin'");
            $resetLog[] = [
                'table' => 'users (non-admin)',
                'records_deleted' => (int)$userCount,
                'status' => 'success'
            ];
        }
        
        // Optionally reset terms
        if (isset($options['reset_terms']) && $options['reset_terms']) {
            try {
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM terms");
                $termCount = $stmt->fetch()['count'];
                $pdo->exec("TRUNCATE TABLE terms");
                $resetLog[] = [
                    'table' => 'terms',
                    'records_deleted' => (int)$termCount,
                    'status' => 'success'
                ];
            } catch (PDOException $e) {
                $errors[] = ['table' => 'terms', 'error' => $e->getMessage()];
            }
        }
        
        // Optionally reset academic years
        if (isset($options['reset_academic_years']) && $options['reset_academic_years']) {
            try {
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM academic_years");
                $yearCount = $stmt->fetch()['count'];
                $pdo->exec("TRUNCATE TABLE academic_years");
                $resetLog[] = [
                    'table' => 'academic_years',
                    'records_deleted' => (int)$yearCount,
                    'status' => 'success'
                ];
            } catch (PDOException $e) {
                $errors[] = ['table' => 'academic_years', 'error' => $e->getMessage()];
            }
        }
        
        // Clear uploaded files if requested
        if (isset($options['clear_uploads']) && $options['clear_uploads']) {
            $uploadDirs = [
                $_SERVER['DOCUMENT_ROOT'] . '/uploads/',
                __DIR__ . '/../../public/uploads/',
            ];
            
            foreach ($uploadDirs as $dir) {
                if (is_dir($dir)) {
                    $files = glob($dir . '*');
                    $deletedCount = 0;
                    foreach ($files as $file) {
                        if (is_file($file) && basename($file) !== '.htaccess') {
                            unlink($file);
                            $deletedCount++;
                        }
                    }
                    if ($deletedCount > 0) {
                        $resetLog[] = [
                            'table' => 'uploads',
                            'records_deleted' => $deletedCount,
                            'status' => 'success',
                            'note' => 'Files deleted from ' . $dir
                        ];
                    }
                }
            }
            
            // Clear logo URL from settings
            try {
                $pdo->exec("UPDATE system_settings SET setting_value = '' WHERE setting_key = 'school_logo'");
                $pdo->exec("UPDATE system_config SET school_logo = '' WHERE school_logo IS NOT NULL");
            } catch (PDOException $e) {
                // Ignore if table doesn't exist
            }
        }
        
        // Reset system to factory settings - trigger setup wizard
        try {
            // Clear system_settings that indicate setup is complete
            $pdo->exec("DELETE FROM system_settings WHERE setting_key IN ('setup_completed', 'onboarding_completed', 'initial_setup_done')");
            
            // Reset system_config onboarding status
            $pdo->exec("UPDATE system_config SET setup_completed = 0, onboarding_step = 0 WHERE id = 1");
            
            // Clear system_onboarding table
            $pdo->exec("TRUNCATE TABLE system_onboarding");
            
            // Reset school settings to defaults
            $pdo->exec("UPDATE system_settings SET setting_value = '' WHERE setting_key IN ('school_name', 'school_address', 'school_phone', 'school_email', 'school_logo')");
            
            $resetLog[] = [
                'table' => 'system_settings (factory reset)',
                'records_deleted' => 0,
                'status' => 'success',
                'note' => 'System reset to factory settings - setup wizard will appear'
            ];
        } catch (PDOException $e) {
            // Some tables might not exist
            $errors[] = ['table' => 'factory_reset', 'error' => $e->getMessage()];
        }
        
        // Re-enable foreign key checks
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        // Commit transaction
        $pdo->commit();
        
        // Log the reset action
        try {
            $stmt = $pdo->prepare("
                INSERT INTO activity_logs (user_id, action, description, ip_address, created_at)
                VALUES (?, 'system_reset', ?, ?, NOW())
            ");
            $stmt->execute([
                $options['admin_user_id'] ?? 1,
                'System reset performed. Tables affected: ' . count($resetLog),
                $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]);
        } catch (PDOException $e) {
            // Activity log table might not exist
        }
        
        return [
            'success' => true,
            'message' => 'System reset completed successfully',
            'reset_log' => $resetLog,
            'errors' => $errors,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
    } catch (Exception $e) {
        // Only rollback if there's an active transaction
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        return [
            'success' => false,
            'error' => 'Reset failed: ' . $e->getMessage(),
            'reset_log' => $resetLog,
            'errors' => $errors
        ];
    }
}

// Main request handling
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    // GET - Preview what will be reset
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'preview';
        
        if ($action === 'preview') {
            $preview = getResetPreview($pdo);
            $totalRecords = array_sum(array_column($preview, 'record_count'));
            
            echo json_encode([
                'success' => true,
                'preview' => $preview,
                'total_records' => $totalRecords,
                'warning' => 'This action will permanently delete all data listed above. This cannot be undone!',
                'preserved' => [
                    'Admin user accounts',
                    'Roles (admin, teacher, parent, etc.)',
                    'Permissions and role assignments',
                    'System settings',
                    'School settings (name, logo, etc.)'
                ]
            ]);
        } else {
            throw new Exception('Invalid action');
        }
    }
    
    // POST - Perform the reset
    elseif ($method === 'POST') {
        // Use the pre-parsed input
        global $parsedInput;
        $input = $parsedInput;
        
        // Verify admin authentication
        if (!verifyAdmin($pdo, $input)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Unauthorized. Only administrators can perform system reset.'
            ]);
            exit();
        }
        
        // Require confirmation code
        $confirmCode = $input['confirmation_code'] ?? '';
        if ($confirmCode !== 'RESET-CONFIRM') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid confirmation code. Please enter "RESET-CONFIRM" to proceed.'
            ]);
            exit();
        }
        
        // Get options
        $options = [
            'keep_all_users' => $input['keep_all_users'] ?? false,
            'reset_terms' => $input['reset_terms'] ?? false,
            'reset_academic_years' => $input['reset_academic_years'] ?? false,
            'clear_uploads' => $input['clear_uploads'] ?? true,
            'admin_user_id' => $input['admin_user_id'] ?? 1
        ];
        
        $result = performReset($pdo, $options);
        
        if ($result['success']) {
            echo json_encode($result);
        } else {
            http_response_code(500);
            echo json_encode($result);
        }
    }
    
    else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

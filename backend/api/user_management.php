<?php
/**
 * Enhanced User Management API
 * Features: CRUD, Roles, Permissions, Audit, Bulk Operations, Password Reset, Sessions
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? 'users';
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($resource) {
        // ============================================
        // USERS RESOURCE
        // ============================================
        case 'users':
            handleUsers($pdo, $method, $action, $id);
            break;

        // ============================================
        // ROLES RESOURCE
        // ============================================
        case 'roles':
            handleRoles($pdo, $method, $action, $id);
            break;

        // ============================================
        // PERMISSIONS RESOURCE
        // ============================================
        case 'permissions':
            handlePermissions($pdo, $method, $action, $id);
            break;

        // ============================================
        // ACTIVITY LOGS RESOURCE
        // ============================================
        case 'activity':
            handleActivityLogs($pdo, $method, $action, $id);
            break;

        // ============================================
        // LOGIN HISTORY RESOURCE
        // ============================================
        case 'login_history':
            handleLoginHistory($pdo, $method, $action, $id);
            break;

        // ============================================
        // PASSWORD RESET RESOURCE
        // ============================================
        case 'password':
            handlePasswordReset($pdo, $method, $action);
            break;

        // ============================================
        // SESSIONS RESOURCE
        // ============================================
        case 'sessions':
            handleSessions($pdo, $method, $action, $id);
            break;

        // ============================================
        // BULK OPERATIONS RESOURCE
        // ============================================
        case 'bulk':
            handleBulkOperations($pdo, $method, $action);
            break;

        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Resource not found']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// USERS HANDLER
// ============================================
function handleUsers($pdo, $method, $action, $id) {
    switch ($method) {
        case 'GET':
            if ($action === 'pending') {
                // Get pending users
                $stmt = $pdo->query("SELECT id, name, email, phone, user_type, status, created_at FROM users WHERE status = 'pending' ORDER BY created_at DESC");
                echo json_encode(['success' => true, 'users' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } elseif ($action === 'stats') {
                // Get user statistics
                $stats = [];
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM users");
                $stats['total'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as active FROM users WHERE status = 'active'");
                $stats['active'] = $stmt->fetch(PDO::FETCH_ASSOC)['active'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as pending FROM users WHERE status = 'pending'");
                $stats['pending'] = $stmt->fetch(PDO::FETCH_ASSOC)['pending'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as inactive FROM users WHERE status = 'inactive'");
                $stats['inactive'] = $stmt->fetch(PDO::FETCH_ASSOC)['inactive'];
                
                $stmt = $pdo->query("SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type");
                $stats['by_role'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $stmt = $pdo->query("SELECT COUNT(*) as today FROM users WHERE DATE(created_at) = CURDATE()");
                $stats['registered_today'] = $stmt->fetch(PDO::FETCH_ASSOC)['today'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as week FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)");
                $stats['registered_week'] = $stmt->fetch(PDO::FETCH_ASSOC)['week'];
                
                echo json_encode(['success' => true, 'stats' => $stats]);
            } elseif ($action === 'roles' && $id) {
                // Get user's roles
                $stmt = $pdo->prepare("
                    SELECT r.* FROM roles r
                    JOIN user_roles ur ON r.id = ur.role_id
                    WHERE ur.user_id = ?
                ");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'roles' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } elseif ($action === 'permissions' && $id) {
                // Get user's permissions
                $stmt = $pdo->prepare("
                    SELECT DISTINCT p.* FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    JOIN user_roles ur ON rp.role_id = ur.role_id
                    WHERE ur.user_id = ?
                ");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'permissions' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } elseif ($id) {
                // Get single user with roles
                $stmt = $pdo->prepare("
                    SELECT u.id, u.name, u.email, u.phone, u.user_type, u.status, 
                           u.profile_picture, u.last_login, u.email_verified_at,
                           u.must_change_password, u.created_at, u.updated_at
                    FROM users u WHERE u.id = ?
                ");
                $stmt->execute([$id]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'User not found']);
                    return;
                }
                
                // Get user roles
                $stmt = $pdo->prepare("SELECT r.role_name, r.display_name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?");
                $stmt->execute([$id]);
                $user['roles'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'user' => $user]);
            } else {
                // Get all users with pagination
                $page = $_GET['page'] ?? 1;
                $limit = $_GET['limit'] ?? 50;
                $search = $_GET['search'] ?? '';
                $role = $_GET['role'] ?? '';
                $status = $_GET['status'] ?? '';
                $offset = ($page - 1) * $limit;
                
                $where = "1=1";
                $params = [];
                
                if ($search) {
                    $where .= " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }
                if ($role) {
                    $where .= " AND u.user_type = ?";
                    $params[] = $role;
                }
                if ($status) {
                    $where .= " AND u.status = ?";
                    $params[] = $status;
                }
                
                // Get total count
                $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM users u WHERE $where");
                $stmt->execute($params);
                $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Get users - use direct integer values for LIMIT/OFFSET
                $limitInt = (int)$limit;
                $offsetInt = (int)$offset;
                $stmt = $pdo->prepare("
                    SELECT u.id, u.name, u.email, u.phone, u.user_type, u.status, 
                           u.profile_picture, u.last_login, u.created_at
                    FROM users u 
                    WHERE $where 
                    ORDER BY u.created_at DESC 
                    LIMIT $limitInt OFFSET $offsetInt
                ");
                $stmt->execute($params);
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true, 
                    'users' => $users,
                    'pagination' => [
                        'total' => $total,
                        'page' => (int)$page,
                        'limit' => (int)$limit,
                        'pages' => ceil($total / $limit)
                    ]
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'approve') {
                // Approve pending user
                $stmt = $pdo->prepare("UPDATE users SET status = 'active', user_type = ? WHERE id = ?");
                $stmt->execute([$data['user_type'] ?? 'teacher', $data['user_id']]);
                
                logActivity($pdo, null, 'status_change', 'users', 'user', $data['user_id'], 'User approved');
                echo json_encode(['success' => true, 'message' => 'User approved successfully']);
            } elseif ($action === 'reject') {
                // Reject pending user
                $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND status = 'pending'");
                $stmt->execute([$data['user_id']]);
                
                logActivity($pdo, null, 'delete', 'users', 'user', $data['user_id'], 'User registration rejected');
                echo json_encode(['success' => true, 'message' => 'User rejected successfully']);
            } elseif ($action === 'assign_role') {
                // Assign role to user
                $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE assigned_by = ?");
                $stmt->execute([$data['user_id'], $data['role_id'], $data['assigned_by'] ?? null, $data['assigned_by'] ?? null]);
                
                logActivity($pdo, $data['assigned_by'] ?? null, 'role_change', 'users', 'user', $data['user_id'], 'Role assigned');
                echo json_encode(['success' => true, 'message' => 'Role assigned successfully']);
            } elseif ($action === 'remove_role') {
                // Remove role from user
                $stmt = $pdo->prepare("DELETE FROM user_roles WHERE user_id = ? AND role_id = ?");
                $stmt->execute([$data['user_id'], $data['role_id']]);
                
                logActivity($pdo, null, 'role_change', 'users', 'user', $data['user_id'], 'Role removed');
                echo json_encode(['success' => true, 'message' => 'Role removed successfully']);
            } else {
                // Create new user
                if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Name, email, and password are required']);
                    return;
                }
                
                // Check email exists
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$data['email']]);
                if ($stmt->fetch()) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Email already exists']);
                    return;
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO users (name, email, phone, user_type, password, status, must_change_password, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $data['name'],
                    $data['email'],
                    $data['phone'] ?? '',
                    $data['user_type'] ?? 'teacher',
                    password_hash($data['password'], PASSWORD_DEFAULT),
                    $data['status'] ?? 'active',
                    $data['must_change_password'] ?? false
                ]);
                
                $userId = $pdo->lastInsertId();
                
                // Assign default role
                $stmt = $pdo->prepare("SELECT id FROM roles WHERE role_name = ?");
                $stmt->execute([$data['user_type'] ?? 'teacher']);
                $role = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($role) {
                    $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)")->execute([$userId, $role['id']]);
                }
                
                logActivity($pdo, null, 'create', 'users', 'user', $userId, 'User created: ' . $data['email']);
                
                $stmt = $pdo->prepare("SELECT id, name, email, phone, user_type, status, created_at FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                
                http_response_code(201);
                echo json_encode(['success' => true, 'message' => 'User created successfully', 'user' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            }
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'User ID required']);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Get old values for audit
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $oldUser = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $updates = [];
            $params = [];
            
            if (isset($data['name'])) { $updates[] = "name = ?"; $params[] = $data['name']; }
            if (isset($data['email'])) { $updates[] = "email = ?"; $params[] = $data['email']; }
            if (isset($data['phone'])) { $updates[] = "phone = ?"; $params[] = $data['phone']; }
            if (isset($data['user_type'])) { $updates[] = "user_type = ?"; $params[] = $data['user_type']; }
            if (isset($data['status'])) { $updates[] = "status = ?"; $params[] = $data['status']; }
            if (isset($data['profile_picture'])) { $updates[] = "profile_picture = ?"; $params[] = $data['profile_picture']; }
            if (isset($data['must_change_password'])) { $updates[] = "must_change_password = ?"; $params[] = $data['must_change_password']; }
            if (isset($data['password']) && !empty($data['password'])) {
                $updates[] = "password = ?";
                $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No fields to update']);
                return;
            }
            
            $params[] = $id;
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            logActivity($pdo, null, 'update', 'users', 'user', $id, 'User updated', json_encode($oldUser), json_encode($data));
            
            $stmt = $pdo->prepare("SELECT id, name, email, phone, user_type, status, profile_picture, created_at FROM users WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'User updated successfully', 'user' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'User ID required']);
                return;
            }
            
            // Get user info for audit
            $stmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            
            logActivity($pdo, null, 'delete', 'users', 'user', $id, 'User deleted: ' . ($user['email'] ?? 'unknown'));
            
            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
            break;
    }
}

// ============================================
// ROLES HANDLER
// ============================================
function handleRoles($pdo, $method, $action, $id) {
    switch ($method) {
        case 'GET':
            if ($action === 'with_permissions' && $id) {
                // Get role with its permissions
                $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
                $stmt->execute([$id]);
                $role = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $stmt = $pdo->prepare("
                    SELECT p.* FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ?
                ");
                $stmt->execute([$id]);
                $role['permissions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'role' => $role]);
            } elseif ($id) {
                $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'role' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $stmt = $pdo->query("SELECT r.*, (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) as user_count FROM roles r ORDER BY r.role_name");
                echo json_encode(['success' => true, 'roles' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'assign_permission') {
                $stmt = $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = role_id");
                $stmt->execute([$data['role_id'], $data['permission_id']]);
                echo json_encode(['success' => true, 'message' => 'Permission assigned']);
            } elseif ($action === 'remove_permission') {
                $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?");
                $stmt->execute([$data['role_id'], $data['permission_id']]);
                echo json_encode(['success' => true, 'message' => 'Permission removed']);
            } else {
                $stmt = $pdo->prepare("INSERT INTO roles (role_name, display_name, description) VALUES (?, ?, ?)");
                $stmt->execute([$data['role_name'], $data['display_name'], $data['description'] ?? '']);
                echo json_encode(['success' => true, 'message' => 'Role created', 'id' => $pdo->lastInsertId()]);
            }
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Role ID required']);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE roles SET display_name = ?, description = ? WHERE id = ? AND is_system_role = FALSE");
            $stmt->execute([$data['display_name'], $data['description'] ?? '', $id]);
            echo json_encode(['success' => true, 'message' => 'Role updated']);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Role ID required']);
                return;
            }
            
            $stmt = $pdo->prepare("DELETE FROM roles WHERE id = ? AND is_system_role = FALSE");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Role deleted']);
            break;
    }
}

// ============================================
// PERMISSIONS HANDLER
// ============================================
function handlePermissions($pdo, $method, $action, $id) {
    switch ($method) {
        case 'GET':
            if ($action === 'by_module') {
                $stmt = $pdo->query("SELECT module, GROUP_CONCAT(permission_name) as permissions FROM permissions GROUP BY module");
                echo json_encode(['success' => true, 'modules' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } else {
                $stmt = $pdo->query("SELECT * FROM permissions ORDER BY module, permission_name");
                echo json_encode(['success' => true, 'permissions' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
    }
}

// ============================================
// ACTIVITY LOGS HANDLER
// ============================================
function handleActivityLogs($pdo, $method, $action, $id) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 50;
    $userId = $_GET['user_id'] ?? null;
    $actionType = $_GET['action_type'] ?? null;
    $module = $_GET['module'] ?? null;
    $dateFrom = $_GET['date_from'] ?? null;
    $dateTo = $_GET['date_to'] ?? null;
    $offset = ($page - 1) * $limit;

    $where = "1=1";
    $params = [];

    if ($userId) { $where .= " AND al.user_id = ?"; $params[] = $userId; }
    if ($actionType) { $where .= " AND al.action_type = ?"; $params[] = $actionType; }
    if ($module) { $where .= " AND al.module = ?"; $params[] = $module; }
    if ($dateFrom) { $where .= " AND DATE(al.created_at) >= ?"; $params[] = $dateFrom; }
    if ($dateTo) { $where .= " AND DATE(al.created_at) <= ?"; $params[] = $dateTo; }

    // Get total
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM user_activity_logs al WHERE $where");
    $stmt->execute($params);
    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get logs - use direct integer values in query to avoid PDO type issues
    $limitInt = (int)$limit;
    $offsetInt = (int)$offset;
    $stmt = $pdo->prepare("
        SELECT al.*, u.name as user_name, u.email as user_email
        FROM user_activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE $where
        ORDER BY al.created_at DESC
        LIMIT $limitInt OFFSET $offsetInt
    ");
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'logs' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        'pagination' => ['total' => $total, 'page' => (int)$page, 'limit' => (int)$limit, 'pages' => ceil($total / $limit)]
    ]);
}

// ============================================
// LOGIN HISTORY HANDLER
// ============================================
function handleLoginHistory($pdo, $method, $action, $id) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $userId = $_GET['user_id'] ?? null;
    $limitInt = (int)($_GET['limit'] ?? 50);

    if ($userId) {
        $stmt = $pdo->prepare("
            SELECT lh.*, u.name as user_name 
            FROM login_history lh
            JOIN users u ON lh.user_id = u.id
            WHERE lh.user_id = ?
            ORDER BY lh.login_time DESC
            LIMIT $limitInt
        ");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->query("
            SELECT lh.*, u.name as user_name, u.email as user_email
            FROM login_history lh
            JOIN users u ON lh.user_id = u.id
            ORDER BY lh.login_time DESC
            LIMIT $limitInt
        ");
    }

    echo json_encode(['success' => true, 'history' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

// ============================================
// PASSWORD RESET HANDLER
// ============================================
function handlePasswordReset($pdo, $method, $action) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'request') {
        // Request password reset
        $email = $data['email'] ?? '';
        
        $stmt = $pdo->prepare("SELECT id, name FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            // Don't reveal if email exists
            echo json_encode(['success' => true, 'message' => 'If the email exists, a reset link will be sent']);
            return;
        }
        
        // Generate token
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        $stmt = $pdo->prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user['id'], $token, $expires, $_SERVER['REMOTE_ADDR'] ?? '']);
        
        // In production, send email with reset link
        // For now, return token (remove in production)
        echo json_encode([
            'success' => true, 
            'message' => 'Password reset link sent to email',
            'token' => $token // Remove in production
        ]);
        
    } elseif ($action === 'reset') {
        // Reset password with token
        $token = $data['token'] ?? '';
        $newPassword = $data['password'] ?? '';
        
        if (strlen($newPassword) < 8) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters']);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT prt.*, u.email FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id
            WHERE prt.token = ? AND prt.expires_at > NOW() AND prt.used_at IS NULL
        ");
        $stmt->execute([$token]);
        $reset = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$reset) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
            return;
        }
        
        // Update password
        $stmt = $pdo->prepare("UPDATE users SET password = ?, must_change_password = FALSE WHERE id = ?");
        $stmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), $reset['user_id']]);
        
        // Mark token as used
        $stmt = $pdo->prepare("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?");
        $stmt->execute([$reset['id']]);
        
        logActivity($pdo, $reset['user_id'], 'password_reset', 'users', 'user', $reset['user_id'], 'Password reset via token');
        
        echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
        
    } elseif ($action === 'change') {
        // Change password (authenticated user)
        $userId = $data['user_id'] ?? '';
        $currentPassword = $data['current_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($currentPassword, $user['password'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE users SET password = ?, must_change_password = FALSE WHERE id = ?");
        $stmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), $userId]);
        
        logActivity($pdo, $userId, 'password_change', 'users', 'user', $userId, 'Password changed');
        
        echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
        
    } elseif ($action === 'admin_reset') {
        // Admin force reset password
        $userId = $data['user_id'] ?? '';
        $newPassword = $data['password'] ?? '';
        $mustChange = $data['must_change_password'] ?? true;
        
        $stmt = $pdo->prepare("UPDATE users SET password = ?, must_change_password = ? WHERE id = ?");
        $stmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), $mustChange, $userId]);
        
        logActivity($pdo, null, 'password_reset', 'users', 'user', $userId, 'Password reset by admin');
        
        echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
    }
}

// ============================================
// SESSIONS HANDLER
// ============================================
function handleSessions($pdo, $method, $action, $id) {
    switch ($method) {
        case 'GET':
            $userId = $_GET['user_id'] ?? null;
            
            if ($userId) {
                $stmt = $pdo->prepare("SELECT * FROM user_sessions WHERE user_id = ? AND is_active = TRUE ORDER BY last_activity DESC");
                $stmt->execute([$userId]);
            } else {
                $stmt = $pdo->query("
                    SELECT us.*, u.name as user_name, u.email as user_email
                    FROM user_sessions us
                    JOIN users u ON us.user_id = u.id
                    WHERE us.is_active = TRUE
                    ORDER BY us.last_activity DESC
                    LIMIT 100
                ");
            }
            echo json_encode(['success' => true, 'sessions' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            if ($action === 'terminate') {
                $data = json_decode(file_get_contents('php://input'), true);
                $sessionId = $data['session_id'] ?? $id;
                
                $stmt = $pdo->prepare("UPDATE user_sessions SET is_active = FALSE WHERE id = ?");
                $stmt->execute([$sessionId]);
                echo json_encode(['success' => true, 'message' => 'Session terminated']);
            } elseif ($action === 'terminate_all') {
                $data = json_decode(file_get_contents('php://input'), true);
                $userId = $data['user_id'] ?? null;
                
                if ($userId) {
                    $stmt = $pdo->prepare("UPDATE user_sessions SET is_active = FALSE WHERE user_id = ?");
                    $stmt->execute([$userId]);
                } else {
                    $pdo->query("UPDATE user_sessions SET is_active = FALSE");
                }
                echo json_encode(['success' => true, 'message' => 'All sessions terminated']);
            }
            break;
    }
}

// ============================================
// BULK OPERATIONS HANDLER
// ============================================
function handleBulkOperations($pdo, $method, $action) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'import') {
        // Bulk import users
        $users = $data['users'] ?? [];
        $importedBy = $data['imported_by'] ?? null;
        
        $successful = 0;
        $failed = 0;
        $errors = [];
        
        foreach ($users as $index => $user) {
            try {
                if (empty($user['name']) || empty($user['email'])) {
                    throw new Exception('Name and email are required');
                }
                
                // Check email exists
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$user['email']]);
                if ($stmt->fetch()) {
                    throw new Exception('Email already exists');
                }
                
                $password = $user['password'] ?? bin2hex(random_bytes(4)); // Generate random password if not provided
                
                $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, user_type, password, status, must_change_password, created_at) VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW())");
                $stmt->execute([
                    $user['name'],
                    $user['email'],
                    $user['phone'] ?? '',
                    $user['user_type'] ?? 'teacher',
                    password_hash($password, PASSWORD_DEFAULT),
                    $user['status'] ?? 'active'
                ]);
                
                $successful++;
            } catch (Exception $e) {
                $failed++;
                $errors[] = ['row' => $index + 1, 'email' => $user['email'] ?? 'N/A', 'error' => $e->getMessage()];
            }
        }
        
        // Log import
        $stmt = $pdo->prepare("INSERT INTO user_import_logs (imported_by, total_records, successful_imports, failed_imports, error_details, status, completed_at) VALUES (?, ?, ?, ?, ?, 'completed', NOW())");
        $stmt->execute([$importedBy, count($users), $successful, $failed, json_encode($errors)]);
        
        echo json_encode([
            'success' => true,
            'message' => "Import completed: $successful successful, $failed failed",
            'successful' => $successful,
            'failed' => $failed,
            'errors' => $errors
        ]);
        
    } elseif ($action === 'export') {
        // Export users
        $filters = $data['filters'] ?? [];
        
        $where = "1=1";
        $params = [];
        
        if (!empty($filters['role'])) {
            $where .= " AND user_type = ?";
            $params[] = $filters['role'];
        }
        if (!empty($filters['status'])) {
            $where .= " AND status = ?";
            $params[] = $filters['status'];
        }
        
        $stmt = $pdo->prepare("SELECT id, name, email, phone, user_type, status, created_at, last_login FROM users WHERE $where ORDER BY name");
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        logActivity($pdo, $data['exported_by'] ?? null, 'export', 'users', 'user', null, 'Exported ' . count($users) . ' users');
        
        echo json_encode(['success' => true, 'users' => $users, 'count' => count($users)]);
        
    } elseif ($action === 'update_status') {
        // Bulk update status
        $userIds = $data['user_ids'] ?? [];
        $status = $data['status'] ?? 'active';
        
        if (empty($userIds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No users selected']);
            return;
        }
        
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $params = array_merge([$status], $userIds);
        
        $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id IN ($placeholders)");
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => count($userIds) . ' users updated']);
        
    } elseif ($action === 'delete') {
        // Bulk delete
        $userIds = $data['user_ids'] ?? [];
        
        if (empty($userIds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No users selected']);
            return;
        }
        
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $stmt = $pdo->prepare("DELETE FROM users WHERE id IN ($placeholders)");
        $stmt->execute($userIds);
        
        logActivity($pdo, null, 'delete', 'users', 'user', null, 'Bulk deleted ' . count($userIds) . ' users');
        
        echo json_encode(['success' => true, 'message' => count($userIds) . ' users deleted']);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function logActivity($pdo, $userId, $actionType, $module, $entityType, $entityId, $description, $oldValues = null, $newValues = null) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO user_activity_logs (user_id, action_type, module, entity_type, entity_id, description, old_values, new_values, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userId,
            $actionType,
            $module,
            $entityType,
            $entityId,
            $description,
            $oldValues,
            $newValues,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    } catch (Exception $e) {
        // Silently fail - don't break main operation
    }
}

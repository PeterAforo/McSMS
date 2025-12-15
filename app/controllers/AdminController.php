<?php
/**
 * Admin Controller
 * Handles admin dashboard and system management
 */

class AdminController extends Controller {
    
    public function __construct() {
        // Require admin role
        $this->requireRole('admin');
    }
    
    /**
     * Admin Dashboard
     */
    public function dashboard() {
        // Get statistics
        $userModel = new User();
        $stats = [
            'total_students' => $this->getStudentCount(),
            'total_teachers' => $this->getUserCountByType('teacher'),
            'total_parents' => $this->getUserCountByType('parent'),
            'total_staff' => $this->getUserCountByType('admin') + $this->getUserCountByType('finance'),
            'pending_admissions' => $this->getPendingAdmissionsCount(),
        ];
        
        // Sidebar items
        $sidebarItems = $this->getAdminSidebar();
        
        $this->render('dashboard/admin_dashboard', [
            'pageTitle' => 'School Dashboard - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $sidebarItems,
            'stats' => $stats
        ], 'modern');
    }
    
    /**
     * User Management
     */
    public function users() {
        $userModel = new User();
        $users = $userModel->findAll([], 'created_at DESC');
        
        $this->render('admin/users', [
            'pageTitle' => 'User Management - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'users' => $users
        ], 'modern');
    }
    
    /**
     * System Settings
     */
    public function settings() {
        $settingModel = new Setting();
        $settings = $settingModel->getAll();
        
        $this->render('admin/settings', [
            'pageTitle' => 'System Settings - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'settings' => $settings
        ], 'modern');
    }
    
    /**
     * Update Settings
     */
    public function updateSettings() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('admin', 'settings');
        }
        
        $settingModel = new Setting();
        
        try {
            foreach ($_POST as $key => $value) {
                if ($key !== 'submit') {
                    $settingModel->set($key, $value);
                }
            }
            
            Session::setFlash('success', 'Settings updated successfully!', 'success');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to update settings.', 'error');
        }
        
        $this->redirect('admin', 'settings');
    }
    
    /**
     * Create User Form
     */
    public function createUser() {
        $this->render('admin/user_form', [
            'pageTitle' => 'Create User - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'action' => 'create'
        ], 'modern');
    }
    
    /**
     * Edit User Form
     */
    public function editUser() {
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            Session::setFlash('error', 'User ID required.', 'error');
            $this->redirect('admin', 'users');
        }
        
        $userModel = new User();
        $user = $userModel->findById($id);
        
        if (!$user) {
            Session::setFlash('error', 'User not found.', 'error');
            $this->redirect('admin', 'users');
        }
        
        $this->render('admin/user_form', [
            'pageTitle' => 'Edit User - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getAdminSidebar(),
            'user' => $user,
            'action' => 'edit'
        ], 'modern');
    }
    
    /**
     * Store User
     */
    public function storeUser() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('admin', 'users');
        }
        
        $userModel = new User();
        $userId = $_POST['user_id'] ?? null;
        
        $data = [
            'name' => trim($_POST['name'] ?? ''),
            'email' => trim($_POST['email'] ?? ''),
            'phone' => trim($_POST['phone'] ?? ''),
            'user_type' => $_POST['user_type'] ?? '',
            'status' => $_POST['status'] ?? 'active'
        ];
        
        if (!empty($_POST['password'])) {
            $data['password'] = Auth::hashPassword($_POST['password']);
        }
        
        try {
            if ($userId) {
                $userModel->update($userId, $data);
                Session::setFlash('success', 'User updated successfully!', 'success');
            } else {
                if (empty($_POST['password'])) {
                    Session::setFlash('error', 'Password is required for new users.', 'error');
                    $this->redirect('admin', 'createUser');
                }
                $userModel->insert($data);
                Session::setFlash('success', 'User created successfully!', 'success');
            }
            
            $this->redirect('admin', 'users');
        } catch (Exception $e) {
            Session::setFlash('error', 'Failed to save user.', 'error');
            $this->redirect('admin', $userId ? 'editUser' : 'createUser');
        }
    }
    
    /**
     * Get student count
     */
    private function getStudentCount() {
        try {
            $db = DB::getInstance()->getConnection();
            $stmt = $db->query("SELECT COUNT(*) FROM students WHERE status = 'active'");
            return $stmt->fetchColumn();
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Get user count by type
     */
    private function getUserCountByType($type) {
        try {
            $db = DB::getInstance()->getConnection();
            $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE user_type = ? AND status = 'active'");
            $stmt->execute([$type]);
            return $stmt->fetchColumn();
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Get pending admissions count
     */
    private function getPendingAdmissionsCount() {
        try {
            $db = DB::getInstance()->getConnection();
            $stmt = $db->query("SELECT COUNT(*) FROM admissions WHERE status = 'pending'");
            return $stmt->fetchColumn();
        } catch (Exception $e) {
            return 0;
        }
    }
    
    /**
     * Get admin sidebar menu
     */
    private function getAdminSidebar() {
        $currentController = $_GET['c'] ?? 'admin';
        $currentAction = $_GET['a'] ?? 'dashboard';
        
        return [
            [
                'label' => 'Dashboard',
                'url' => APP_URL . '/index.php?c=admin&a=dashboard',
                'icon' => 'fas fa-tachometer-alt',
                'active' => ($currentController === 'admin' && $currentAction === 'dashboard') ? 'active' : ''
            ],
            [
                'label' => 'Users',
                'url' => APP_URL . '/index.php?c=admin&a=users',
                'icon' => 'fas fa-users',
                'active' => ($currentController === 'admin' && $currentAction === 'users') ? 'active' : ''
            ],
            [
                'label' => 'Classes',
                'url' => APP_URL . '/index.php?c=classes',
                'icon' => 'fas fa-school',
                'active' => $currentController === 'classes' ? 'active' : ''
            ],
            [
                'label' => 'Sections',
                'url' => APP_URL . '/index.php?c=sections',
                'icon' => 'fas fa-layer-group',
                'active' => $currentController === 'sections' ? 'active' : ''
            ],
            [
                'label' => 'Subjects',
                'url' => APP_URL . '/index.php?c=subjects',
                'icon' => 'fas fa-book',
                'active' => $currentController === 'subjects' ? 'active' : ''
            ],
            [
                'label' => 'Academic Terms',
                'url' => APP_URL . '/index.php?c=terms',
                'icon' => 'fas fa-calendar-alt',
                'active' => $currentController === 'terms' ? 'active' : ''
            ],
            [
                'label' => 'Admissions',
                'url' => APP_URL . '/index.php?c=admissions&a=pending',
                'icon' => 'fas fa-user-graduate',
                'active' => $currentController === 'admissions' ? 'active' : ''
            ],
            [
                'label' => 'Fee Structure',
                'url' => APP_URL . '/index.php?c=feeStructure',
                'icon' => 'fas fa-money-bill-wave',
                'active' => $currentController === 'feeStructure' ? 'active' : ''
            ],
            [
                'label' => 'Finance',
                'url' => APP_URL . '/index.php?c=fees&a=dashboard',
                'icon' => 'fas fa-dollar-sign',
                'active' => $currentController === 'fees' ? 'active' : ''
            ],
            [
                'label' => 'Settings',
                'url' => APP_URL . '/index.php?c=admin&a=settings',
                'icon' => 'fas fa-cog',
                'active' => ($currentController === 'admin' && $currentAction === 'settings') ? 'active' : ''
            ],
        ];
    }
}

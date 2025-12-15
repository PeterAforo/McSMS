<?php
/**
 * Authentication Controller
 * Handles login, registration, and logout
 */

class AuthController extends Controller {
    private $userModel;
    private $parentModel;
    
    public function __construct() {
        $this->userModel = new User();
        $this->parentModel = new ParentModel();
    }
    
    /**
     * Show login form
     */
    public function login() {
        // Redirect if already logged in
        if (Auth::check()) {
            $this->redirectToDashboard();
        }
        
        // Use modern login view (no layout needed as it's standalone)
        include APP_PATH . '/views/auth/modern_login.php';
        exit;
    }
    
    /**
     * Process login
     */
    public function doLogin() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('auth', 'login');
        }
        
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        
        // Validate inputs
        if (empty($email) || empty($password)) {
            Session::setFlash('error', 'Please enter email and password', 'error');
            $this->redirect('auth', 'login');
        }
        
        // Find user
        $user = $this->userModel->findByEmail($email);
        
        if (!$user) {
            Session::setFlash('error', 'Invalid email or password', 'error');
            $this->redirect('auth', 'login');
        }
        
        // Verify password
        if (!Auth::verifyPassword($password, $user['password'])) {
            Session::setFlash('error', 'Invalid email or password', 'error');
            $this->redirect('auth', 'login');
        }
        
        // Check if user is active
        if ($user['status'] !== 'active') {
            Session::setFlash('error', 'Your account is inactive. Please contact administrator.', 'error');
            $this->redirect('auth', 'login');
        }
        
        // Login user
        Auth::login($user);
        
        Session::setFlash('success', 'Welcome back, ' . $user['name'] . '!', 'success');
        
        // Redirect to appropriate dashboard
        $this->redirectToDashboard();
    }
    
    /**
     * Show registration form (for parents)
     */
    public function register() {
        // Redirect if already logged in
        if (Auth::check()) {
            $this->redirectToDashboard();
        }
        
        // Use modern register view (no layout needed as it's standalone)
        include APP_PATH . '/views/auth/modern_register.php';
        exit;
    }
    
    /**
     * Process registration
     */
    public function doRegister() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->redirect('auth', 'register');
        }
        
        // Get form data
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $password = $_POST['password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';
        $address = trim($_POST['address'] ?? '');
        $occupation = trim($_POST['occupation'] ?? '');
        
        // Validate inputs
        $errors = [];
        
        if (empty($name)) $errors[] = 'Name is required';
        if (empty($email)) $errors[] = 'Email is required';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Invalid email format';
        if (empty($password)) $errors[] = 'Password is required';
        if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters';
        if ($password !== $confirmPassword) $errors[] = 'Passwords do not match';
        
        // Check if email already exists
        if ($this->userModel->findByEmail($email)) {
            $errors[] = 'Email already registered';
        }
        
        if (!empty($errors)) {
            Session::setFlash('error', implode('<br>', $errors), 'error');
            Session::setOldInput($_POST);
            $this->redirect('auth', 'register');
        }
        
        try {
            // Create user account
            $userId = $this->userModel->insert([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'password' => Auth::hashPassword($password),
                'user_type' => 'parent',
                'status' => 'active'
            ]);
            
            // Create parent profile
            $this->parentModel->insert([
                'user_id' => $userId,
                'address' => $address,
                'occupation' => $occupation
            ]);
            
            Session::setFlash('success', 'Registration successful! Please login.', 'success');
            $this->redirect('auth', 'login');
            
        } catch (Exception $e) {
            Session::setFlash('error', 'Registration failed. Please try again.', 'error');
            $this->redirect('auth', 'register');
        }
    }
    
    /**
     * Logout user
     */
    public function logout() {
        Auth::logout();
        Session::setFlash('success', 'You have been logged out successfully.', 'success');
        $this->redirect('auth', 'login');
    }
    
    /**
     * Redirect to appropriate dashboard based on user type
     */
    private function redirectToDashboard() {
        $userType = $_SESSION['user_type'] ?? 'parent';
        
        switch ($userType) {
            case 'admin':
                $this->redirect('admin', 'dashboard');
                break;
            case 'teacher':
                $this->redirect('teacher', 'dashboard');
                break;
            case 'finance':
                $this->redirect('fees', 'dashboard');
                break;
            case 'admissions':
                $this->redirect('admissions', 'dashboard');
                break;
            case 'parent':
            default:
                $this->redirect('parent', 'dashboard');
                break;
        }
    }
}

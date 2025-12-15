<?php
/**
 * Authentication Helper Class
 * Handles user authentication and session management
 */

class Auth {
    
    /**
     * Login user
     * @param array $user User data from database
     */
    public static function login($user) {
        // Regenerate session ID for security
        session_regenerate_id(true);
        
        // Store user data in session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_type'] = $user['user_type'];
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
    }
    
    /**
     * Logout user
     */
    public static function logout() {
        // Unset all session variables
        $_SESSION = [];
        
        // Destroy session cookie
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/');
        }
        
        // Destroy session
        session_destroy();
    }
    
    /**
     * Check if user is logged in
     * @return bool
     */
    public static function check() {
        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }
    
    /**
     * Get current user ID
     * @return int|null
     */
    public static function id() {
        return $_SESSION['user_id'] ?? null;
    }
    
    /**
     * Get current user data
     * @return array|null
     */
    public static function user() {
        if (!self::check()) {
            return null;
        }
        
        return [
            'id' => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'],
            'email' => $_SESSION['user_email'],
            'user_type' => $_SESSION['user_type'],
        ];
    }
    
    /**
     * Check if user has specific role
     * @param string|array $roles
     * @return bool
     */
    public static function hasRole($roles) {
        if (!self::check()) {
            return false;
        }
        
        if (is_array($roles)) {
            return in_array($_SESSION['user_type'], $roles);
        }
        
        return $_SESSION['user_type'] === $roles;
    }
    
    /**
     * Hash password
     * @param string $password
     * @return string
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT);
    }
    
    /**
     * Verify password
     * @param string $password
     * @param string $hash
     * @return bool
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
}

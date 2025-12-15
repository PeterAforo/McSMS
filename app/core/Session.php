<?php
/**
 * Session Helper Class
 * Handles flash messages and session data
 */

class Session {
    
    /**
     * Set flash message
     * @param string $key Message key
     * @param string $message Message text
     * @param string $type Message type (success, error, warning, info)
     */
    public static function setFlash($key, $message, $type = 'info') {
        $_SESSION['flash'][$key] = [
            'message' => $message,
            'type' => $type
        ];
    }
    
    /**
     * Get and remove flash message
     * @param string $key Message key
     * @return array|null
     */
    public static function getFlash($key) {
        if (isset($_SESSION['flash'][$key])) {
            $flash = $_SESSION['flash'][$key];
            unset($_SESSION['flash'][$key]);
            return $flash;
        }
        return null;
    }
    
    /**
     * Check if flash message exists
     * @param string $key Message key
     * @return bool
     */
    public static function hasFlash($key) {
        return isset($_SESSION['flash'][$key]);
    }
    
    /**
     * Set session value
     * @param string $key
     * @param mixed $value
     */
    public static function set($key, $value) {
        $_SESSION[$key] = $value;
    }
    
    /**
     * Get session value
     * @param string $key
     * @param mixed $default Default value if key doesn't exist
     * @return mixed
     */
    public static function get($key, $default = null) {
        return $_SESSION[$key] ?? $default;
    }
    
    /**
     * Check if session key exists
     * @param string $key
     * @return bool
     */
    public static function has($key) {
        return isset($_SESSION[$key]);
    }
    
    /**
     * Remove session value
     * @param string $key
     */
    public static function remove($key) {
        if (isset($_SESSION[$key])) {
            unset($_SESSION[$key]);
        }
    }
    
    /**
     * Get old input value (for form repopulation)
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function old($key, $default = '') {
        $value = self::get('old_input')[$key] ?? $default;
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Set old input values
     * @param array $data
     */
    public static function setOldInput($data) {
        self::set('old_input', $data);
    }
    
    /**
     * Clear old input
     */
    public static function clearOldInput() {
        self::remove('old_input');
    }
}

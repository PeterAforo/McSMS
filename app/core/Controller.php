<?php
/**
 * Base Controller Class
 * All controllers extend this class
 */

abstract class Controller {
    
    /**
     * Render a view with layout
     * @param string $view View file path (e.g., 'parent/dashboard')
     * @param array $data Data to pass to view
     * @param string $layout Layout file name (default: 'main')
     */
    protected function render($view, $data = [], $layout = 'main') {
        // Extract data to variables
        extract($data);
        
        // Start output buffering
        ob_start();
        
        // Include view file
        $viewFile = APP_PATH . "/views/{$view}.php";
        if (file_exists($viewFile)) {
            include $viewFile;
        } else {
            die("View not found: {$view}");
        }
        
        // Get view content
        $content = ob_get_clean();
        
        // Include layout
        $layoutFile = APP_PATH . "/views/layouts/{$layout}.php";
        if (file_exists($layoutFile)) {
            include $layoutFile;
        } else {
            echo $content;
        }
    }
    
    /**
     * Redirect to another page
     * @param string $controller Controller name
     * @param string $action Action name
     * @param array $params Additional parameters
     */
    protected function redirect($controller, $action = 'index', $params = []) {
        $url = APP_URL . "/index.php?c={$controller}&a={$action}";
        
        if (!empty($params)) {
            $url .= '&' . http_build_query($params);
        }
        
        header("Location: {$url}");
        exit;
    }
    
    /**
     * Return JSON response
     * @param mixed $data Data to encode
     * @param int $statusCode HTTP status code
     */
    protected function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
    
    /**
     * Check if user is logged in
     * @return bool
     */
    protected function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }
    
    /**
     * Require authentication
     */
    protected function requireAuth() {
        if (!$this->isLoggedIn()) {
            $this->redirect('auth', 'login');
        }
    }
    
    /**
     * Check user role
     * @param string|array $roles Required role(s)
     * @return bool
     */
    protected function hasRole($roles) {
        if (!isset($_SESSION['user_type'])) {
            return false;
        }
        
        if (is_array($roles)) {
            return in_array($_SESSION['user_type'], $roles);
        }
        
        return $_SESSION['user_type'] === $roles;
    }
    
    /**
     * Require specific role
     * @param string|array $roles Required role(s)
     */
    protected function requireRole($roles) {
        $this->requireAuth();
        
        if (!$this->hasRole($roles)) {
            die("Access denied. Insufficient permissions.");
        }
    }
}

<?php
/**
 * Input Validation and Sanitization Middleware
 * Provides secure input handling for API endpoints
 */

class InputValidator {
    
    /**
     * Sanitize string input
     */
    public static function sanitizeString($input, $maxLength = 255) {
        if (!is_string($input)) {
            return '';
        }
        
        // Remove null bytes
        $input = str_replace("\0", '', $input);
        
        // Trim whitespace
        $input = trim($input);
        
        // Limit length
        if (strlen($input) > $maxLength) {
            $input = substr($input, 0, $maxLength);
        }
        
        // Remove control characters except newlines and tabs
        $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input);
        
        return $input;
    }
    
    /**
     * Sanitize email input
     */
    public static function sanitizeEmail($email) {
        $email = self::sanitizeString($email, 254);
        $email = filter_var($email, FILTER_SANITIZE_EMAIL);
        return $email;
    }
    
    /**
     * Validate email format
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Sanitize integer input
     */
    public static function sanitizeInt($input, $min = null, $max = null) {
        $value = filter_var($input, FILTER_VALIDATE_INT);
        
        if ($value === false) {
            return null;
        }
        
        if ($min !== null && $value < $min) {
            return $min;
        }
        
        if ($max !== null && $value > $max) {
            return $max;
        }
        
        return $value;
    }
    
    /**
     * Sanitize float input
     */
    public static function sanitizeFloat($input, $min = null, $max = null) {
        $value = filter_var($input, FILTER_VALIDATE_FLOAT);
        
        if ($value === false) {
            return null;
        }
        
        if ($min !== null && $value < $min) {
            return $min;
        }
        
        if ($max !== null && $value > $max) {
            return $max;
        }
        
        return $value;
    }
    
    /**
     * Sanitize boolean input
     */
    public static function sanitizeBool($input) {
        return filter_var($input, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }
    
    /**
     * Sanitize date input (YYYY-MM-DD format)
     */
    public static function sanitizeDate($input) {
        $input = self::sanitizeString($input, 10);
        
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $input)) {
            $date = DateTime::createFromFormat('Y-m-d', $input);
            if ($date && $date->format('Y-m-d') === $input) {
                return $input;
            }
        }
        
        return null;
    }
    
    /**
     * Sanitize phone number
     */
    public static function sanitizePhone($input) {
        $input = self::sanitizeString($input, 20);
        // Keep only digits, plus sign, and common separators
        return preg_replace('/[^\d+\-\s()]/', '', $input);
    }
    
    /**
     * Sanitize URL
     */
    public static function sanitizeUrl($input) {
        $input = self::sanitizeString($input, 2048);
        $input = filter_var($input, FILTER_SANITIZE_URL);
        
        // Validate URL format
        if (filter_var($input, FILTER_VALIDATE_URL)) {
            // Only allow http and https schemes
            $scheme = parse_url($input, PHP_URL_SCHEME);
            if (in_array(strtolower($scheme), ['http', 'https'])) {
                return $input;
            }
        }
        
        return null;
    }
    
    /**
     * Sanitize filename (for uploads)
     */
    public static function sanitizeFilename($filename) {
        // Remove path components
        $filename = basename($filename);
        
        // Remove null bytes and control characters
        $filename = preg_replace('/[\x00-\x1F\x7F]/', '', $filename);
        
        // Replace dangerous characters
        $filename = preg_replace('/[\/\\\\:*?"<>|]/', '_', $filename);
        
        // Limit length
        if (strlen($filename) > 255) {
            $ext = pathinfo($filename, PATHINFO_EXTENSION);
            $name = pathinfo($filename, PATHINFO_FILENAME);
            $filename = substr($name, 0, 250 - strlen($ext)) . '.' . $ext;
        }
        
        return $filename;
    }
    
    /**
     * Sanitize HTML content (for rich text fields)
     */
    public static function sanitizeHtml($input, $allowedTags = '<p><br><b><i><u><strong><em><ul><ol><li><a><h1><h2><h3><h4><h5><h6>') {
        $input = self::sanitizeString($input, 65535);
        return strip_tags($input, $allowedTags);
    }
    
    /**
     * Validate and sanitize JSON input
     */
    public static function getJsonInput() {
        $input = file_get_contents('php://input');
        
        if (empty($input)) {
            return [];
        }
        
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }
        
        return $data;
    }
    
    /**
     * Validate required fields
     */
    public static function validateRequired($data, $requiredFields) {
        $missing = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                $missing[] = $field;
            }
        }
        
        return $missing;
    }
    
    /**
     * Validate password strength
     */
    public static function validatePassword($password, $minLength = 8) {
        $errors = [];
        
        if (strlen($password) < $minLength) {
            $errors[] = "Password must be at least $minLength characters";
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }
        
        return $errors;
    }
    
    /**
     * Prevent SQL injection by validating identifiers
     */
    public static function validateIdentifier($input, $allowedChars = 'a-zA-Z0-9_') {
        return preg_match("/^[$allowedChars]+$/", $input);
    }
    
    /**
     * Sanitize array of IDs
     */
    public static function sanitizeIdArray($input) {
        if (!is_array($input)) {
            return [];
        }
        
        return array_filter(array_map(function($id) {
            return self::sanitizeInt($id, 1);
        }, $input));
    }
}

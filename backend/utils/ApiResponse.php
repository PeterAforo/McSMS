<?php
/**
 * API Response Helper
 * Standardizes API responses and optimizes payload size
 */

class ApiResponse {
    
    /**
     * Send successful JSON response
     */
    public static function success($data = [], $message = null, $statusCode = 200) {
        http_response_code($statusCode);
        
        $response = ['success' => true];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        // Merge data into response
        if (is_array($data)) {
            $response = array_merge($response, $data);
        } else {
            $response['data'] = $data;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Send error JSON response
     */
    public static function error($message, $statusCode = 400, $errors = []) {
        http_response_code($statusCode);
        
        $response = [
            'success' => false,
            'error' => $message
        ];
        
        if (!empty($errors)) {
            $response['errors'] = $errors;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Send paginated response
     */
    public static function paginated($items, $total, $page, $perPage, $extra = []) {
        $totalPages = ceil($total / $perPage);
        
        $response = [
            'success' => true,
            'data' => $items,
            'pagination' => [
                'total' => (int)$total,
                'page' => (int)$page,
                'per_page' => (int)$perPage,
                'total_pages' => (int)$totalPages,
                'has_more' => $page < $totalPages
            ]
        ];
        
        if (!empty($extra)) {
            $response = array_merge($response, $extra);
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Strip null values from array to reduce payload size
     */
    public static function stripNulls($data) {
        if (!is_array($data)) {
            return $data;
        }
        
        return array_filter($data, function($value) {
            return $value !== null;
        });
    }
    
    /**
     * Strip null values recursively
     */
    public static function stripNullsRecursive($data) {
        if (!is_array($data)) {
            return $data;
        }
        
        $result = [];
        foreach ($data as $key => $value) {
            if ($value === null) {
                continue;
            }
            
            if (is_array($value)) {
                $value = self::stripNullsRecursive($value);
            }
            
            $result[$key] = $value;
        }
        
        return $result;
    }
    
    /**
     * Select only specific fields from results (reduce payload)
     */
    public static function selectFields($data, $fields) {
        if (empty($fields) || !is_array($data)) {
            return $data;
        }
        
        // Handle single item
        if (isset($data[0]) === false && !empty($data)) {
            return array_intersect_key($data, array_flip($fields));
        }
        
        // Handle array of items
        return array_map(function($item) use ($fields) {
            return array_intersect_key($item, array_flip($fields));
        }, $data);
    }
    
    /**
     * Format dates consistently
     */
    public static function formatDates($data, $dateFields = ['created_at', 'updated_at', 'date']) {
        if (!is_array($data)) {
            return $data;
        }
        
        foreach ($dateFields as $field) {
            if (isset($data[$field]) && $data[$field]) {
                $data[$field] = date('Y-m-d H:i:s', strtotime($data[$field]));
            }
        }
        
        return $data;
    }
    
    /**
     * Cast boolean fields properly
     */
    public static function castBooleans($data, $boolFields = ['is_read', 'is_active', 'status']) {
        if (!is_array($data)) {
            return $data;
        }
        
        foreach ($boolFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = (bool)(int)$data[$field];
            }
        }
        
        return $data;
    }
}

<?php
/**
 * Debug Helper
 * Provides debug mode functionality for the application
 */

function isDebugMode($pdo = null) {
    if ($pdo === null) {
        return false;
    }
    
    try {
        $stmt = $pdo->query("SELECT debug_mode FROM system_config WHERE id = 1");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return ($result && $result['debug_mode'] == 1);
    } catch (Exception $e) {
        return false;
    }
}

function getDebugSettings($pdo) {
    try {
        $stmt = $pdo->query("SELECT debug_mode, debug_log_api_requests, debug_show_sql_errors FROM system_config WHERE id = 1");
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [
            'debug_mode' => 0,
            'debug_log_api_requests' => 0,
            'debug_show_sql_errors' => 0
        ];
    } catch (Exception $e) {
        return [
            'debug_mode' => 0,
            'debug_log_api_requests' => 0,
            'debug_show_sql_errors' => 0
        ];
    }
}

function debugLog($pdo, $message, $data = null) {
    $settings = getDebugSettings($pdo);
    if ($settings['debug_log_api_requests']) {
        $logEntry = date('Y-m-d H:i:s') . " - " . $message;
        if ($data !== null) {
            $logEntry .= " - " . json_encode($data);
        }
        error_log($logEntry);
    }
}

function handleApiError($pdo, $exception, $context = '') {
    $debugMode = isDebugMode($pdo);
    
    $response = [
        'success' => false,
        'error' => $debugMode ? $exception->getMessage() : 'An error occurred. Please try again.'
    ];
    
    if ($debugMode) {
        $response['debug'] = [
            'context' => $context,
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ];
    }
    
    // Always log the full error
    error_log("API Error [$context]: " . $exception->getMessage() . " in " . $exception->getFile() . ":" . $exception->getLine());
    
    http_response_code(500);
    echo json_encode($response);
    exit;
}

function enableDebugErrorReporting($pdo) {
    $debugMode = isDebugMode($pdo);
    
    if ($debugMode) {
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
    } else {
        ini_set('display_errors', 0);
        ini_set('display_startup_errors', 0);
        error_reporting(0);
    }
}

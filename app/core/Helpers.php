<?php
/**
 * Global Helper Functions
 */

/**
 * Format currency for Ghana (GH₵)
 */
function formatCurrency($amount, $decimals = 2) {
    $symbol = defined('CURRENCY_SYMBOL') ? CURRENCY_SYMBOL : 'GH₵';
    return $symbol . ' ' . number_format($amount, $decimals);
}

/**
 * Format date for Ghana (dd/mm/yyyy)
 */
function formatDate($date, $format = null) {
    if (!$format) {
        $format = defined('DATE_FORMAT') ? DATE_FORMAT : 'd/m/Y';
    }
    
    if (is_string($date)) {
        $date = strtotime($date);
    }
    
    return date($format, $date);
}

/**
 * Format datetime for Ghana
 */
function formatDateTime($datetime, $format = null) {
    if (!$format) {
        $format = defined('DATETIME_FORMAT') ? DATETIME_FORMAT : 'd/m/Y H:i';
    }
    
    if (is_string($datetime)) {
        $datetime = strtotime($datetime);
    }
    
    return date($format, $datetime);
}

/**
 * Get curriculum types
 */
function getCurriculumTypes() {
    return defined('CURRICULUM_TYPES') ? CURRICULUM_TYPES : ['GES', 'Cambridge'];
}

/**
 * Format student ID for Ghana
 */
function formatStudentId($id, $prefix = 'STU') {
    return $prefix . str_pad($id, 6, '0', STR_PAD_LEFT);
}

/**
 * Get school terms for Ghana
 */
function getGhanaTerms() {
    return [
        '1' => 'First Term (September - December)',
        '2' => 'Second Term (January - April)',
        '3' => 'Third Term (May - August)'
    ];
}

/**
 * Get GES class levels
 */
function getGESLevels() {
    return [
        'Creche' => 'Creche',
        'Nursery' => 'Nursery 1-2',
        'KG' => 'Kindergarten 1-2',
        'Primary' => 'Primary 1-6',
        'JHS' => 'Junior High School 1-3',
        'SHS' => 'Senior High School 1-3'
    ];
}

/**
 * Get Cambridge levels
 */
function getCambridgeLevels() {
    return [
        'Primary' => 'Cambridge Primary (Stages 1-6)',
        'Lower Secondary' => 'Cambridge Lower Secondary (Stages 7-9)',
        'IGCSE' => 'Cambridge IGCSE',
        'AS Level' => 'Cambridge AS Level',
        'A Level' => 'Cambridge A Level'
    ];
}

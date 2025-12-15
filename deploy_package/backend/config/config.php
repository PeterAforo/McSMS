<?php
/**
 * Application Configuration
 */

// Application settings
define('APP_NAME', 'School Management System');
define('APP_VERSION', '1.0');
define('APP_URL', 'http://localhost/McSMS/public');

// Paths
define('ASSETS_URL', APP_URL . '/assets');
define('UPLOADS_PATH', PUBLIC_PATH . '/assets/uploads');
define('UPLOADS_URL', ASSETS_URL . '/uploads');

// Session settings
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Set to 1 in production with HTTPS

// Timezone (Ghana is GMT/UTC)
date_default_timezone_set('Africa/Accra');

// Ghana School Configuration
define('CURRENCY_SYMBOL', 'GH₵');
define('CURRENCY_CODE', 'GHS');
define('CURRENCY_NAME', 'Ghana Cedis');
define('SCHOOL_COUNTRY', 'Ghana');
define('CURRICULUM_TYPES', ['GES', 'Cambridge']);
define('DATE_FORMAT', 'd/m/Y');
define('DATETIME_FORMAT', 'd/m/Y H:i');

// Load helper functions
require_once APP_PATH . '/core/Helpers.php';

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

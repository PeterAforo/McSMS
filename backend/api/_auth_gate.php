<?php
/**
 * Centralized API Authentication Gate
 *
 * This file is auto-included (from config/database.php) for every request
 * that hits a script under backend/api/. It enforces that a valid, signed
 * JWT (issued by backend/api/auth.php on login) is present on the request
 * before the target endpoint's own logic runs, EXCEPT for an explicit
 * allowlist of endpoints that must remain publicly accessible (login,
 * registration, public branding, health checks, etc).
 *
 * Endpoints can still perform additional, more specific role checks of
 * their own (e.g. requireAuth($pdo, ['admin']) via middleware/auth.php) -
 * this gate only guarantees that NO endpoint is silently wide open to
 * anonymous requests by default.
 */

if (defined('MCSMS_AUTH_GATE_RAN')) {
    return; // never run twice in a single request
}
define('MCSMS_AUTH_GATE_RAN', true);

// Never gate CLI usage (migration scripts run from the command line, etc.)
if (PHP_SAPI === 'cli') {
    return;
}

// Always allow CORS preflight requests through untouched - each endpoint
// handles its own OPTIONS response.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    return;
}

$__scriptFile = str_replace('\\', '/', $_SERVER['SCRIPT_FILENAME'] ?? $_SERVER['SCRIPT_NAME'] ?? '');

// Only gate requests that are actually executing a file under backend/api/.
// (config/database.php is also used by CLI setup/maintenance scripts outside
// of backend/api - those must not be affected by this gate.)
if (strpos($__scriptFile, '/backend/api/') === false) {
    return;
}

$__scriptName = basename($__scriptFile);
$__method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ---------------------------------------------------------------------
// Public allowlist - endpoints that must work without a logged-in user.
// ---------------------------------------------------------------------
$publicFiles = [
    'auth.php',                // login / register / forgot / reset password
    'public_settings.php',     // school branding shown on the public login page
    'health.php',              // uptime checks
    'manifest.php',            // PWA manifest
    'email_activation.php',    // account activation via emailed token
    'index.php',               // legacy REST router (controllers do their own auth)
];

$isPublic = in_array($__scriptName, $publicFiles, true);

// Mobile login must remain public; other mobile v1 endpoints require auth.
if (strpos($__scriptFile, '/backend/api/mobile/v1/auth.php') !== false) {
    $isPublic = true;
}

// Public admissions form: parents submit new applications without an account.
// Reviewing/approving/rejecting applications still requires authentication.
if ($__scriptName === 'applications.php' && $__method === 'POST') {
    $action = $_GET['action'] ?? '';
    if ($action !== 'approve' && $action !== 'reject') {
        $isPublic = true;
    }
}

// Public gallery list for unauthenticated auth pages.
// Upload/assign/delete still require authentication.
if ($__scriptName === 'gallery.php' && $__method === 'GET') {
    $isPublic = true;
}

if ($isPublic) {
    return;
}

// ---------------------------------------------------------------------
// Enforce authentication for everything else.
// ---------------------------------------------------------------------
require_once __DIR__ . '/../middleware/auth.php';

$__authGate = new AuthMiddleware();
$__authUser = $__authGate->validateToken();

if (!$__authUser) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Authentication required',
        'code' => 'UNAUTHORIZED',
    ]);
    exit;
}

// Expose the authenticated user/role to the target script if it wants it.
$GLOBALS['MCSMS_AUTH_USER'] = $__authUser;

// ---------------------------------------------------------------------
// Extra role restrictions for especially sensitive resources.
// ---------------------------------------------------------------------
$roleRestrictions = [
    'system_config.php'   => ['admin', 'super_admin'],
    'system_reset.php'    => ['admin', 'super_admin'],
    'user_management.php' => ['admin', 'super_admin'],
    'roles.php'            => ['admin', 'super_admin'],
    'permissions.php'      => ['admin', 'super_admin'],
    'role_permissions.php' => ['admin', 'super_admin'],
    'backup.php'           => ['admin', 'super_admin'],
    'audit.php'            => ['admin', 'super_admin'],
    'logs.php'             => ['admin', 'super_admin'],
    'salary_components.php' => ['admin', 'super_admin', 'hr', 'hr_manager'],
    'hr_payroll.php'        => ['admin', 'super_admin', 'hr', 'hr_manager'],
    'hr_management.php'    => ['admin', 'super_admin', 'hr', 'hr_manager'],
    'hr_reports.php'        => ['admin', 'super_admin', 'hr', 'hr_manager'],
    'payment_gateway.php'  => ['admin', 'super_admin', 'finance', 'accountant'],
];

// Self-service exception: any authenticated user may change their OWN password
// via user_management.php?resource=password&action=change. The handler still
// verifies the user's current password before applying the change.
$__isSelfPasswordChange = (
    $__scriptName === 'user_management.php'
    && ($_GET['resource'] ?? '') === 'password'
    && ($_GET['action'] ?? '') === 'change'
);

if (isset($roleRestrictions[$__scriptName]) && !$__isSelfPasswordChange) {
    $role = strtolower($__authUser['user_type'] ?? $__authUser['role'] ?? '');
    $role = str_replace(' ', '_', $role); // normalize "Super Admin" -> "super_admin"
    if (!in_array($role, $roleRestrictions[$__scriptName], true)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Insufficient permissions',
            'code' => 'FORBIDDEN',
        ]);
        exit;
    }
}

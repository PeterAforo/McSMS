# McSMS Security Hardening Guide

**Date:** 2026-02-26  
**Version:** 1.0

---

## Overview

This document outlines the security measures implemented in the McSMS application to protect against common web vulnerabilities and attacks.

---

## Security Middleware

### Location
All security middleware is located in `backend/middleware/`:

| File | Purpose |
|------|---------|
| `security_bootstrap.php` | Main entry point for security initialization |
| `security_headers.php` | HTTP security headers |
| `rate_limiter.php` | Brute force protection |
| `csrf.php` | Cross-Site Request Forgery protection |
| `input_validator.php` | Input sanitization and validation |
| `debug_protection.php` | Debug endpoint access control |

---

## Security Headers

The following HTTP security headers are applied to all API responses:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS protection (legacy) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer information |
| `Permissions-Policy` | `camera=(), microphone=()...` | Restrict browser features |
| `Content-Security-Policy` | `default-src 'none'` | Prevent content injection |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS (when applicable) |
| `Cache-Control` | `no-store, private` | Prevent caching of sensitive data |

---

## Rate Limiting

### Configuration
Rate limiting is applied based on endpoint sensitivity:

| Endpoint Type | Max Requests | Window | Block Duration |
|---------------|--------------|--------|----------------|
| Authentication | 5 | 5 minutes | Exponential (1-60 min) |
| Sensitive (Finance) | 30 | 1 minute | Exponential |
| Public | 100 | 1 minute | Exponential |
| Debug | 10 | 1 minute | Exponential |

### Implementation
```php
// In your API endpoint
require_once __DIR__ . '/../middleware/security_bootstrap.php';

// For authentication endpoints
SecurityBootstrap::initAuth();

// For sensitive endpoints (finance, user data)
SecurityBootstrap::initSensitive();

// For public endpoints
SecurityBootstrap::initPublic();
```

### Storage
Rate limit data is stored in file-based cache at `cache/rate_limit/`.

---

## CSRF Protection

### How It Works
1. Server generates HMAC-signed token using `CSRF_SECRET`
2. Token is stored in session with timestamp
3. Client includes token in `X-CSRF-Token` header or `_csrf_token` body field
4. Server validates token on state-changing requests (POST, PUT, DELETE, PATCH)

### Bypass for API
API requests with Bearer token authentication bypass CSRF checks (they use JWT auth instead).

### Configuration
Set `CSRF_SECRET` in your `.env` file:
```env
CSRF_SECRET=your-random-secret-key-here
```

---

## Input Validation

### Available Sanitizers

```php
use InputValidator;

// String sanitization
$name = InputValidator::sanitizeString($input, $maxLength);

// Email
$email = InputValidator::sanitizeEmail($input);
$isValid = InputValidator::validateEmail($email);

// Numbers
$id = InputValidator::sanitizeInt($input, $min, $max);
$price = InputValidator::sanitizeFloat($input, $min, $max);

// Boolean
$active = InputValidator::sanitizeBool($input);

// Date (YYYY-MM-DD)
$date = InputValidator::sanitizeDate($input);

// Phone number
$phone = InputValidator::sanitizePhone($input);

// URL
$url = InputValidator::sanitizeUrl($input);

// Filename (for uploads)
$filename = InputValidator::sanitizeFilename($input);

// HTML (rich text)
$content = InputValidator::sanitizeHtml($input, $allowedTags);

// Array of IDs
$ids = InputValidator::sanitizeIdArray($input);
```

### Password Validation
```php
$errors = InputValidator::validatePassword($password, $minLength);
// Returns array of validation errors
```

### Required Field Validation
```php
$missing = InputValidator::validateRequired($data, ['name', 'email', 'password']);
if (!empty($missing)) {
    // Handle missing fields
}
```

---

## CORS Configuration

### Allowed Origins
By default, the following origins are allowed:
- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `https://eea.mcaforo.com`
- Value of `FRONTEND_URL` environment variable

### Configuration
Set `FRONTEND_URL` in your `.env` file for production:
```env
FRONTEND_URL=https://your-frontend-domain.com
```

---

## Debug Endpoint Protection

Debug endpoints are protected in production:
1. Requires `APP_ENV=production` to enable protection
2. Access requires `DEBUG_ACCESS_KEY` header or query parameter
3. All access attempts are logged

### Configuration
```env
APP_ENV=production
DEBUG_ACCESS_KEY=your-secret-debug-key
```

---

## Best Practices

### 1. Always Use Prepared Statements
```php
// GOOD
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$userId]);

// BAD - SQL Injection vulnerable
$stmt = $pdo->query("SELECT * FROM users WHERE id = " . $userId);
```

### 2. Validate All Input
```php
$email = InputValidator::sanitizeEmail($_POST['email']);
if (!InputValidator::validateEmail($email)) {
    SecurityBootstrap::errorResponse('Invalid email format');
}
```

### 3. Use Security Bootstrap
```php
// At the top of every API endpoint
require_once __DIR__ . '/../middleware/security_bootstrap.php';
SecurityBootstrap::init();
```

### 4. Hash Passwords Properly
```php
// Hashing
$hash = password_hash($password, PASSWORD_DEFAULT);

// Verification
if (password_verify($password, $hash)) {
    // Valid
}
```

### 5. Record Failed Auth Attempts
```php
if (!$loginSuccess) {
    SecurityBootstrap::recordAuthFailure($email);
}

// On success, clear attempts
SecurityBootstrap::clearAuthAttempts($email);
```

---

## Environment Variables

Add these to your `.env` file:

```env
# Security Configuration
APP_ENV=production
CSRF_SECRET=generate-a-random-64-char-string
DEBUG_ACCESS_KEY=generate-a-random-32-char-string
FRONTEND_URL=https://your-frontend-domain.com

# Session Configuration
SESSION_LIFETIME=3600
SESSION_SECURE=true
SESSION_HTTPONLY=true
```

---

## Checklist

### Production Deployment
- [ ] Set `APP_ENV=production`
- [ ] Generate unique `CSRF_SECRET`
- [ ] Generate unique `DEBUG_ACCESS_KEY`
- [ ] Configure `FRONTEND_URL`
- [ ] Enable HTTPS
- [ ] Disable PHP error display
- [ ] Set secure session cookies
- [ ] Review file permissions
- [ ] Enable rate limiting cache directory

### Code Review
- [ ] All user input is sanitized
- [ ] All database queries use prepared statements
- [ ] Passwords are hashed with `password_hash()`
- [ ] Sensitive data is not logged
- [ ] Error messages don't leak internal details
- [ ] File uploads are validated and sanitized

---

## Vulnerability Reporting

If you discover a security vulnerability, please report it to:
- Email: security@mcaforo.com
- Do not disclose publicly until patched

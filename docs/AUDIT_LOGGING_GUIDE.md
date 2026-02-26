# McSMS Audit Logging System

**Date:** 2026-02-26  
**Version:** 1.0

---

## Overview

The McSMS Audit Logging System provides comprehensive tracking of user actions and system events. It captures who did what, when, and what changed, enabling security monitoring, compliance, and troubleshooting.

---

## Features

- **Action Tracking**: Create, Read, Update, Delete, Login, Logout, Export, Import
- **Entity Tracking**: Users, Students, Teachers, Payments, Settings, etc.
- **Severity Levels**: Critical, High, Medium, Low (auto-detected)
- **Change Tracking**: Old and new values for updates
- **User Context**: User ID, email, role, IP address, user agent
- **Statistics**: Activity trends, top users, severity distribution
- **Export**: CSV export with filtering
- **Retention**: Configurable cleanup of old logs

---

## File Structure

```
backend/
├── src/
│   └── Audit/
│       └── AuditLogService.php     # Core audit service
├── api/
│   └── audit.php                   # REST API endpoints
└── middleware/
    └── audit_middleware.php        # Helper middleware

frontend/
└── src/
    └── components/
        └── admin/
            └── AuditLogs.jsx       # Admin UI component
```

---

## Quick Start

### 1. Basic Logging

```php
require_once __DIR__ . '/../src/Audit/AuditLogService.php';
use McSMS\Audit\AuditLogService;

$audit = AuditLogService::getInstance();

// Log a create action
$audit->log('create', 'student', [
    'user_id' => $currentUserId,
    'user_email' => $currentUserEmail,
    'entity_id' => $newStudentId,
    'entity_name' => $studentName,
    'description' => 'New student enrolled',
    'new_values' => $studentData,
]);
```

### 2. Using Middleware Helpers

```php
require_once __DIR__ . '/../middleware/audit_middleware.php';

// Set user context (call once after authentication)
AuditMiddleware::setUserContext($userId, $email, $role);

// Log actions
AuditMiddleware::logCreate('student', $studentId, $studentName, $studentData);
AuditMiddleware::logUpdate('student', $studentId, $studentName, $oldData, $newData);
AuditMiddleware::logDelete('student', $studentId, $studentName, $oldData);

// Authentication events
AuditMiddleware::logLogin($userId, $email, $role);
AuditMiddleware::logLoginFailed($email, 'Invalid password');
AuditMiddleware::logLogout();

// Other events
AuditMiddleware::logPasswordChange($userId, $email);
AuditMiddleware::logExport('student', 'Exported 150 student records');
AuditMiddleware::logSettingsChange('school_name', 'Old School', 'New School');
```

---

## Action Types

| Action | Description | Default Severity |
|--------|-------------|------------------|
| `create` | New record created | Medium |
| `read` | Record viewed | Low |
| `update` | Record modified | Medium |
| `delete` | Record deleted | High |
| `login` | User logged in | Low |
| `logout` | User logged out | Low |
| `login_failed` | Failed login attempt | High |
| `password_change` | Password changed | High |
| `password_reset` | Password reset requested | High |
| `export` | Data exported | Medium |
| `import` | Data imported | Medium |
| `backup` | Database backup | Medium |
| `restore` | Database restored | Critical |
| `permission_change` | User permissions changed | Critical |
| `settings_change` | System settings changed | High |

---

## Entity Types

| Entity | Description |
|--------|-------------|
| `user` | System users |
| `student` | Student records |
| `teacher` | Teacher records |
| `parent` | Parent records |
| `class` | Class/section records |
| `subject` | Subject records |
| `grade` | Grade/marks records |
| `attendance` | Attendance records |
| `fee` | Fee structure |
| `payment` | Payment transactions |
| `invoice` | Invoice records |
| `timetable` | Timetable entries |
| `exam` | Exam records |
| `assignment` | Assignment records |
| `message` | Messages |
| `notification` | Notifications |
| `report` | Generated reports |
| `settings` | System settings |
| `backup` | Database backups |
| `system` | System events |

---

## Severity Levels

| Level | Color | Description |
|-------|-------|-------------|
| `critical` | Red | Security-critical events (permission changes, restores) |
| `high` | Orange | Important events (deletes, password changes, failed logins) |
| `medium` | Yellow | Standard operations (creates, updates, exports) |
| `low` | Gray | Routine events (reads, logins, logouts) |

Severity is auto-detected based on action and entity type but can be overridden.

---

## API Endpoints

### List Logs
```
GET /api/audit.php?action=list
  &page=1
  &limit=50
  &filter_action=create
  &entity_type=student
  &severity=high
  &date_from=2026-01-01
  &date_to=2026-12-31
  &search=keyword
```

### Get Log Detail
```
GET /api/audit.php?action=detail&id=123
```

### Get Statistics
```
GET /api/audit.php?action=statistics&days=30
```

### Get Entity History
```
GET /api/audit.php?action=entity_history&entity_type=student&entity_id=123
```

### Get User Activity
```
GET /api/audit.php?action=user_activity&user_id=456
```

### Export to CSV
```
GET /api/audit.php?action=export&date_from=2026-01-01&severity=high
```

### Get Available Actions
```
GET /api/audit.php?action=actions
```

### Get Available Entities
```
GET /api/audit.php?action=entities
```

---

## Integration Examples

### In Authentication Endpoint

```php
// After successful login
AuditMiddleware::logLogin($user['id'], $user['email'], $user['role']);

// After failed login
AuditMiddleware::logLoginFailed($email, 'Invalid credentials');

// After logout
AuditMiddleware::logLogout($userId, $email);
```

### In Student CRUD

```php
// Set user context first
AuditMiddleware::setUserContext($currentUser['id'], $currentUser['email'], $currentUser['role']);

// Create
$studentId = createStudent($data);
AuditMiddleware::logCreate('student', $studentId, $data['name'], $data);

// Update
$oldData = getStudent($studentId);
updateStudent($studentId, $newData);
AuditMiddleware::logUpdate('student', $studentId, $oldData['name'], $oldData, $newData);

// Delete
$student = getStudent($studentId);
deleteStudent($studentId);
AuditMiddleware::logDelete('student', $studentId, $student['name'], $student);
```

### In Settings

```php
$oldValue = getSetting('school_name');
updateSetting('school_name', $newValue);
AuditMiddleware::logSettingsChange('school_name', $oldValue, $newValue);
```

---

## Database Schema

```sql
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    entity_name VARCHAR(255),
    description TEXT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_uri TEXT,
    severity VARCHAR(20) DEFAULT 'low',
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at)
);
```

---

## Retention & Cleanup

By default, logs are kept indefinitely. To clean up old logs:

```php
$audit = AuditLogService::getInstance();

// Delete logs older than 365 days
$deletedCount = $audit->cleanup(365);
```

### Scheduled Cleanup (Cron)

```bash
# Monthly cleanup of logs older than 1 year
0 0 1 * * php /path/to/cleanup_audit_logs.php
```

---

## Best Practices

1. **Set User Context Early**: Call `AuditMiddleware::setUserContext()` right after authentication
2. **Log Before and After**: For updates, capture old values before the change
3. **Filter Sensitive Data**: Use `AuditMiddleware::filterSensitiveFields()` to redact passwords
4. **Be Descriptive**: Include meaningful descriptions for context
5. **Don't Over-Log**: Avoid logging every read operation unless required for compliance
6. **Monitor Critical Events**: Set up alerts for critical/high severity events
7. **Regular Cleanup**: Implement retention policies to manage storage

---

## Security Considerations

- Audit logs are append-only (no update/delete via API)
- Admin-only access to audit log viewer
- Sensitive fields (passwords, tokens) should be redacted
- IP addresses and user agents are captured for forensics
- Consider encrypting old_values/new_values for sensitive entities

---

## UI Integration

Add the AuditLogs component to admin routes:

```jsx
import AuditLogs from './components/admin/AuditLogs';

// In routes
<Route path="/admin/audit-logs" element={<AuditLogs />} />
```

Add to sidebar:

```jsx
{
  name: 'Audit Logs',
  icon: Activity,
  path: '/admin/audit-logs',
}
```

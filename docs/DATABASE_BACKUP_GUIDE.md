# McSMS Database Backup System

**Date:** 2026-02-26  
**Version:** 1.0

---

## Overview

The McSMS Database Backup System provides automated and manual backup capabilities for the school management system database. It includes:

- Full database backup with compression
- Restore functionality with integrity verification
- Scheduled automated backups via cron
- Web-based backup management UI
- Activity logging and statistics

---

## Features

### Backup Creation
- Full SQL dump of all tables
- Gzip compression (reduces size by ~90%)
- MD5 checksum for integrity verification
- Metadata storage (tables, rows, timestamp)
- Automatic cleanup of old backups

### Restore
- Integrity verification before restore
- Transaction-based restore for consistency
- Automatic foreign key handling
- Detailed error logging

### Management
- List all available backups
- Download backups
- Delete old backups
- View activity logs
- Statistics dashboard

---

## File Structure

```
backend/
├── src/
│   └── Backup/
│       └── DatabaseBackupService.php   # Core backup service
├── api/
│   └── backup.php                      # REST API endpoints
├── cron/
│   └── backup_cron.php                 # Scheduled backup script
└── backups/                            # Backup storage (auto-created)
    ├── .htaccess                       # Deny web access
    ├── backup_*.sql.gz                 # Compressed backups
    └── backup_*.sql.json               # Backup metadata

frontend/
└── src/
    └── components/
        └── admin/
            └── BackupManagement.jsx    # Admin UI component
```

---

## API Endpoints

### List Backups
```
GET /api/backup.php?action=list
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "backups": [
    {
      "filename": "backup_school_2026-02-26_14-30-00.sql.gz",
      "created_at": "2026-02-26 14:30:00",
      "size": 1234567,
      "size_formatted": "1.18 MB",
      "tables": 45,
      "rows": 12500,
      "description": "Daily automated backup"
    }
  ]
}
```

### Create Backup
```
POST /api/backup.php?action=create
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Pre-update backup"
}
```

### Restore Backup
```
POST /api/backup.php?action=restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "backup_school_2026-02-26_14-30-00.sql.gz"
}
```

### Download Backup
```
GET /api/backup.php?action=download&filename=<filename>
Authorization: Bearer <token>
```

### Delete Backup
```
DELETE /api/backup.php?action=delete&filename=<filename>
Authorization: Bearer <token>
```

### Get Statistics
```
GET /api/backup.php?action=statistics
Authorization: Bearer <token>
```

### Get Activity Logs
```
GET /api/backup.php?action=logs&limit=50
Authorization: Bearer <token>
```

---

## Scheduled Backups

### Setup Cron Job

Add to your crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * php /path/to/McSMS/backend/cron/backup_cron.php daily

# Weekly backup on Sunday at 3 AM
0 3 * * 0 php /path/to/McSMS/backend/cron/backup_cron.php weekly

# Monthly backup on 1st at 4 AM
0 4 1 * * php /path/to/McSMS/backend/cron/backup_cron.php monthly
```

### Windows Task Scheduler

Create a scheduled task:
```
Program: php.exe
Arguments: D:\xampp\htdocs\McSMS\backend\cron\backup_cron.php daily
Start in: D:\xampp\htdocs\McSMS\backend\cron
```

---

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Backup Configuration
MAX_BACKUPS=10              # Maximum number of backups to keep
BACKUP_DIR=backups          # Backup directory (relative to backend)
```

### Default Settings
- **Max Backups**: 10 (oldest are automatically deleted)
- **Compression**: Gzip level 9 (maximum)
- **Storage**: `backend/backups/`

---

## Security

### Access Control
- All backup endpoints require Bearer token authentication
- Admin role verification (TODO: implement in production)
- Rate limiting applied to prevent abuse

### File Protection
- `.htaccess` denies direct web access to backup files
- Filename validation prevents directory traversal
- Checksum verification ensures backup integrity

### Best Practices
1. Store backups off-site (cloud storage, external drive)
2. Test restore process regularly
3. Encrypt sensitive backups before transfer
4. Monitor backup logs for failures
5. Set up alerts for failed backups

---

## Troubleshooting

### Backup Fails
1. Check disk space: `df -h`
2. Verify database credentials in `.env`
3. Check PHP memory limit: `memory_limit` in php.ini
4. Review error logs: `backend/logs/backup_errors.log`

### Restore Fails
1. Verify backup file integrity (checksum)
2. Check for foreign key constraint issues
3. Ensure sufficient database privileges
4. Review MySQL error logs

### Large Database
For databases > 100MB:
1. Increase PHP `max_execution_time`
2. Increase `memory_limit`
3. Consider using mysqldump directly for very large databases

---

## Manual Backup (CLI)

```bash
# Create backup
php backend/cron/backup_cron.php manual

# Using mysqldump directly
mysqldump -u root -p school_management_system | gzip > backup.sql.gz
```

---

## Restore from CLI

```bash
# Decompress and restore
gunzip < backup.sql.gz | mysql -u root -p school_management_system
```

---

## Integration

### Adding to Admin Menu

Add the BackupManagement component to your admin routes:

```jsx
import BackupManagement from './components/admin/BackupManagement';

// In your routes
<Route path="/admin/backup" element={<BackupManagement />} />
```

### Adding to Sidebar

```jsx
{
  name: 'Database Backup',
  icon: Database,
  path: '/admin/backup',
}
```

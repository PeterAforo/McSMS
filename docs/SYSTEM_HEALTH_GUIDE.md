# McSMS System Health Monitoring Guide

**Date:** 2026-02-26  
**Version:** 1.0

---

## Overview

The System Health Monitoring feature provides real-time visibility into server health, database status, disk space, memory usage, and application metrics. It helps administrators identify and resolve issues before they impact users.

---

## Features

- **Health Checks**: Database, disk, memory, PHP, cache, uploads, logs
- **Status Levels**: Healthy, Warning, Critical, Unknown
- **Application Metrics**: User counts, login trends, error rates
- **Error Tracking**: Recent critical/high severity events
- **Auto-Refresh**: Configurable automatic updates
- **Public Ping**: Simple endpoint for uptime monitoring

---

## File Structure

```
backend/
├── src/
│   └── Health/
│       └── SystemHealthService.php   # Core health monitoring service
├── api/
│   └── health.php                    # REST API endpoints
└── logs/
    └── metrics/                      # Metrics storage (auto-created)

frontend/
└── src/
    └── components/
        └── admin/
            └── SystemHealth.jsx      # Admin dashboard component
```

---

## API Endpoints

### Ping (Public)
Simple endpoint for uptime monitoring services.
```
GET /api/health.php?action=ping
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-26 14:30:00"
}
```

### Full Status
```
GET /api/health.php?action=status
Authorization: Bearer <token>
```
Response includes all health checks with details.

### Individual Checks
```
GET /api/health.php?action=database
GET /api/health.php?action=disk
GET /api/health.php?action=memory
GET /api/health.php?action=php
Authorization: Bearer <token>
```

### Application Metrics
```
GET /api/health.php?action=metrics
Authorization: Bearer <token>
```

### Recent Errors
```
GET /api/health.php?action=errors&limit=20
Authorization: Bearer <token>
```

### Server Info
```
GET /api/health.php?action=server
Authorization: Bearer <token>
```

---

## Health Checks

### Database
- **Response Time**: Query latency in milliseconds
- **Size**: Total database size
- **Tables**: Number of tables
- **Connections**: Active vs max connections

**Thresholds:**
- Warning: Response time > 100ms or connections > 80%
- Critical: Connection failed

### Disk Space
- **Total**: Total disk capacity
- **Free**: Available space
- **Used**: Space in use with percentage

**Thresholds:**
- Warning: Used > 80%
- Critical: Used > 90%

### Memory
- **Limit**: PHP memory limit
- **Usage**: Current memory usage
- **Peak**: Peak memory usage

**Thresholds:**
- Warning: Usage > 75%
- Critical: Usage > 90%

### PHP
- **Version**: PHP version check
- **Extensions**: Required extensions status
- **Configuration**: Key PHP settings

**Required Extensions:**
- pdo, pdo_mysql, json, mbstring, curl, gd, zip

### Cache
- **Writable**: Write permission check
- **Size**: Cache directory size

### Uploads
- **Writable**: Write permission check
- **Size**: Total uploads size
- **Files**: File count

### Logs
- **Writable**: Write permission check
- **Size**: Log files size (warning if > 100MB)

---

## Application Metrics

| Metric | Description |
|--------|-------------|
| `total_users` | Total registered users |
| `active_users_24h` | Users logged in last 24 hours |
| `total_students` | Total student records |
| `users_by_role` | User count per role |
| `login_trend` | Daily login counts (7 days) |
| `errors_24h` | Critical/high events in 24 hours |

---

## Status Levels

| Status | Color | Description |
|--------|-------|-------------|
| `healthy` | Green | All checks passed |
| `warning` | Yellow | Some checks need attention |
| `critical` | Red | Critical issues detected |
| `unknown` | Gray | Unable to determine status |

---

## Integration

### Uptime Monitoring
Use the ping endpoint with services like:
- UptimeRobot
- Pingdom
- StatusCake

```
URL: https://your-domain.com/api/health.php?action=ping
Expected: {"status":"ok",...}
```

### Alerting
Set up alerts based on the status endpoint:
```bash
# Example cron check
*/5 * * * * curl -s https://your-domain.com/api/health.php?action=status | grep -q '"status":"healthy"' || send_alert
```

### Dashboard Integration
Add to admin routes:
```jsx
import SystemHealth from './components/admin/SystemHealth';

<Route path="/admin/system-health" element={<SystemHealth />} />
```

Add to sidebar:
```jsx
{
  name: 'System Health',
  icon: Activity,
  path: '/admin/system-health',
}
```

---

## Custom Metrics

Record custom metrics for tracking:

```php
require_once __DIR__ . '/../src/Health/SystemHealthService.php';
use McSMS\Health\SystemHealthService;

$health = new SystemHealthService();

// Record a metric
$health->recordMetric('api_response_time', 150, ['endpoint' => '/api/students']);
$health->recordMetric('payment_processed', 1, ['amount' => 500]);

// Retrieve metrics
$metrics = $health->getMetrics('api_response_time', 7); // Last 7 days
```

---

## Troubleshooting

### Database Connection Failed
1. Check database credentials in `.env`
2. Verify MySQL service is running
3. Check firewall rules

### Disk Space Critical
1. Clear old log files: `rm -rf backend/logs/*.log`
2. Clear cache: `rm -rf backend/cache/*`
3. Archive old backups

### Memory Usage High
1. Increase `memory_limit` in php.ini
2. Optimize queries with large result sets
3. Check for memory leaks in custom code

### PHP Extensions Missing
Install required extensions:
```bash
# Ubuntu/Debian
sudo apt-get install php-pdo php-mysql php-mbstring php-curl php-gd php-zip

# Windows (XAMPP)
# Enable in php.ini
```

---

## Best Practices

1. **Monitor Regularly**: Check dashboard daily or set up alerts
2. **Set Thresholds**: Adjust warning levels based on your server
3. **Clean Up**: Regularly clean logs and cache
4. **Backup Before Issues**: Create backups when warnings appear
5. **Document Changes**: Log any server configuration changes
6. **Test Alerts**: Verify alerting works before relying on it

---

## Security

- Detailed health info requires authentication
- Public ping endpoint only returns basic status
- Sensitive paths are not exposed
- Rate limiting applied to prevent abuse

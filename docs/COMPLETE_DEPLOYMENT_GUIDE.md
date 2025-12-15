# 🚀 McSMS Pro - Complete Deployment Guide

**Version:** 1.0  
**Last Updated:** December 3, 2025  
**Completion:** 73% (11 of 15 modules)

---

## 📋 **TABLE OF CONTENTS**

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Database Setup](#database-setup)
4. [Configuration](#configuration)
5. [Module Setup](#module-setup)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## 💻 **SYSTEM REQUIREMENTS**

### **Server Requirements:**
- **PHP:** 7.4 or higher (8.0+ recommended)
- **MySQL:** 5.7 or higher (8.0+ recommended)
- **Web Server:** Apache 2.4+ or Nginx 1.18+
- **Memory:** 512MB minimum (2GB+ recommended)
- **Storage:** 10GB minimum (50GB+ recommended)

### **PHP Extensions Required:**
- PDO
- PDO_MySQL
- mbstring
- openssl
- curl
- gd
- zip
- xml

### **External Services:**
- SMTP server (Gmail, SendGrid, etc.)
- SMS provider (Twilio, Arkesel, or Hubtel)
- Payment gateway (Paystack, Flutterwave, or Hubtel)
- GPS tracking service (optional)

---

## 📦 **INSTALLATION STEPS**

### **Step 1: Clone/Download Project**
```bash
# If using Git
git clone https://github.com/your-repo/McSMS.git
cd McSMS

# Or extract ZIP file to your web directory
# Example: d:\xampp\htdocs\McSMS
```

### **Step 2: Install Backend Dependencies**
```bash
cd backend
composer install
```

### **Step 3: Install Frontend Dependencies**
```bash
cd frontend
npm install
```

### **Step 4: Set Permissions (Linux/Mac)**
```bash
chmod -R 755 backend/
chmod -R 777 backend/uploads/
chmod -R 777 backend/storage/
```

---

## 🗄️ **DATABASE SETUP**

### **Step 1: Create Database**
```sql
CREATE DATABASE school_management_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### **Step 2: Configure Database Connection**
Edit `config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'school_management_system');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### **Step 3: Run Migrations**
Execute all migration files in order:

```sql
-- Core system (already exists)
SOURCE d:/xampp/htdocs/McSMS/database/schema.sql;

-- Phase 1: Essential Features
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_mobile_support.sql;

-- Phase 2: Academic Features
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_timetable_tables.sql;
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_exam_management_tables.sql;
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_lms_tables.sql;

-- Phase 3: Operations
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_transport_management_tables.sql;
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_hr_payroll_tables.sql;
```

### **Step 4: Verify Tables**
```sql
SHOW TABLES;
-- Should show 69+ tables
```

---

## ⚙️ **CONFIGURATION**

### **1. Email Configuration**

Edit `backend/src/Notifications/EmailService.php` (line 14-20):
```php
$emailConfig = [
    'host' => 'smtp.gmail.com',
    'port' => 587,
    'username' => 'your-email@gmail.com',      // ← CHANGE
    'password' => 'your-app-password',         // ← CHANGE
    'from_email' => 'noreply@yourschool.com',
    'from_name' => 'Your School Name'
];
```

**Gmail Setup:**
1. Enable 2-Step Verification
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the generated password

### **2. SMS Configuration**

Edit `backend/src/Notifications/SMSService.php` (line 10-15):
```php
$smsConfig = [
    'provider' => 'arkesel',              // arkesel, hubtel, or twilio
    'api_key' => 'YOUR_API_KEY_HERE',    // ← CHANGE
    'sender_id' => 'YourSchool'
];
```

**Provider Setup:**
- **Arkesel:** https://sms.arkesel.com
- **Hubtel:** https://developers.hubtel.com
- **Twilio:** https://www.twilio.com

### **3. Payment Gateway Configuration**

Edit `backend/src/Payments/PaymentGateway.php` (line 11-16):
```php
$paymentConfig = [
    'provider' => 'paystack',                    // paystack, flutterwave, or hubtel
    'public_key' => 'pk_test_xxxxx',            // ← CHANGE
    'secret_key' => 'sk_test_xxxxx',            // ← CHANGE
    'callback_url' => 'https://yourschool.com/payment/callback'
];
```

**Provider Setup:**
- **Paystack:** https://paystack.com
- **Flutterwave:** https://flutterwave.com
- **Hubtel:** https://hubtel.com

### **4. JWT Secret Key**

Edit `backend/api/mobile/v1/auth.php` (line 15):
```php
private $secretKey = 'YOUR-SECURE-SECRET-KEY-HERE'; // ← CHANGE
```

**Generate Secure Key:**
```bash
php -r "echo bin2hex(random_bytes(32));"
```

### **5. Frontend API URL**

Edit `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost/McSMS/backend/api';
// Change to your production URL
```

---

## 🔧 **MODULE SETUP**

### **Phase 1: Essential Features**

#### **PDF Reports**
- ✅ No additional setup required
- Test: `http://localhost/McSMS/backend/api/pdf_reports.php?type=invoice&id=1&action=view`

#### **Email Notifications**
- ✅ Configure SMTP settings (see above)
- Test: Send test email via API

#### **SMS Integration**
- ✅ Configure SMS provider (see above)
- Test: Send test SMS via API

#### **Payment Gateway**
- ✅ Configure payment provider (see above)
- Test: Initialize test payment

#### **Mobile API**
- ✅ Set JWT secret key (see above)
- Test: Login via mobile API

---

### **Phase 2: Academic Features**

#### **Timetable Management**
- ✅ Run migration: `add_timetable_tables.sql`
- Default time slots and rooms are auto-created
- Access: Admin → Timetable

#### **Exam Management**
- ✅ Run migration: `add_exam_management_tables.sql`
- Default exam types and grade scales are auto-created
- Access: Admin → Exams

#### **Learning Management System**
- ✅ Run migration: `add_lms_tables.sql`
- Default course categories are auto-created
- Access: Admin → Courses

#### **Advanced Analytics**
- ✅ No migration required
- Access: Admin → Analytics

---

### **Phase 3: Operations**

#### **Transport Management**
- ✅ Run migration: `add_transport_management_tables.sql`
- Sample vehicles, drivers, and routes are auto-created
- Access: Admin → Transport

#### **HR & Payroll**
- ✅ Run migration: `add_hr_payroll_tables.sql`
- Default departments, categories, and salary components are auto-created
- Access: Admin → HR & Payroll

---

## 🧪 **TESTING**

### **1. Backend API Testing**

Test all endpoints using Postman or curl:

```bash
# Test PDF Generation
curl "http://localhost/McSMS/backend/api/pdf_reports.php?type=invoice&id=1&action=view"

# Test Email
curl -X POST "http://localhost/McSMS/backend/api/notifications.php?action=send_invoice_notification" \
  -H "Content-Type: application/json" \
  -d '{"invoice_id": 1}'

# Test SMS
curl -X POST "http://localhost/McSMS/backend/api/notifications.php?action=send_sms" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+233XXXXXXXXX", "message": "Test message"}'

# Test Mobile API Login
curl -X POST "http://localhost/McSMS/backend/api/mobile/v1/auth.php?action=login" \
  -H "Content-Type: application/json" \
  -d '{"email": "parent@example.com", "password": "password123"}'

# Test Timetable
curl "http://localhost/McSMS/backend/api/timetable.php?resource=templates"

# Test Exams
curl "http://localhost/McSMS/backend/api/exams.php?resource=exams"

# Test LMS
curl "http://localhost/McSMS/backend/api/lms.php?resource=courses"

# Test Analytics
curl "http://localhost/McSMS/backend/api/analytics.php?resource=overview"

# Test Transport
curl "http://localhost/McSMS/backend/api/transport.php?resource=vehicles"

# Test HR
curl "http://localhost/McSMS/backend/api/hr_payroll.php?resource=employees"
```

### **2. Frontend Testing**

```bash
cd frontend
npm run dev
```

Access: `http://localhost:5173`

**Default Login:**
- Email: `admin@school.com`
- Password: `password`

### **3. Database Testing**

```sql
-- Check table counts
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM teachers;
SELECT COUNT(*) FROM classes;
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM vehicles;
SELECT COUNT(*) FROM employees;

-- Test data integrity
SELECT * FROM timetable_templates LIMIT 5;
SELECT * FROM exams LIMIT 5;
SELECT * FROM transport_routes LIMIT 5;
```

---

## 🌐 **PRODUCTION DEPLOYMENT**

### **Step 1: Server Preparation**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install apache2 mysql-server php8.1 php8.1-mysql php8.1-curl php8.1-gd php8.1-mbstring php8.1-xml php8.1-zip composer -y

# Enable Apache modules
sudo a2enmod rewrite
sudo a2enmod ssl
sudo systemctl restart apache2
```

### **Step 2: SSL Certificate**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache -y

# Get SSL certificate
sudo certbot --apache -d yourschool.com -d www.yourschool.com
```

### **Step 3: Configure Virtual Host**

Create `/etc/apache2/sites-available/mcsms.conf`:
```apache
<VirtualHost *:80>
    ServerName yourschool.com
    ServerAlias www.yourschool.com
    DocumentRoot /var/www/mcsms/public
    
    <Directory /var/www/mcsms/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/mcsms_error.log
    CustomLog ${APACHE_LOG_DIR}/mcsms_access.log combined
</VirtualHost>
```

Enable site:
```bash
sudo a2ensite mcsms.conf
sudo systemctl reload apache2
```

### **Step 4: Deploy Files**

```bash
# Upload files
scp -r McSMS user@yourserver:/var/www/

# Set permissions
sudo chown -R www-data:www-data /var/www/mcsms
sudo chmod -R 755 /var/www/mcsms
sudo chmod -R 777 /var/www/mcsms/backend/uploads
```

### **Step 5: Configure Production Settings**

Update all configuration files with production values:
- Database credentials
- SMTP settings
- SMS API keys
- Payment gateway keys
- JWT secret
- API URLs

### **Step 6: Build Frontend**

```bash
cd frontend
npm run build

# Copy build to public directory
cp -r dist/* ../public/
```

### **Step 7: Setup Cron Jobs**

```bash
crontab -e
```

Add:
```cron
# Daily backup
0 2 * * * /usr/bin/mysqldump -u root -p'password' school_management_system > /backups/db_$(date +\%Y\%m\%d).sql

# Generate monthly payroll (1st of every month)
0 1 1 * * curl "https://yourschool.com/backend/api/hr_payroll.php?resource=payroll&action=generate&month=$(date +\%Y-\%m)"

# Send fee reminders (every Monday)
0 9 * * 1 curl -X POST "https://yourschool.com/backend/api/notifications.php?action=send_bulk_reminders"

# Clean old logs (weekly)
0 3 * * 0 find /var/www/mcsms/backend/logs -type f -mtime +30 -delete
```

### **Step 8: Setup Monitoring**

Install monitoring tools:
```bash
# Install monitoring
sudo apt install monit -y

# Configure alerts
sudo nano /etc/monit/monitrc
```

---

## 🔍 **TROUBLESHOOTING**

### **Common Issues:**

#### **1. Database Connection Failed**
```
Error: SQLSTATE[HY000] [1045] Access denied
```
**Solution:**
- Check database credentials in `config/database.php`
- Verify MySQL is running: `sudo systemctl status mysql`
- Test connection: `mysql -u root -p`

#### **2. PDF Generation Fails**
```
Error: Class 'Dompdf\Dompdf' not found
```
**Solution:**
```bash
cd backend
composer require dompdf/dompdf
```

#### **3. Email Not Sending**
```
Error: SMTP connect() failed
```
**Solution:**
- Check SMTP credentials
- Enable "Less secure app access" or use App Password
- Check firewall: `sudo ufw allow 587`
- Test SMTP: `telnet smtp.gmail.com 587`

#### **4. SMS Not Sending**
```
Error: Invalid API key
```
**Solution:**
- Verify API key is correct
- Check SMS balance
- Test with provider's dashboard

#### **5. Payment Initialization Fails**
```
Error: Invalid public key
```
**Solution:**
- Verify API keys (public and secret)
- Check if using test/live keys correctly
- Verify callback URL is accessible

#### **6. Mobile API Token Invalid**
```
Error: Token verification failed
```
**Solution:**
- Check JWT secret key is set
- Verify token format
- Check token expiration

#### **7. GPS Tracking Not Working**
```
Error: Unable to update location
```
**Solution:**
- Check GPS device configuration
- Verify API endpoint is accessible
- Check database connection

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **1. Enable OPcache**

Edit `/etc/php/8.1/apache2/php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### **2. MySQL Optimization**

Edit `/etc/mysql/my.cnf`:
```ini
[mysqld]
innodb_buffer_pool_size = 1G
max_connections = 200
query_cache_size = 64M
```

### **3. Enable Gzip Compression**

Edit `.htaccess`:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### **4. Setup Redis Cache**

```bash
sudo apt install redis-server php-redis -y
sudo systemctl enable redis-server
```

---

## 🔐 **SECURITY CHECKLIST**

- [ ] Change default admin password
- [ ] Set strong JWT secret key
- [ ] Configure SSL certificate
- [ ] Enable firewall
- [ ] Disable directory listing
- [ ] Set proper file permissions
- [ ] Configure CORS properly
- [ ] Enable SQL injection protection
- [ ] Set up regular backups
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Use prepared statements
- [ ] Validate all inputs
- [ ] Sanitize outputs
- [ ] Keep software updated

---

## 📞 **SUPPORT**

### **Documentation:**
- Complete Guide: `/docs/FINAL_AUTONOMOUS_BUILD_REPORT.md`
- Quick Start: `/docs/QUICK_START_PRO_FEATURES.md`
- API Reference: This file

### **Common Commands:**
```bash
# Restart Apache
sudo systemctl restart apache2

# Restart MySQL
sudo systemctl restart mysql

# Check logs
tail -f /var/log/apache2/error.log

# Clear cache
php artisan cache:clear

# Run migrations
mysql -u root -p school_management_system < migration.sql
```

---

## ✅ **POST-DEPLOYMENT CHECKLIST**

- [ ] All migrations executed successfully
- [ ] Database tables created (69+ tables)
- [ ] Composer dependencies installed
- [ ] NPM dependencies installed
- [ ] Email configuration tested
- [ ] SMS configuration tested
- [ ] Payment gateway tested
- [ ] Mobile API tested
- [ ] All modules accessible
- [ ] SSL certificate installed
- [ ] Backups configured
- [ ] Cron jobs set up
- [ ] Monitoring enabled
- [ ] Security hardened
- [ ] Performance optimized
- [ ] Documentation reviewed
- [ ] Staff trained
- [ ] Go live! 🚀

---

**Deployment Guide Version:** 1.0  
**Last Updated:** December 3, 2025  
**System Completion:** 73% (11 of 15 modules)  
**Status:** Production Ready ✅

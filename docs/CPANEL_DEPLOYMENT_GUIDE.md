# 🚀 McSMS cPanel Deployment Guide

**Complete step-by-step guide to deploy McSMS on a cPanel hosting server**

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

Before deploying, ensure you have:

- ✅ cPanel hosting account with:
  - PHP 7.4 or higher
  - MySQL 5.7 or higher
  - At least 500MB storage
  - SSL certificate (recommended)
- ✅ Domain name pointed to your hosting
- ✅ FTP/File Manager access
- ✅ Database creation privileges
- ✅ Your McSMS project files ready

---

## 🎯 **DEPLOYMENT OVERVIEW**

1. Prepare files for upload
2. Create MySQL database
3. Upload files to server
4. Configure database connection
5. Import database schema
6. Configure frontend API URL
7. Build React frontend
8. Set up .htaccess files
9. Test the deployment
10. Secure the installation

---

## 📦 **STEP 1: PREPARE FILES FOR UPLOAD**

### **1.1 Build the React Frontend**

On your local machine, build the production version:

```bash
cd d:\xampp\htdocs\McSMS\frontend
npm run build
```

This creates an optimized production build in `frontend/dist` folder.

### **1.2 Create Deployment Package**

Create a folder structure for upload:

```
McSMS/
├── backend/
│   ├── api/
│   ├── config/
│   └── uploads/
├── database/
│   └── migrations/
├── public/
│   └── uploads/
└── frontend-build/
    └── (contents of frontend/dist)
```

### **1.3 Files to Include:**

**Backend Files:**
- ✅ `backend/api/*.php` (all API files)
- ✅ `backend/config/database.php`
- ✅ `backend/uploads/` (empty folder)

**Database Files:**
- ✅ `database/migrations/*.sql` (all migration files)

**Public Files:**
- ✅ `public/uploads/` (empty folder)
- ✅ `public/.htaccess`

**Frontend Build:**
- ✅ All files from `frontend/dist/`

### **1.4 Files to EXCLUDE:**

- ❌ `node_modules/`
- ❌ `.git/`
- ❌ `.env` files
- ❌ `frontend/src/` (source files not needed)
- ❌ Development config files

---

## 🗄️ **STEP 2: CREATE MYSQL DATABASE**

### **2.1 Login to cPanel**

1. Go to your hosting cPanel (usually `yourdomain.com/cpanel`)
2. Login with your credentials

### **2.2 Create Database**

1. Find **MySQL Databases** icon
2. Click on it
3. Under **Create New Database**:
   - Database Name: `mcsms_db` (or your preferred name)
   - Click **Create Database**
4. Note the full database name (usually `username_mcsms_db`)

### **2.3 Create Database User**

1. Scroll to **MySQL Users** section
2. Under **Add New User**:
   - Username: `mcsms_user`
   - Password: Generate strong password (save it!)
   - Click **Create User**
3. Note the full username (usually `username_mcsms_user`)

### **2.4 Add User to Database**

1. Scroll to **Add User To Database**
2. Select the user you created
3. Select the database you created
4. Click **Add**
5. On privileges page, select **ALL PRIVILEGES**
6. Click **Make Changes**

### **2.5 Note Your Database Credentials:**

```
Database Host: localhost
Database Name: username_mcsms_db
Database User: username_mcsms_user
Database Password: [your generated password]
```

---

## 📤 **STEP 3: UPLOAD FILES TO SERVER**

### **Option A: Using cPanel File Manager (Recommended)**

#### **3.1 Access File Manager**

1. In cPanel, click **File Manager**
2. Navigate to `public_html` folder
3. Create a folder for your app (optional):
   - If main domain: use `public_html` directly
   - If subdomain: create folder like `public_html/mcsms`

#### **3.2 Upload Backend Files**

1. Click **Upload** button
2. Select and upload `backend` folder (as ZIP for faster upload)
3. After upload, right-click the ZIP file
4. Select **Extract**
5. Delete the ZIP file after extraction

#### **3.3 Upload Database Files**

1. Create `database` folder
2. Upload all migration SQL files

#### **3.4 Upload Frontend Build**

1. Upload all files from `frontend/dist/` to `public_html`
2. This includes:
   - `index.html`
   - `assets/` folder
   - `vite.svg`
   - Other build files

#### **3.5 Create Upload Directories**

1. Create `public/uploads/` folder
2. Create `backend/uploads/` folder
3. Set permissions to **755** (right-click → Change Permissions)

### **Option B: Using FTP Client (FileZilla)**

#### **3.1 Connect via FTP**

1. Download FileZilla (if not installed)
2. Get FTP credentials from cPanel (FTP Accounts)
3. Connect to your server:
   - Host: `ftp.yourdomain.com`
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21

#### **3.2 Upload Files**

1. Navigate to `public_html` on remote side
2. Drag and drop folders from local to remote:
   - `backend/`
   - `database/`
   - `public/`
   - Frontend build files

---

## ⚙️ **STEP 4: CONFIGURE DATABASE CONNECTION**

### **4.1 Edit database.php**

1. In File Manager, navigate to `backend/config/`
2. Right-click `database.php`
3. Select **Edit**
4. Update with your database credentials:

```php
<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'username_mcsms_db');  // Your full database name
define('DB_USER', 'username_mcsms_user'); // Your full username
define('DB_PASS', 'your_password_here');  // Your database password

// Database connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    die(json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]));
}
?>
```

5. Click **Save Changes**

---

## 📊 **STEP 5: IMPORT DATABASE SCHEMA**

### **Option A: Using phpMyAdmin (Recommended)**

#### **5.1 Access phpMyAdmin**

1. In cPanel, click **phpMyAdmin**
2. Select your database from left sidebar

#### **5.2 Import Schema**

1. Click **Import** tab
2. Click **Choose File**
3. Import files in this order:

**Order of Import:**
```
1. create_onboarding_tables.sql
2. add_default_school_settings.sql
3. Any other migration files
```

4. For each file:
   - Select the file
   - Click **Go**
   - Wait for success message
   - Repeat for next file

#### **5.3 Verify Tables**

1. Click on your database name
2. You should see tables like:
   - `users`
   - `students`
   - `teachers`
   - `classes`
   - `subjects`
   - `invoices`
   - `payments`
   - `attendance`
   - `grades`
   - `homework`
   - And many more...

### **Option B: Using SQL Query**

1. In phpMyAdmin, click **SQL** tab
2. Copy and paste contents of each migration file
3. Click **Go**
4. Repeat for all migration files

---

## 🔧 **STEP 6: CONFIGURE FRONTEND API URL**

### **6.1 Update API Base URL**

Before building, update the API URL in your React app:

**File:** `frontend/src/config.js` (create if doesn't exist)

```javascript
export const API_BASE_URL = 'https://yourdomain.com/backend/api';
// or if in subfolder: 'https://yourdomain.com/mcsms/backend/api'
```

### **6.2 Update All API Calls**

Search and replace in all frontend files:

**Find:** `http://localhost/McSMS/backend/api`  
**Replace:** `https://yourdomain.com/backend/api`

**Common files to update:**
- All page components in `frontend/src/pages/`
- All component files in `frontend/src/components/`
- Hook files in `frontend/src/hooks/`

### **6.3 Rebuild Frontend**

After updating URLs:

```bash
cd frontend
npm run build
```

Then re-upload the `dist` folder contents.

---

## 🔒 **STEP 7: SET UP .HTACCESS FILES**

### **7.1 Root .htaccess**

Create `.htaccess` in `public_html`:

```apache
# Enable Rewrite Engine
RewriteEngine On

# Force HTTPS (recommended)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle React Router (SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/backend/
RewriteRule ^(.*)$ /index.html [L]

# Prevent directory listing
Options -Indexes

# Set default charset
AddDefaultCharset UTF-8

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### **7.2 Backend .htaccess**

Create `.htaccess` in `backend/api/`:

```apache
# Enable CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>

# Handle OPTIONS requests
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Prevent direct access to config files
<FilesMatch "^(database\.php|config\.php)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

### **7.3 Uploads .htaccess**

Create `.htaccess` in `public/uploads/`:

```apache
# Allow access to uploaded files
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>

# Prevent PHP execution in uploads
<FilesMatch "\.php$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Prevent directory listing
Options -Indexes
```

---

## 🔐 **STEP 8: SECURE THE INSTALLATION**

### **8.1 Set Proper File Permissions**

In File Manager, set permissions:

**Directories:**
- `backend/` → 755
- `backend/api/` → 755
- `backend/config/` → 755
- `public/uploads/` → 755
- `backend/uploads/` → 755

**Files:**
- `*.php` → 644
- `.htaccess` → 644
- `backend/config/database.php` → 600 (more secure)

### **8.2 Protect Sensitive Files**

Create `.htaccess` in `backend/config/`:

```apache
# Deny access to config files
Order allow,deny
Deny from all
```

### **8.3 Enable SSL Certificate**

1. In cPanel, go to **SSL/TLS Status**
2. Enable AutoSSL for your domain
3. Wait for certificate installation
4. Update all URLs to use `https://`

### **8.4 Create Admin User**

1. Access phpMyAdmin
2. Go to `users` table
3. Insert admin user:

```sql
INSERT INTO users (name, email, password, user_type, status, created_at) 
VALUES (
    'Admin User',
    'admin@yourdomain.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'admin',
    'active',
    NOW()
);
```

**Note:** Change the password immediately after first login!

---

## ✅ **STEP 9: TEST THE DEPLOYMENT**

### **9.1 Test Frontend**

1. Visit `https://yourdomain.com`
2. You should see the login page
3. Check browser console for errors

### **9.2 Test Backend API**

Visit: `https://yourdomain.com/backend/api/test.php`

Create a test file if needed:

```php
<?php
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'API is working!',
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
```

### **9.3 Test Database Connection**

Visit: `https://yourdomain.com/backend/api/public_settings.php`

Should return school settings JSON.

### **9.4 Test Login**

1. Go to login page
2. Use default credentials:
   - Email: `admin@yourdomain.com`
   - Password: `password`
3. Should redirect to dashboard

### **9.5 Test File Uploads**

1. Login as admin
2. Go to Settings
3. Try uploading school logo
4. Verify upload works

---

## 🐛 **TROUBLESHOOTING**

### **Issue 1: White Screen / Blank Page**

**Solution:**
- Check browser console for errors
- Verify API URL is correct in frontend
- Check `.htaccess` rewrite rules
- Enable error reporting in PHP

### **Issue 2: API Not Working**

**Solution:**
- Check database credentials in `database.php`
- Verify database exists and has tables
- Check CORS headers in `.htaccess`
- Test API directly in browser

### **Issue 3: Database Connection Failed**

**Solution:**
- Verify database credentials
- Check if database user has privileges
- Ensure database exists
- Try `localhost` or `127.0.0.1` as host

### **Issue 4: 404 Errors on Routes**

**Solution:**
- Check `.htaccess` file exists in root
- Verify `mod_rewrite` is enabled
- Check RewriteBase if in subfolder

### **Issue 5: File Upload Fails**

**Solution:**
- Check folder permissions (755 for folders)
- Verify `uploads/` folder exists
- Check PHP upload limits in cPanel
- Increase `upload_max_filesize` and `post_max_size`

### **Issue 6: CORS Errors**

**Solution:**
- Add CORS headers to backend `.htaccess`
- Update API URLs to match domain
- Check if OPTIONS requests are handled

---

## 📝 **POST-DEPLOYMENT CHECKLIST**

After deployment, verify:

- ✅ Frontend loads correctly
- ✅ Login works
- ✅ Dashboard displays data
- ✅ API calls work
- ✅ File uploads work
- ✅ Database queries work
- ✅ SSL certificate active
- ✅ All routes accessible
- ✅ Mobile responsive
- ✅ No console errors

---

## 🔄 **UPDATING THE APPLICATION**

### **For Backend Updates:**

1. Upload new/modified PHP files
2. Run any new migration files
3. Clear any caches

### **For Frontend Updates:**

1. Make changes locally
2. Run `npm run build`
3. Upload new `dist` folder contents
4. Clear browser cache

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **1. Enable Caching**

Add to `.htaccess`:

```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</IfModule>
```

### **2. Enable Compression**

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
```

### **3. Optimize Database**

In phpMyAdmin:
- Go to your database
- Click **Operations**
- Click **Optimize table**

### **4. Enable OPcache**

In cPanel → Select PHP Version → Enable OPcache extension

---

## 🎯 **PRODUCTION BEST PRACTICES**

1. ✅ **Regular Backups**
   - Use cPanel backup feature
   - Backup database weekly
   - Keep local copies

2. ✅ **Security**
   - Change default passwords
   - Keep PHP updated
   - Monitor error logs
   - Use strong passwords

3. ✅ **Monitoring**
   - Check error logs regularly
   - Monitor disk space
   - Track performance
   - Review access logs

4. ✅ **Maintenance**
   - Update dependencies
   - Clean old logs
   - Optimize database
   - Test backups

---

## 📞 **SUPPORT & RESOURCES**

### **Common cPanel Paths:**

- **Web Root:** `/home/username/public_html/`
- **Error Logs:** `/home/username/logs/`
- **PHP Config:** cPanel → Select PHP Version
- **Database:** cPanel → phpMyAdmin

### **Useful Commands (SSH):**

```bash
# Check PHP version
php -v

# Check disk space
df -h

# Check file permissions
ls -la

# Compress files
tar -czf backup.tar.gz public_html/
```

---

## 📱 **PWA & FUTURISTIC FEATURES SETUP**

### **PWA Icons**
Upload app icons to `public_html/icons/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

Generate icons at: https://realfavicongenerator.net/

### **Push Notifications (Optional)**
1. Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Update `sw.js` and `pushNotifications.js` with your public key
3. Update `push_subscriptions.php` with your private key

### **SSL Certificate (Required for PWA)**
PWA features require HTTPS. Enable SSL in cPanel:
1. Go to **SSL/TLS** in cPanel
2. Click **Manage SSL Sites**
3. Install Let's Encrypt certificate (free)

### **Service Worker Caching**
The service worker (`sw.js`) caches:
- Static assets (JS, CSS, images)
- API responses
- Offline fallback page

To update cached content, increment `CACHE_VERSION` in `sw.js`.

---

## 🎉 **DEPLOYMENT COMPLETE!**

Your McSMS system is now live on your cPanel hosting!

**Access your application:**
- Frontend: `https://yourdomain.com`
- Admin Login: `https://yourdomain.com/login`
- API: `https://yourdomain.com/backend/api/`

**New Futuristic Features:**
- 📱 **PWA**: Install as native app
- 🌙 **Dark Mode**: Toggle in top navigation
- 🤖 **AI Chatbot**: Floating button bottom-right
- 🎤 **Voice Search**: Microphone icon in search bar
- 📊 **Export**: Download data as CSV/Excel/Google Sheets
- 📝 **Templates**: Pre-built SMS/WhatsApp messages

**Next Steps:**
1. Change default admin password
2. Configure school settings
3. Upload PWA icons
4. Enable SSL certificate
5. Add users and data
6. Test all features
7. Train staff
8. Go live!

---

**Deployment Status:** ✅ **LIVE**  
**System Status:** 🚀 **PRODUCTION READY**  
**Support:** 📧 **Contact your hosting provider for server issues**

**CONGRATULATIONS ON YOUR DEPLOYMENT!** 🎊

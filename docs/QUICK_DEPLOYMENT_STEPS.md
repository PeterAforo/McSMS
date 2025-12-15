# ⚡ Quick Deployment Steps - McSMS to cPanel

**Fast track guide - 15 minutes to deploy!**

---

## 🚀 **STEP-BY-STEP (15 Minutes)**

### **1️⃣ BUILD FRONTEND (2 min)**

```bash
cd d:\xampp\htdocs\McSMS\frontend
npm run build
```

✅ Creates `dist` folder with production files

---

### **2️⃣ CREATE DATABASE (3 min)**

1. Login to cPanel
2. **MySQL Databases** → Create new database: `mcsms_db`
3. Create user: `mcsms_user` with strong password
4. Add user to database with **ALL PRIVILEGES**
5. **Note credentials!**

---

### **3️⃣ UPLOAD FILES (5 min)**

**Via cPanel File Manager:**

1. Go to `public_html`
2. Upload these folders:
   - `backend/` (entire folder)
   - `database/` (migration files)
   - `public/` (uploads folder)
3. Upload contents of `frontend/dist/` to root of `public_html`:
   - `index.html`
   - `assets/` folder
   - All other files

---

### **4️⃣ CONFIGURE DATABASE (2 min)**

Edit `backend/config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'username_mcsms_db');  // Your actual DB name
define('DB_USER', 'username_mcsms_user'); // Your actual username
define('DB_PASS', 'your_password');       // Your actual password
```

---

### **5️⃣ IMPORT DATABASE (2 min)**

1. cPanel → **phpMyAdmin**
2. Select your database
3. **Import** tab
4. Upload and import:
   - `create_onboarding_tables.sql`
   - `add_default_school_settings.sql`

---

### **6️⃣ CREATE .HTACCESS (1 min)**

Create `.htaccess` in `public_html`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/backend/
RewriteRule ^(.*)$ /index.html [L]
Options -Indexes
```

---

### **7️⃣ TEST! (1 min)**

1. Visit `https://yourdomain.com`
2. Login with default:
   - Email: `admin@example.com`
   - Password: `password`
3. **Change password immediately!**

---

## ✅ **DONE!**

Your McSMS is now live! 🎉

---

## 🔧 **COMMON ISSUES**

### **Issue: White screen**
→ Check `backend/config/database.php` credentials

### **Issue: API errors**
→ Verify database imported correctly

### **Issue: 404 on routes**
→ Check `.htaccess` file exists

### **Issue: Can't login**
→ Check database has `users` table with admin user

---

## 📝 **IMPORTANT URLS**

- **Frontend:** `https://yourdomain.com`
- **API Test:** `https://yourdomain.com/backend/api/public_settings.php`
- **Login:** `https://yourdomain.com/login`

---

## 🎯 **NEXT STEPS**

1. Change admin password
2. Update school settings
3. Upload school logo
4. Add users and data
5. Test all features

---

**DEPLOYMENT TIME: ~15 MINUTES** ⚡

For detailed guide, see `CPANEL_DEPLOYMENT_GUIDE.md`

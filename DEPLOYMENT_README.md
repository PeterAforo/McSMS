# 🚀 McSMS Deployment Guide

**Deploy your School Management System to cPanel hosting in minutes!**

---

## 📚 **DEPLOYMENT DOCUMENTATION**

We've created comprehensive deployment guides for you:

### **📖 Available Guides:**

1. **[CPANEL_DEPLOYMENT_GUIDE.md](docs/CPANEL_DEPLOYMENT_GUIDE.md)** ⭐
   - Complete step-by-step guide
   - Detailed explanations
   - Troubleshooting section
   - Security best practices
   - **READ THIS FIRST!**

2. **[QUICK_DEPLOYMENT_STEPS.md](docs/QUICK_DEPLOYMENT_STEPS.md)** ⚡
   - Fast track guide (15 minutes)
   - Essential steps only
   - Quick reference
   - **For experienced users**

3. **[DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** ✅
   - Printable checklist
   - Track your progress
   - Nothing missed
   - **Use alongside main guide**

---

## 🎯 **QUICK START**

### **What You Need:**

- ✅ cPanel hosting account
- ✅ Domain name
- ✅ FTP or File Manager access
- ✅ MySQL database access
- ✅ 15-30 minutes

### **5-Step Process:**

```
1. Build Frontend  →  2. Create Database  →  3. Upload Files
        ↓
4. Configure  →  5. Test & Go Live! 🎉
```

---

## 📦 **PRE-DEPLOYMENT**

### **Before You Start:**

1. **Update API URLs** in your frontend code:
   ```javascript
   // Find and replace in all files:
   // FROM: http://localhost/McSMS/backend/api
   // TO: https://yourdomain.com/backend/api
   ```

2. **Build Production Version:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Prepare Files:**
   - Backend files
   - Database migrations
   - Frontend build (dist folder)

---

## 🗂️ **FILE STRUCTURE ON SERVER**

```
public_html/
├── index.html              (from frontend/dist)
├── assets/                 (from frontend/dist)
├── vite.svg               (from frontend/dist)
├── backend/
│   ├── api/               (all PHP files)
│   ├── config/
│   │   └── database.php   (UPDATE THIS!)
│   └── uploads/           (create, set 755)
├── database/
│   └── migrations/        (SQL files)
├── public/
│   └── uploads/           (create, set 755)
└── .htaccess              (CREATE THIS!)
```

---

## 🗄️ **DATABASE SETUP**

### **In cPanel:**

1. **MySQL Databases** → Create database
2. Create user with password
3. Add user to database (ALL PRIVILEGES)
4. Note credentials:
   ```
   Host: localhost
   Database: username_mcsms_db
   User: username_mcsms_user
   Password: [your password]
   ```

### **Import Schema:**

1. **phpMyAdmin** → Select database
2. **Import** → Upload SQL files
3. Import in order:
   - `create_onboarding_tables.sql`
   - `add_default_school_settings.sql`

---

## ⚙️ **CONFIGURATION**

### **Update Database Config:**

Edit `backend/config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'username_mcsms_db');
define('DB_USER', 'username_mcsms_user');
define('DB_PASS', 'your_password_here');
```

### **Create .htaccess:**

In `public_html/.htaccess`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/backend/
RewriteRule ^(.*)$ /index.html [L]
Options -Indexes
```

---

## ✅ **TESTING**

### **Test These URLs:**

1. **Frontend:** `https://yourdomain.com`
   - Should show login page

2. **API:** `https://yourdomain.com/backend/api/public_settings.php`
   - Should return JSON

3. **Login:** Use default credentials:
   - Email: `admin@example.com`
   - Password: `password`
   - **Change immediately after login!**

---

## 🔒 **SECURITY**

### **Essential Security Steps:**

1. ✅ Change default admin password
2. ✅ Enable SSL certificate (HTTPS)
3. ✅ Set proper file permissions
4. ✅ Protect config files
5. ✅ Disable directory listing

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| White screen | Check database credentials |
| API errors | Verify database imported |
| 404 errors | Check .htaccess file |
| Can't login | Verify admin user exists |
| CORS errors | Add CORS headers to backend |

**See full troubleshooting guide in CPANEL_DEPLOYMENT_GUIDE.md**

---

## 📊 **DEPLOYMENT CHECKLIST**

- [ ] Build frontend (`npm run build`)
- [ ] Create database in cPanel
- [ ] Upload all files
- [ ] Configure database.php
- [ ] Import SQL migrations
- [ ] Create .htaccess files
- [ ] Set file permissions
- [ ] Test frontend loads
- [ ] Test API works
- [ ] Test login
- [ ] Change admin password
- [ ] Enable SSL
- [ ] Configure school settings

---

## 🎓 **POST-DEPLOYMENT**

### **Initial Setup:**

1. Login as admin
2. Go to **Settings**
3. Update school information
4. Upload school logo
5. Configure academic terms
6. Add classes and subjects
7. Create user accounts
8. Import data (if needed)

### **Training:**

1. Train staff on system
2. Provide user guides
3. Set up support process
4. Monitor for issues

---

## 📞 **SUPPORT**

### **Documentation:**

- Full Guide: `docs/CPANEL_DEPLOYMENT_GUIDE.md`
- Quick Guide: `docs/QUICK_DEPLOYMENT_STEPS.md`
- Checklist: `docs/DEPLOYMENT_CHECKLIST.md`
- Features: `docs/COMPLETE_FEATURES_STATUS.md`

### **Need Help?**

1. Check troubleshooting section
2. Review error logs in cPanel
3. Contact your hosting provider
4. Check browser console for errors

---

## 🎯 **DEPLOYMENT PATHS**

### **Option 1: Main Domain**
```
https://yourdomain.com → McSMS
Files in: public_html/
```

### **Option 2: Subdomain**
```
https://school.yourdomain.com → McSMS
Files in: public_html/school/
```

### **Option 3: Subfolder**
```
https://yourdomain.com/mcsms → McSMS
Files in: public_html/mcsms/
```

---

## 🚀 **READY TO DEPLOY?**

### **Choose Your Guide:**

- **New to deployment?** → Read `CPANEL_DEPLOYMENT_GUIDE.md`
- **Need it fast?** → Use `QUICK_DEPLOYMENT_STEPS.md`
- **Want a checklist?** → Print `DEPLOYMENT_CHECKLIST.md`

---

## 📈 **AFTER DEPLOYMENT**

### **Monitor:**
- Error logs
- Disk space
- Performance
- User feedback

### **Maintain:**
- Regular backups
- Security updates
- Database optimization
- Feature updates

### **Grow:**
- Add more users
- Import more data
- Enable pro features
- Customize as needed

---

## 🎉 **SUCCESS!**

Once deployed, you'll have:

- ✅ Complete school management system
- ✅ 47 features fully functional
- ✅ Admin, Teacher, and Parent portals
- ✅ Professional onboarding
- ✅ Bulk import capabilities
- ✅ Comprehensive reports
- ✅ And much more!

---

## 📝 **QUICK REFERENCE**

### **Important Files:**
```
backend/config/database.php  → Database credentials
.htaccess                    → URL rewriting
public/uploads/              → File uploads
backend/api/                 → API endpoints
```

### **Important URLs:**
```
/login                       → Login page
/admin/dashboard            → Admin dashboard
/backend/api/               → API base
```

### **Default Credentials:**
```
Email: admin@example.com
Password: password
⚠️ CHANGE IMMEDIATELY!
```

---

## 🎊 **YOU'RE READY!**

Follow the guides in the `docs/` folder and you'll have your school management system live in no time!

**Good luck with your deployment!** 🚀

---

**For detailed instructions, start with:**
👉 **[docs/CPANEL_DEPLOYMENT_GUIDE.md](docs/CPANEL_DEPLOYMENT_GUIDE.md)**

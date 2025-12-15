# ✅ McSMS Deployment Checklist

**Quick reference checklist for deploying McSMS to cPanel**

---

## 📋 **PRE-DEPLOYMENT**

### **Local Preparation:**
- [ ] Update API URLs in frontend code
- [ ] Run `npm run build` in frontend folder
- [ ] Test local build works
- [ ] Backup current database
- [ ] Prepare migration SQL files
- [ ] Create deployment folder structure

### **Hosting Requirements:**
- [ ] cPanel access credentials
- [ ] Domain name configured
- [ ] PHP 7.4+ available
- [ ] MySQL 5.7+ available
- [ ] At least 500MB storage
- [ ] SSL certificate (optional but recommended)

---

## 🗄️ **DATABASE SETUP**

- [ ] Login to cPanel
- [ ] Create MySQL database
- [ ] Create database user
- [ ] Add user to database with ALL PRIVILEGES
- [ ] Note database credentials:
  ```
  Host: localhost
  Database: _____________
  Username: _____________
  Password: _____________
  ```

---

## 📤 **FILE UPLOAD**

### **Upload via File Manager:**
- [ ] Access cPanel File Manager
- [ ] Navigate to `public_html`
- [ ] Upload `backend/` folder
- [ ] Upload `database/` folder
- [ ] Upload `public/` folder
- [ ] Upload frontend build files (from `dist/`)
- [ ] Create `public/uploads/` folder
- [ ] Create `backend/uploads/` folder

### **Set Permissions:**
- [ ] `backend/` → 755
- [ ] `backend/api/` → 755
- [ ] `backend/config/` → 755
- [ ] `public/uploads/` → 755
- [ ] `backend/uploads/` → 755
- [ ] `*.php` files → 644
- [ ] `.htaccess` files → 644

---

## ⚙️ **CONFIGURATION**

### **Database Configuration:**
- [ ] Edit `backend/config/database.php`
- [ ] Update DB_HOST (usually `localhost`)
- [ ] Update DB_NAME (your database name)
- [ ] Update DB_USER (your database user)
- [ ] Update DB_PASS (your database password)
- [ ] Save changes

### **Import Database:**
- [ ] Open phpMyAdmin
- [ ] Select your database
- [ ] Import migration files in order:
  - [ ] `create_onboarding_tables.sql`
  - [ ] `add_default_school_settings.sql`
  - [ ] Other migration files
- [ ] Verify all tables created

---

## 🔧 **HTACCESS SETUP**

### **Root .htaccess:**
- [ ] Create `.htaccess` in `public_html`
- [ ] Add rewrite rules for React Router
- [ ] Add HTTPS redirect (if SSL enabled)
- [ ] Add compression rules
- [ ] Add caching rules

### **Backend .htaccess:**
- [ ] Create `.htaccess` in `backend/api/`
- [ ] Add CORS headers
- [ ] Add OPTIONS handling
- [ ] Protect config files

### **Uploads .htaccess:**
- [ ] Create `.htaccess` in `public/uploads/`
- [ ] Allow file access
- [ ] Prevent PHP execution
- [ ] Prevent directory listing

---

## 👤 **ADMIN USER**

- [ ] Access phpMyAdmin
- [ ] Go to `users` table
- [ ] Insert admin user or verify existing
- [ ] Note admin credentials:
  ```
  Email: _____________
  Password: _____________
  ```

---

## ✅ **TESTING**

### **Frontend Tests:**
- [ ] Visit `https://yourdomain.com`
- [ ] Login page loads correctly
- [ ] No console errors
- [ ] CSS/styling loads
- [ ] Images display

### **Backend Tests:**
- [ ] Visit `https://yourdomain.com/backend/api/public_settings.php`
- [ ] Returns JSON response
- [ ] No errors displayed

### **Login Test:**
- [ ] Login with admin credentials
- [ ] Redirects to dashboard
- [ ] Dashboard loads data
- [ ] No API errors

### **Feature Tests:**
- [ ] Navigation works
- [ ] All pages load
- [ ] Forms submit correctly
- [ ] File upload works
- [ ] Data displays correctly

---

## 🔒 **SECURITY**

- [ ] Change default admin password
- [ ] Enable SSL certificate
- [ ] Update all URLs to HTTPS
- [ ] Protect config directory
- [ ] Set proper file permissions
- [ ] Disable directory listing
- [ ] Review error logs
- [ ] Test CORS settings

---

## 📊 **POST-DEPLOYMENT**

### **Configuration:**
- [ ] Update school settings
- [ ] Upload school logo
- [ ] Configure email settings (if applicable)
- [ ] Set up payment gateways (if applicable)
- [ ] Configure system settings

### **Data Setup:**
- [ ] Create academic terms
- [ ] Add classes
- [ ] Add subjects
- [ ] Add fee structure
- [ ] Import users (if bulk import)

### **Monitoring:**
- [ ] Check error logs
- [ ] Monitor disk space
- [ ] Test all features
- [ ] Verify backups working
- [ ] Check performance

---

## 🎯 **OPTIMIZATION**

- [ ] Enable OPcache in cPanel
- [ ] Enable compression
- [ ] Enable browser caching
- [ ] Optimize database tables
- [ ] Test page load speed
- [ ] Check mobile responsiveness

---

## 📝 **DOCUMENTATION**

- [ ] Document admin credentials (securely)
- [ ] Document database credentials (securely)
- [ ] Document hosting details
- [ ] Create user guide for staff
- [ ] Document backup procedures
- [ ] Note any customizations made

---

## 🔄 **BACKUP PLAN**

- [ ] Set up automatic cPanel backups
- [ ] Schedule database backups
- [ ] Test backup restoration
- [ ] Keep local backup copy
- [ ] Document backup locations

---

## 📞 **SUPPORT CONTACTS**

**Hosting Provider:**
- Support URL: _____________
- Support Email: _____________
- Support Phone: _____________

**Domain Registrar:**
- Provider: _____________
- Login URL: _____________

**Developer/IT Contact:**
- Name: _____________
- Email: _____________
- Phone: _____________

---

## ✅ **FINAL VERIFICATION**

Before going live, verify:

- [ ] All features working
- [ ] No console errors
- [ ] No PHP errors
- [ ] SSL certificate active
- [ ] Backups configured
- [ ] Admin access working
- [ ] Email notifications working (if configured)
- [ ] Payment gateway working (if configured)
- [ ] Mobile responsive
- [ ] Cross-browser tested

---

## 🎉 **GO LIVE!**

- [ ] Announce to users
- [ ] Provide login instructions
- [ ] Offer training sessions
- [ ] Monitor for issues
- [ ] Collect feedback
- [ ] Plan improvements

---

## 📅 **MAINTENANCE SCHEDULE**

### **Daily:**
- [ ] Check error logs
- [ ] Monitor system performance

### **Weekly:**
- [ ] Review user feedback
- [ ] Check disk space
- [ ] Verify backups

### **Monthly:**
- [ ] Update system if needed
- [ ] Optimize database
- [ ] Review security
- [ ] Test backup restoration

### **Quarterly:**
- [ ] Full system audit
- [ ] Performance review
- [ ] Security assessment
- [ ] User training refresh

---

## 🚨 **EMERGENCY CONTACTS**

**If something goes wrong:**

1. **Check error logs** in cPanel
2. **Contact hosting support** for server issues
3. **Restore from backup** if needed
4. **Contact developer** for code issues

**Emergency Backup:**
- Always keep a local copy
- Know how to restore database
- Have hosting support number ready

---

## 📊 **DEPLOYMENT STATUS**

**Date Deployed:** _______________  
**Deployed By:** _______________  
**Version:** 1.0  
**Status:** ⬜ Testing | ⬜ Staging | ⬜ Production

**Sign-off:**
- [ ] Technical Lead
- [ ] System Administrator
- [ ] School Administrator

---

**DEPLOYMENT CHECKLIST COMPLETE!** ✅

*Keep this checklist for future reference and updates*

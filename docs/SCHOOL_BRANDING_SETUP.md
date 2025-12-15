# 🎨 School Branding Setup Guide

## ✅ **What's Been Implemented**

All authentication pages now dynamically display:
- ✅ **School Logo** - Displayed at the top of login/register/forgot password forms
- ✅ **School Name** - Replaces "McSMS Pro" everywhere
- ✅ **School Tagline** - Replaces "School Management System"
- ✅ **Dynamic Footer** - Shows school name in copyright

---

## 🎯 **Where It Appears**

### **Login Page** (`/login`)
- 60% side: "Welcome to [School Name]"
- 40% side: School logo above the form
- Footer: © 2025 [School Name]

### **Register Page** (`/register`)
- 60% side: "Join [School Name]"
- 40% side: School logo above the form
- Footer: © 2025 [School Name]

### **Forgot Password** (`/forgot-password`)
- 60% side: "[School Name] - Password Reset"
- 40% side: School logo above the form
- Footer: © 2025 [School Name]

---

## 🔧 **How to Update School Settings**

### **Method 1: Via Admin Settings Page**

1. Login as admin
2. Go to **Settings** page
3. Update:
   - School Name
   - School Tagline
   - School Logo (upload image)
   - School Address
   - School Phone
   - School Email

### **Method 2: Via Database (Quick Setup)**

```sql
-- Update school name
UPDATE system_settings 
SET setting_value = 'Your School Name' 
WHERE setting_key = 'school_name';

-- Update tagline
UPDATE system_settings 
SET setting_value = 'Your School Tagline' 
WHERE setting_key = 'school_tagline';

-- Update logo (use full URL or relative path)
UPDATE system_settings 
SET setting_value = 'http://localhost/McSMS/uploads/logo.png' 
WHERE setting_key = 'school_logo';

-- Update contact info
UPDATE system_settings 
SET setting_value = 'Your Address' 
WHERE setting_key = 'school_address';

UPDATE system_settings 
SET setting_value = '+233 XX XXX XXXX' 
WHERE setting_key = 'school_phone';

UPDATE system_settings 
SET setting_value = 'info@yourschool.edu.gh' 
WHERE setting_key = 'school_email';
```

---

## 📤 **How to Upload School Logo**

### **Option 1: Direct File Upload**

1. Place your logo in: `d:\xampp\htdocs\McSMS\public\uploads\`
2. Name it: `school-logo.png` (or .jpg, .svg)
3. Update database:
```sql
UPDATE system_settings 
SET setting_value = '/uploads/school-logo.png' 
WHERE setting_key = 'school_logo';
```

### **Option 2: Via Settings Page**

1. Go to Admin → Settings
2. Click "Upload Logo"
3. Select your image file
4. Save settings

### **Logo Requirements:**
- **Format:** PNG, JPG, or SVG
- **Size:** Max 2MB
- **Dimensions:** Recommended 200x200px (square) or 400x100px (wide)
- **Background:** Transparent PNG recommended

---

## 🎨 **Logo Display Behavior**

- **If logo exists:** Shows the uploaded logo image
- **If logo missing:** Shows gradient icon with graduation cap
- **If logo fails to load:** Automatically falls back to gradient icon

---

## 🔄 **How It Works**

### **Backend API:**
```
GET http://localhost/McSMS/backend/api/public_settings.php
```

Returns:
```json
{
  "success": true,
  "settings": {
    "school_name": "Your School Name",
    "school_logo": "/uploads/school-logo.png",
    "school_tagline": "Your Tagline",
    "school_address": "Your Address",
    "school_phone": "+233 XX XXX XXXX",
    "school_email": "info@school.edu.gh"
  }
}
```

### **Frontend Hook:**
```javascript
import { useSchoolSettings } from '../../hooks/useSchoolSettings';

const { settings, loading } = useSchoolSettings();

// Use settings
<h1>{settings.school_name}</h1>
<img src={settings.school_logo} alt={settings.school_name} />
```

---

## 📋 **Current Default Settings**

```
School Name: McSMS Pro
Tagline: School Management System
Logo: None (shows gradient icon)
Address: Accra, Ghana
Phone: +233 XX XXX XXXX
Email: info@school.edu.gh
```

---

## 🎯 **Quick Start Example**

To set up "St. Mary's International School":

```sql
-- Run this in phpMyAdmin
UPDATE system_settings SET setting_value = 'St. Mary''s International School' WHERE setting_key = 'school_name';
UPDATE system_settings SET setting_value = 'Excellence in Education' WHERE setting_key = 'school_tagline';
UPDATE system_settings SET setting_value = 'Accra, Ghana' WHERE setting_key = 'school_address';
UPDATE system_settings SET setting_value = '+233 302 123 456' WHERE setting_key = 'school_phone';
UPDATE system_settings SET setting_value = 'info@stmarys.edu.gh' WHERE setting_key = 'school_email';
```

Then upload logo to `/public/uploads/school-logo.png` and:

```sql
UPDATE system_settings SET setting_value = '/uploads/school-logo.png' WHERE setting_key = 'school_logo';
```

**Refresh the login page** - You'll see:
- "Welcome to St. Mary's International School"
- Your school logo
- "Excellence in Education"
- © 2025 St. Mary's International School

---

## 🔍 **Testing**

1. **Update settings** (via SQL or Settings page)
2. **Refresh browser** (Ctrl + F5)
3. **Check pages:**
   - http://localhost:5174/login
   - http://localhost:5174/register
   - http://localhost:5174/forgot-password

All should show your school branding!

---

## 📁 **Files Created/Modified**

### **New Files:**
- `backend/api/public_settings.php` - Public API for school settings
- `frontend/src/hooks/useSchoolSettings.js` - React hook to fetch settings
- `database/migrations/add_default_school_settings.sql` - Default settings

### **Modified Files:**
- `frontend/src/pages/auth/Login.jsx` - Dynamic branding
- `frontend/src/pages/auth/Register.jsx` - Dynamic branding
- `frontend/src/pages/auth/ForgotPassword.jsx` - Dynamic branding

---

## ✨ **Features**

- ✅ Real-time updates (no code changes needed)
- ✅ Automatic fallback if logo missing
- ✅ Responsive design (works on mobile)
- ✅ No authentication required for public pages
- ✅ Cached for performance
- ✅ Error handling built-in

---

## 🎉 **Result**

Your school's branding now appears throughout the authentication flow, making the system truly yours! 🚀

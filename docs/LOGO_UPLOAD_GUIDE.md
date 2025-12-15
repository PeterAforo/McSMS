# 🎨 School Logo Upload Guide

## ✅ **Where to Upload Your School Logo**

### **Step-by-Step Instructions:**

1. **Login as Admin**
   - Go to: `http://localhost:5174/login`
   - Login with admin credentials

2. **Navigate to Settings**
   - Click **"Settings"** in the sidebar
   - You'll be on the **"General"** tab by default

3. **Upload Logo**
   - Look for the **"School Logo"** section at the top
   - Click the **"Upload Logo"** button
   - Select your logo file (PNG, JPG, GIF, or SVG)
   - Wait for upload to complete
   - You'll see a success message

4. **Save Settings**
   - Click **"Save Changes"** button at the top right
   - Your logo is now saved!

5. **View Your Logo**
   - Logout or open an incognito window
   - Go to: `http://localhost:5174/login`
   - You'll see your school logo on the login page!

---

## 📋 **Logo Requirements**

| Requirement | Details |
|------------|---------|
| **Format** | PNG, JPG, GIF, or SVG |
| **Size** | Maximum 2MB |
| **Dimensions** | Recommended: 200x200px (square) or 400x100px (wide) |
| **Background** | Transparent PNG recommended for best results |

---

## 🎯 **Where Your Logo Appears**

Once uploaded, your logo will automatically appear on:

✅ **Login Page** - Above the login form  
✅ **Register Page** - Above the registration form  
✅ **Forgot Password Page** - Above the reset form  
✅ **Mobile View** - On all auth pages  

---

## 🔄 **How to Change/Update Logo**

1. Go to **Settings** → **General** tab
2. Click **"Upload Logo"** again
3. Select new logo file
4. Click **"Save Changes"**
5. Old logo is automatically replaced

---

## ❌ **How to Remove Logo**

1. Go to **Settings** → **General** tab
2. Click **"Remove Logo"** button
3. Click **"Save Changes"**
4. System will show default graduation cap icon

---

## 🖼️ **Logo Display Behavior**

### **If Logo Exists:**
- Shows your uploaded logo image
- Maintains aspect ratio
- Maximum height: 80px (5rem)

### **If No Logo:**
- Shows gradient icon with graduation cap
- Matches page theme color
- Professional fallback design

### **If Logo Fails to Load:**
- Automatically falls back to gradient icon
- No broken image shown
- Seamless user experience

---

## 💡 **Tips for Best Results**

1. **Use High Quality Images**
   - Upload at least 200x200px
   - Use PNG for transparency
   - Avoid low-resolution images

2. **Test Different Sizes**
   - Square logos work best (200x200px)
   - Wide logos also supported (400x100px)
   - Logo auto-scales to fit

3. **Consider Background**
   - Transparent PNG recommended
   - White backgrounds work on login pages
   - Avoid complex backgrounds

4. **File Size**
   - Optimize images before upload
   - Keep under 500KB for fast loading
   - Use online tools like TinyPNG

---

## 📁 **File Storage Location**

Uploaded logos are stored in:
```
d:\xampp\htdocs\McSMS\public\uploads\
```

Filename format:
```
school-logo-[timestamp].png
```

Example:
```
school-logo-1701648000.png
```

---

## 🔧 **Troubleshooting**

### **Upload Button Not Working?**
- Check file size (must be under 2MB)
- Verify file format (PNG, JPG, GIF, SVG only)
- Try a different browser

### **Logo Not Showing After Upload?**
- Click "Save Changes" button
- Clear browser cache (Ctrl + F5)
- Check if file uploaded to `/public/uploads/`

### **Logo Appears Distorted?**
- Use square or wide format
- Maintain aspect ratio
- Upload higher resolution

### **Upload Fails?**
- Check folder permissions on `/public/uploads/`
- Verify file size is under 2MB
- Try different image format

---

## 🎨 **Example School Setup**

### **St. Mary's International School**

1. **Prepare Logo:**
   - Create 200x200px PNG with transparent background
   - Save as `stmarys-logo.png`

2. **Upload:**
   - Login → Settings → General
   - Upload `stmarys-logo.png`
   - Save Changes

3. **Update Info:**
   - School Name: `St. Mary's International School`
   - Tagline: `Excellence in Education`
   - Save Changes

4. **Result:**
   - Login page shows St. Mary's logo
   - "Welcome to St. Mary's International School"
   - Professional branded experience

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify file meets requirements
3. Try uploading a different image
4. Check browser console for errors

---

## ✨ **Quick Reference**

| Action | Location |
|--------|----------|
| **Upload Logo** | Settings → General → Upload Logo button |
| **Change Logo** | Settings → General → Upload new file |
| **Remove Logo** | Settings → General → Remove Logo button |
| **View Logo** | Login/Register/Forgot Password pages |
| **File Location** | `/public/uploads/school-logo-*.png` |

---

**Your school logo makes the system uniquely yours!** 🎉

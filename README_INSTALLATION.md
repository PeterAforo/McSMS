# 🎯 Quick Start - McSMS Pro Installation

## ⚡ **3-Step Installation**

### **Step 1: Install Database Tables**

Open phpMyAdmin (`http://localhost/phpmyadmin`), select your database, then:

**Import this file:**
```
d:\xampp\htdocs\McSMS\INSTALL_PRO_FEATURES.sql
```

✅ This installs all 100+ Pro feature tables in one click!

---

### **Step 2: Start the Frontend**

```bash
cd d:\xampp\htdocs\McSMS\frontend
npm install  # Only needed first time
npm run dev
```

---

### **Step 3: Login & Explore**

1. Open: `http://localhost:5173/login`
2. Login with:
   - **Email:** `admin@school.com`
   - **Password:** `password`
3. Look for menu items with **purple "Pro" badges**

---

## 🎊 **That's It!**

You now have access to all Pro features:

- 📅 **Timetable** - Smart scheduling
- 📝 **Exams** - Auto-grading
- 🎓 **LMS** - Online learning
- 📊 **Analytics** - AI insights
- 🚌 **Transport** - GPS tracking
- 💼 **HR & Payroll** - Automated payroll
- 👆 **Biometric** - Access control
- 🏢 **Multi-School** - Branch management
- 🤖 **AI Features** - Chatbot & predictions

---

## 📚 **Full Documentation**

- **Detailed Guide:** `INSTALLATION_GUIDE.md`
- **API Docs:** `docs/API_DOCUMENTATION.md`
- **Deployment:** `docs/COMPLETE_DEPLOYMENT_GUIDE.md`
- **Features:** `docs/100_PERCENT_COMPLETION_REPORT.md`

---

## 🆘 **Need Help?**

**Common Issues:**

1. **Tables not installing?**
   - Make sure MySQL is running
   - Check file path uses forward slashes: `d:/xampp/...`

2. **Frontend not starting?**
   - Run `npm install` first
   - Make sure port 5173 is available

3. **Can't login?**
   - Use: `admin@school.com` / `password`
   - Make sure backend is accessible at `http://localhost/McSMS/backend/api`

---

**🚀 Enjoy your complete McSMS Pro system!**

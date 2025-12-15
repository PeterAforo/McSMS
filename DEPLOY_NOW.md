# 🚀 McSMS Production Deployment

## Files Ready for Upload

### Frontend (upload to public_html root)
Location: `frontend/dist/`

Upload these files/folders to `public_html/`:
```
├── assets/
│   ├── index-hpYQV9_Z.js
│   ├── index-yze6j8-Q.css
│   ├── index.es-BIjaYCiI.js
│   └── purify.es-C65SP4u9.js
├── icons/           (create and add PWA icons)
├── .htaccess
├── index.html
├── manifest.json
├── offline.html
├── sw.js
└── vite.svg
```

### Backend (upload to public_html/backend)
Location: `backend/`

Upload entire `backend/` folder to `public_html/backend/`

### Config (upload to public_html/config)
Location: `config/`

Upload entire `config/` folder to `public_html/config/`

---

## Quick Deploy Steps

### 1. Upload Frontend
1. Open cPanel File Manager
2. Navigate to `public_html`
3. Upload all files from `frontend/dist/`

### 2. Upload Backend
1. Upload `backend/` folder to `public_html/`
2. Ensure `backend/api/` is accessible

### 3. Upload Config
1. Upload `config/` folder to `public_html/`
2. Update `config/database.php` with production credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');
```

### 4. Create Icons Folder
1. Create `public_html/icons/` folder
2. Upload PWA icons (generate at https://realfavicongenerator.net/)

### 5. Test
- Visit https://eea.mcaforo.com
- Login with your credentials
- Test dark mode, chatbot, voice search

---

## New Features Available

| Feature | Location |
|---------|----------|
| 🌙 Dark Mode | Sun/Moon icon in top nav |
| 🤖 AI Chatbot | Floating button bottom-right |
| 🎤 Voice Search | Microphone icon in search bar |
| 📱 PWA Install | Browser install prompt |
| 📊 Export | Export button on data pages |
| 📝 Templates | Templates button in messaging |

---

## Production URL
**https://eea.mcaforo.com**

## API URL
**https://eea.mcaforo.com/backend/api/**

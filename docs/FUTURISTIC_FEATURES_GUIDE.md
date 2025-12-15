# McSMS Futuristic Features Guide

This document provides comprehensive documentation for all 10 futuristic features implemented in McSMS.

---

## Table of Contents

1. [PWA Support](#1-pwa-support)
2. [Push Notifications](#2-push-notifications)
3. [AI Chatbot](#3-ai-chatbot)
4. [QR Code Features](#4-qr-code-features)
5. [Dark Mode](#5-dark-mode)
6. [Voice Search](#6-voice-search)
7. [Bulk SMS/WhatsApp Templates](#7-bulk-smswhatsapp-templates)
8. [Dashboard Widgets](#8-dashboard-widgets)
9. [Export to Google Sheets](#9-export-to-google-sheets)
10. [Parent Portal Improvements](#10-parent-portal-improvements)

---

## 1. PWA Support

### Overview
McSMS is now a Progressive Web App (PWA) that can be installed on mobile devices and desktops, works offline, and provides a native app-like experience.

### Files
- `frontend/public/manifest.json` - App manifest
- `frontend/public/sw.js` - Service worker
- `frontend/public/offline.html` - Offline fallback page
- `frontend/index.html` - PWA meta tags

### Features
- **Installable**: Users can install the app on their home screen
- **Offline Support**: Core pages work without internet
- **Background Sync**: Attendance and messages sync when back online
- **Push Notifications**: Receive notifications even when app is closed

### How to Install
1. Open McSMS in Chrome/Edge/Safari
2. Click the install icon in the address bar (or menu → "Install App")
3. The app will be added to your home screen/desktop

### Customizing Icons
Replace the placeholder icons in `frontend/public/icons/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

---

## 2. Push Notifications

### Overview
Real-time push notifications for important events like fee reminders, attendance alerts, and new messages.

### Files
- `frontend/src/services/pushNotifications.js` - Client-side service
- `backend/api/push_subscriptions.php` - Server-side API

### Usage

```javascript
import { usePushNotifications } from '../services/pushNotifications';

function MyComponent() {
  const { isSupported, isSubscribed, subscribe, unsubscribe, showNotification } = usePushNotifications(userId);

  // Subscribe to notifications
  const handleSubscribe = async () => {
    await subscribe();
  };

  // Show a local notification
  const handleNotify = () => {
    showNotification('New Message', {
      body: 'You have a new message from the school',
      url: '/messages'
    });
  };
}
```

### Production Setup
1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Update `VAPID_PUBLIC_KEY` in `pushNotifications.js`
3. Update `vapidPrivateKey` in `push_subscriptions.php`
4. Install `web-push-php` library for server-side notifications

---

## 3. AI Chatbot

### Overview
An intelligent FAQ chatbot that helps users find information about fees, attendance, results, homework, and more.

### Files
- `frontend/src/components/shared/AIChatbot.jsx` - React component
- `backend/api/chatbot.php` - Backend API

### Features
- Pre-built FAQ responses for common questions
- Quick action buttons for frequent queries
- Text-to-speech support
- Chat history logging for analytics
- Contextual responses based on user data

### Customizing Responses
Edit the `FAQ_DATABASE` in both files to add/modify responses:

```javascript
// In AIChatbot.jsx
const FAQ_DATABASE = {
  'custom_topic': {
    keywords: ['keyword1', 'keyword2'],
    responses: [
      "Response 1",
      "Response 2"
    ]
  }
};
```

### Adding AI Integration
To integrate with OpenAI or similar:

```javascript
// In handleSend function
const apiResponse = await axios.post(`${API_BASE_URL}/chatbot.php`, {
  query: input,
  use_ai: true, // Enable AI mode
  user_id: user?.id
});
```

---

## 4. QR Code Features

### Overview
Generate and scan QR codes for student IDs, attendance tracking, and payments.

### Files
- `frontend/src/components/shared/QRCodeFeatures.jsx`

### Components

#### QRCodeGenerator
```jsx
import { QRCodeGenerator } from '../../components/shared/QRCodeFeatures';

<QRCodeGenerator 
  data="https://school.com/student/123" 
  size={200}
  title="Student QR"
  subtitle="Scan to view profile"
/>
```

#### StudentIDCard
```jsx
import { StudentIDCard } from '../../components/shared/QRCodeFeatures';

<StudentIDCard 
  student={{
    id: 1,
    student_id: 'STU2024001',
    first_name: 'John',
    last_name: 'Mensah',
    class_name: 'Class 6A',
    date_of_birth: '2010-05-15',
    photo: '/uploads/students/john.jpg'
  }}
  schoolName="Greenfield Academy"
  schoolLogo="/uploads/logo.png"
/>
```

#### QRAttendance
```jsx
import { QRAttendance } from '../../components/shared/QRCodeFeatures';

<QRAttendance 
  classId={1}
  className="Class 6A"
  onMarkAttendance={(student) => console.log('Marked:', student)}
/>
```

#### PaymentQRCode
```jsx
import { PaymentQRCode } from '../../components/shared/QRCodeFeatures';

<PaymentQRCode 
  invoice={{ id: 123 }}
  amount={500}
  reference="INV-2024-001"
/>
```

### Production QR Scanning
For production, install a QR scanning library:
```bash
npm install @zxing/library
```

---

## 5. Dark Mode

### Overview
A complete theming system with light, dark, and system-preference modes.

### Files
- `frontend/src/store/themeStore.js` - Zustand store
- `frontend/src/components/shared/ThemeToggle.jsx` - Toggle component
- `frontend/tailwind.config.js` - Dark mode enabled

### Usage

#### Theme Toggle (Simple)
```jsx
import ThemeToggle from '../../components/shared/ThemeToggle';

<ThemeToggle variant="simple" /> // Sun/Moon toggle
<ThemeToggle variant="icon" />   // Dropdown with options
<ThemeToggle showLabel />        // With text label
```

#### Theme Settings Panel
```jsx
import { ThemeSettings } from '../../components/shared/ThemeToggle';

<ThemeSettings /> // Full settings panel with font size, accessibility
```

#### Using Theme in Components
```jsx
import { useThemeStore } from '../../store/themeStore';

function MyComponent() {
  const { theme, actualTheme, setTheme } = useThemeStore();
  
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      Current theme: {actualTheme}
    </div>
  );
}
```

### Adding Dark Mode to Components
Use Tailwind's `dark:` prefix:
```jsx
<div className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-white">Hello</p>
  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
    Click me
  </button>
</div>
```

---

## 6. Voice Search

### Overview
Speech-to-text search functionality using the Web Speech API.

### Files
- `frontend/src/components/shared/VoiceSearch.jsx`

### Usage

#### Voice Search Button
```jsx
import { VoiceSearchButton } from '../../components/shared/VoiceSearch';

<VoiceSearchButton 
  onResult={(text) => {
    console.log('User said:', text);
    performSearch(text);
  }} 
/>
```

#### Full Voice Search Modal
```jsx
import VoiceSearch from '../../components/shared/VoiceSearch';

const [showVoice, setShowVoice] = useState(false);

<VoiceSearch 
  isOpen={showVoice}
  onClose={() => setShowVoice(false)}
  onResult={(text) => {
    performSearch(text);
    setShowVoice(false);
  }}
/>
```

### Browser Support
- Chrome: Full support
- Edge: Full support
- Safari: Partial support
- Firefox: Not supported (gracefully hidden)

---

## 7. Bulk SMS/WhatsApp Templates

### Overview
Pre-built message templates for common school communications.

### Files
- `frontend/src/components/shared/MessageTemplates.jsx`

### Template Categories
- **SMS**: Fee reminder, absence notification, exam reminder, event invitation, payment confirmation, school closure, report card ready, bus delay
- **WhatsApp**: Welcome message, fee invoice, homework assignment, exam results, parent meeting, daily attendance
- **Email**: Newsletter, academic report

### Usage

#### Template Selector
```jsx
import { TemplateSelector } from '../../components/shared/MessageTemplates';

<TemplateSelector 
  type="sms" // or "whatsapp" or "email"
  onSelect={(template) => {
    console.log('Selected:', template);
    setMessage(template.message);
  }}
/>
```

#### Full Template Manager
```jsx
import MessageTemplates from '../../components/shared/MessageTemplates';

<MessageTemplates 
  type="whatsapp"
  onSelect={handleTemplateSelect}
  onClose={() => setShowTemplates(false)}
/>
```

#### Variable Replacement
```jsx
import { replaceVariables } from '../../components/shared/MessageTemplates';

const template = "Dear {parent_name}, {student_name}'s fee of GHS {amount} is due.";
const data = {
  parent_name: 'Mr. Mensah',
  student_name: 'John',
  amount: '500'
};

const message = replaceVariables(template, data);
// "Dear Mr. Mensah, John's fee of GHS 500 is due."
```

### Adding Custom Templates
```jsx
import { DEFAULT_TEMPLATES } from '../../components/shared/MessageTemplates';

// Add to existing templates
DEFAULT_TEMPLATES.sms.push({
  id: 'sms-custom',
  name: 'Custom Template',
  category: 'Custom',
  message: 'Your custom message with {variable}',
  variables: ['variable']
});
```

---

## 8. Dashboard Widgets

### Overview
Customizable dashboard with drag-and-drop widgets.

### Files
- `frontend/src/components/shared/DashboardWidgets.jsx`
- `frontend/src/store/themeStore.js` (widget preferences)

### Available Widgets
- Quick Stats
- Calendar
- Notifications
- Attendance Chart
- Finance Overview
- Recent Activity
- Quick Actions
- Weather
- Performance
- Today's Schedule
- Pending Homework
- Recent Messages

### Usage

#### Customize Button
```jsx
import { DashboardCustomizeButton } from '../../components/shared/DashboardWidgets';

<DashboardCustomizeButton />
```

#### Widget Container
```jsx
import { WidgetContainer } from '../../components/shared/DashboardWidgets';
import { BarChart3 } from 'lucide-react';

<WidgetContainer 
  title="Statistics"
  icon={BarChart3}
  onRefresh={() => fetchData()}
  loading={isLoading}
>
  <YourWidgetContent />
</WidgetContainer>
```

#### Reading Widget Preferences
```jsx
import { useThemeStore } from '../../store/themeStore';

function Dashboard() {
  const { dashboardWidgets } = useThemeStore();
  
  const enabledWidgets = dashboardWidgets
    .filter(w => w.enabled)
    .sort((a, b) => a.order - b.order);
  
  return enabledWidgets.map(widget => (
    <WidgetComponent key={widget.id} type={widget.id} />
  ));
}
```

---

## 9. Export to Google Sheets

### Overview
Export data to various formats including CSV, Excel, JSON, and Google Sheets.

### Files
- `frontend/src/services/exportService.js`

### Usage

#### Export Button (Recommended)
```jsx
import { ExportButton } from '../../services/exportService';

<ExportButton 
  data={students}
  filename="students-list"
  headers={['id', 'name', 'class', 'email']} // Optional
/>
```

#### Individual Export Functions
```jsx
import { 
  exportToCSV, 
  exportToExcel, 
  exportToGoogleSheets,
  exportToJSON,
  printTable 
} from '../../services/exportService';

// CSV
exportToCSV(data, 'filename');

// Excel
exportToExcel(data, 'filename', 'Sheet1');

// Google Sheets (copies to clipboard + opens Sheets)
await exportToGoogleSheets(data, 'My Spreadsheet');

// JSON
exportToJSON(data, 'filename');

// Print
printTable(data, 'Report Title');
```

### Google Sheets API Integration
For direct API integration (requires OAuth):
```jsx
import { exportToGoogleSheetsAPI } from '../../services/exportService';

// User must be authenticated with Google
const spreadsheetId = await exportToGoogleSheetsAPI(data, 'Title', accessToken);
```

---

## 10. Parent Portal Improvements

### Overview
Enhanced mobile responsiveness and accessibility across the parent portal.

### Improvements Made
- Dark mode support on all pages
- Voice search in navigation
- AI Chatbot available on all pages
- Responsive Topbar with mobile menu
- Touch-friendly UI elements
- Accessibility settings (font size, reduced motion, high contrast)

### Mobile Responsiveness Tips
```jsx
// Use responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="md:hidden">Mobile only</div>

// Responsive text
<h1 className="text-xl md:text-2xl lg:text-3xl">Title</h1>
```

---

## Production Deployment

### Build for Production
```bash
cd frontend
npm run build
```

### Deploy to cPanel
1. Upload `dist/` contents to `public_html/`
2. Upload `backend/` to `public_html/backend/`
3. Upload `config/` to `public_html/config/`
4. Update `frontend/src/config.js` with production URL
5. Ensure `.htaccess` files are in place

### PWA Icons
Generate icons using: https://realfavicongenerator.net/
Place in `frontend/public/icons/`

### VAPID Keys for Push Notifications
```bash
npx web-push generate-vapid-keys
```

---

## Troubleshooting

### Dark Mode Not Working
- Ensure `darkMode: 'class'` is in `tailwind.config.js`
- Check that `useThemeStore` is imported and `applyTheme()` is called on app load

### Voice Search Not Available
- Only works in Chrome/Edge
- Requires HTTPS in production
- Check browser permissions for microphone

### PWA Not Installing
- Must be served over HTTPS
- Check `manifest.json` is accessible
- Verify service worker is registered

### Push Notifications Not Working
- Requires HTTPS
- Check browser notification permissions
- Verify VAPID keys are configured

---

## Support

For issues or feature requests, contact the development team or create an issue in the project repository.

# McSMS Mobile App

React Native mobile application for McSMS School Management System.

## Features

- **Dashboard** - Overview of student stats, attendance, grades
- **Messages** - Communication with teachers and staff
- **Attendance** - View attendance records and history
- **Notifications** - Push notifications for important updates
- **Profile** - User profile management

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation
- Zustand (state management)
- Expo SecureStore (secure storage)
- Expo Local Authentication (biometric login)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd mobile
npm install
```

### Running the App

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry point
├── src/
│   ├── screens/           # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── MessagesScreen.tsx
│   │   ├── AttendanceScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── NotificationsScreen.tsx
│   ├── store/             # Zustand stores
│   │   └── authStore.ts
│   └── services/          # API services
│       └── api.ts
└── package.json
```

## API Configuration

The app connects to the McSMS backend API. Update the API URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'https://your-domain.com/backend/api';
```

## Building for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

## Features Roadmap

- [x] Authentication (login/logout)
- [x] Dashboard with stats
- [x] Messages list
- [x] Attendance view
- [x] Notifications
- [x] Profile management
- [ ] Biometric login
- [ ] Push notifications
- [ ] Offline mode
- [ ] Dark mode

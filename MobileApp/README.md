# Kanthast Android App

React Native (Expo) Android app for Kanthast — Visual Medical Education.

## Setup

```bash
cd MobileApp
npm install
```

### Assets required
Place these files in `assets/` before building:
- `icon.png` — 1024×1024 app icon
- `splash.png` — 1284×2778 splash screen image
- `adaptive-icon.png` — 1024×1024 adaptive icon foreground

For quick dev testing you can copy `../Frontend/public/logo.png` as a temporary icon.

## Run

```bash
# Start Expo dev server
npm start

# Run on Android device / emulator
npm run android
```

## Build APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Features
- Dark navy UI matching the web app (`#0B1120` background, `#0ea5e9` cyan)
- Internet connectivity detection — animated "No internet connection" banner
- AsyncStorage caching (5-min TTL for course content, 30-min for profile)
- SecureStore for JWT tokens
- Bottom tab navigation (Home · Dashboard · Lists · AI Chat · Profile)
- All screens: Splash, Login, Signup (OTP), Dashboard, Courses, Lists, Video, Chatbot, Profile, Settings, Subscription

## Backend
Points to `https://kanthast-backend.onrender.com/api/v1`

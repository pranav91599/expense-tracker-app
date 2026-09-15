# Expense Tracker (React + Capacitor Android)

A modern, offline-first mobile expense tracker built with **React**, **Vite**, **Dexie (IndexedDB)**, and **Capacitor** for Android.

## Features
- 📊 **Visual Dashboard**: Income, expenses, total balance, and category breakdown.
- 📱 **Native Mobile Feel**:
  - Capacitor Status Bar dark theme integration.
  - Native Haptic Feedback on button clicks, tab switches, and transaction saves.
  - Android hardware back button navigation.
  - Notch & navigation bar safe-area insets.
- 💾 **Offline Storage**: Powered by Dexie.js (IndexedDB).

---

## Getting Started

### 1. Web Development
Run the local development server:
```bash
npm run dev
```

### 2. Build Web Assets
Compile the React bundle to `dist/`:
```bash
npm run build
```

### 3. Sync with Android
Sync the web assets and plugins to the native Android directory:
```bash
npx cap sync android
```
*(Or use `npm run cap:build` to build & sync in one step)*

### 4. Open in Android Studio
Open the native project directly in Android Studio:
```bash
npx cap open android
```
*(Or run `npm run cap:open`)*

### 5. Build Android APK
Compile the debug APK via Gradle:
```bash
npm run build:android
cd android
./gradlew assembleDebug
```

The compiled APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Project Structure
- `src/` - React frontend application & Dexie database setup
- `android/` - Capacitor Android native project & Gradle wrapper
- `capacitor.config.json` - Capacitor configuration (App ID, native styles, plugins)

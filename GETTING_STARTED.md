# Getting Started with Flutter TODO App

## Quick Start Guide

Welcome! This guide will help you get the Flutter TODO app running on your machine.

## Step 1: Install Flutter

If you haven't installed Flutter yet:

1. Visit: https://flutter.dev/docs/get-started/install
2. Download Flutter SDK for your OS
3. Extract to a location (e.g., `C:\src\flutter` on Windows, `/usr/local/flutter` on Mac/Linux)
4. Add Flutter to your PATH

### Verify Installation

Open a terminal and run:

```bash
flutter --version
flutter doctor
```

The `flutter doctor` command will show what needs to be configured (Android Studio, Xcode, etc.).

## Step 2: Clone/Navigate to Project

If you're already in the project directory, skip this step. Otherwise:

```bash
cd todoandroidapp
```

## Step 3: Get Dependencies

```bash
flutter pub get
```

This downloads all required packages (Riverpod, go_router, shared_preferences, etc.).

## Step 4: Generate Localization Files

```bash
flutter gen-l10n
```

This generates `lib/generated/l10n/app_localizations.dart` from the ARB files.

**Note**: The current app_localizations.dart is a placeholder. This step replaces it with the real generated code.

## Step 5: Run the App

### Option A: Web (Easiest, No Emulator Needed)

```bash
flutter run -d chrome
```

The app will open in Chrome. Press `r` to hot reload, `R` for hot restart.

### Option B: Android

```bash
flutter run -d android
```

Requires:
- Android Studio installed
- An emulator running OR a physical device connected

### Option C: iOS (Mac Only)

```bash
flutter run -d ios
```

Requires:
- macOS with Xcode
- iOS Simulator OR physical device

## That's It! 🎉

The app should now be running. You can:
- Add tasks
- Edit tasks
- Delete tasks
- Filter (All/Active/Completed)
- Search
- Change theme
- Change language
- Export/Import JSON

## Troubleshooting

### "flutter: command not found"

Flutter is not in your PATH. Add the `bin` directory to your system PATH:
- Windows: Add `C:\src\flutter\bin` to PATH in System Settings
- Mac/Linux: Add to `~/.bashrc` or `~/.zshrc`:
  ```bash
  export PATH="$PATH:/path/to/flutter/bin"
  ```

### "pub get failed"

Try these steps:
```bash
flutter clean
flutter pub get
```

### "Cannot find file app_localizations.dart"

Run:
```bash
flutter gen-l10n
```

### "No devices found"

- **Web**: Just run `flutter run -d chrome`
- **Android**: Start an emulator from Android Studio, or connect a device
- **iOS**: Start Simulator from Xcode or connect a device

### Build errors

Clear the build cache:
```bash
flutter clean
flutter pub get
flutter run
```

## Next Steps

### Run Tests

```bash
flutter test
```

### Analyze Code

```bash
flutter analyze
```

### Format Code

```bash
flutter format .
```

### Build for Production

**Web:**
```bash
flutter build web
# Deploy build/web folder to any host
```

**Android:**
```bash
flutter build apk --release
# Install app-release.apk on devices
```

**iOS:**
```bash
flutter build ipa --release
# Upload to App Store
```

## Need Help?

- Read `README.md` for full documentation
- Read `SETUP.md` for detailed setup instructions
- Read `PROJECT_SUMMARY.md` for architecture overview
- Flutter docs: https://flutter.dev/docs
- Riverpod docs: https://riverpod.dev

## Common Tasks

### Add a New Language

1. Create `l10n/app_XX.arb` (copy from app_en.arb)
2. Translate all strings
3. Run `flutter gen-l10n`
4. Update language selector in settings

### Change App Name

Edit `pubspec.yaml`:
```yaml
name: your_app_name
```

Also update `lib/app.dart` title property.

### Add App Icons

1. Create icons (192x192 and 512x512 PNG)
2. Place in `web/icons/`
3. Update `web/manifest.json` if needed

## Development Tips

- **Hot Reload**: Press `r` in terminal to reload without restart
- **Hot Restart**: Press `R` to fully restart
- **Debug**: Press `d` to open DevTools
- **Quit**: Press `q` to quit

Enjoy building with Flutter! 🚀


# Flutter TODO App - Setup Instructions

## Quick Start

This project is a complete Flutter application but requires Flutter SDK to be installed and configured properly.

### Prerequisites Check

Before proceeding, ensure you have:
1. **Flutter SDK** installed (version 3.19 or higher)
2. **Dart** installed (version 3.3 or higher, comes with Flutter)
3. Flutter in your PATH environment variable

To verify installation:
```bash
flutter --version
flutter doctor
```

### Installation Steps

1. **Install Flutter** (if not installed):
   - Download from: https://flutter.dev/docs/get-started/install
   - Extract to a location (e.g., `C:\src\flutter` on Windows)
   - Add to PATH: Add `C:\src\flutter\bin` to your system PATH

2. **Install Dependencies**:
```bash
flutter pub get
```

3. **Generate Localization Files**:
```bash
flutter gen-l10n
```

This will generate proper `lib/generated/l10n/app_localizations.dart` from the ARB files.

4. **Run the App**:

Web (recommended for quick testing):
```bash
flutter run -d chrome
```

Android:
```bash
flutter run -d android
```

iOS (macOS only):
```bash
flutter run -d ios
```

5. **Run Tests**:
```bash
flutter test
```

6. **Analyze Code**:
```bash
flutter analyze
```

### Build for Production

**Web:**
```bash
flutter build web
```
Deploy the `build/web` folder to any static host.

**Android:**
```bash
flutter build apk --release
# or
flutter build appbundle --release
```

**iOS (macOS only):**
```bash
flutter build ipa --release
```

## Project Structure

```
lib/
├── main.dart                          # Entry point
├── app.dart                           # App configuration
├── core/                              # Core utilities
│   ├── theme/app_theme.dart          # Material 3 themes
│   └── utils/responsive.dart         # Screen utilities
├── features/                          # Feature modules
│   ├── todos/
│   │   ├── domain/todo.dart          # Todo model
│   │   ├── data/todo_repository.dart # Storage
│   │   └── presentation/
│   │       ├── widgets/              # UI components
│   │       └── pages/                # Screens
│   └── settings/
│       └── presentation/              # Settings screen
├── services/                          # Services
│   └── clipboard/json_clipboard.dart
├── routing/                           # Navigation
│   └── app_router.dart
├── state/                             # State management
│   ├── todos_provider.dart
│   └── settings_provider.dart
└── generated/                         # Generated code
    └── l10n/                          # Localization

l10n/                                  # Translation source files
├── app_en.arb
└── app_ru.arb

test/                                  # Tests
├── todo_repository_test.dart
├── todos_provider_test.dart
└── widget_todos_page_test.dart

web/                                   # Web configuration
├── index.html
└── manifest.json
```

## Important Notes

1. **Localization**: The `lib/generated/l10n/app_localizations.dart` file is currently a placeholder. After running `flutter gen-l10n`, it will be replaced with proper generated code.

2. **No Empty Directories**: Empty directories from the old React Native project may still exist (`app/`, `src/`, `public/`, `tests/`). These can be safely deleted or ignored.

3. **Icons**: The `web/manifest.json` references icon files that need to be added:
   - Create `web/icons/` directory
   - Add `icon-192.png` and `icon-512.png`
   - Or update manifest.json to point to your icons

4. **Flutter CLI**: All Flutter commands require the Flutter SDK to be installed and configured properly in your PATH.

## Troubleshooting

**"flutter command not found"**
- Install Flutter SDK
- Add Flutter bin directory to PATH
- Restart terminal/IDE

**"pub get failed"**
- Check internet connection
- Try: `flutter clean` then `flutter pub get`

**"l10n not found"**
- Run: `flutter gen-l10n`
- Check `l10n.yaml` exists
- Verify ARB files in `l10n/` directory

**Tests fail**
- Ensure dependencies installed: `flutter pub get`
- Run individual test: `flutter test test/todo_repository_test.dart`

## Next Steps

After setup:
1. Customize the app name in `pubspec.yaml`
2. Add app icons in `web/icons/`
3. Deploy to your preferred platform
4. Read `README.md` for detailed documentation


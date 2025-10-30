# Universal TODO App

A universal TODO application built with Flutter (Dart) that runs on iOS, Android, and Web (PWA) from a single codebase. Features include authentication, full CRUD operations, filtering, search, prioritization, theming, localization (English/Russian), and JSON import/export via clipboard.

## Features

- 🔐 **Authentication** - Register, login, password reset with PostgreSQL backend
- ✅ **Full CRUD operations** - Create, read, update, and delete tasks
- 🔍 **Search and filter** - Filter by All/Active/Completed, search by title or description
- 📅 **Due dates and priorities** - Set due dates with overdue indicators, prioritize tasks (Low/Medium/High)
- 🌙 **Theme support** - Light, Dark, and System theme modes with persistence
- 🌐 **Internationalization** - English and Russian localization with system language detection
- 💾 **Database persistence** - Tasks saved to PostgreSQL with user isolation
- 📤 **Import/Export** - Copy tasks as JSON to clipboard for backup or transfer
- 📱 **Responsive design** - Adaptive layout for mobile (≤600px) and desktop (>600px)
- ♿ **Accessibility** - Keyboard navigation, ARIA labels, semantic widgets
- 🧪 **Comprehensive tests** - Unit tests for repository and providers, widget tests
- 🎨 **Material 3** - Modern Material Design 3 UI components
- 🚀 **Backend Server** - Dart/Shelf API server with PostgreSQL

## Tech Stack

### Frontend
- **Flutter** (Dart 3.3+) - Cross-platform framework
- **flutter_riverpod** - State management (reactive, testable, no singletons)
- **go_router** - Declarative routing with clean URLs for web and deep links for mobile
- **http** - HTTP client for API communication
- **flutter_localizations** - Built-in localization with gen-l10n
- **intl** - Date formatting and localization utilities
- **Material 3** - Modern design system

### Backend
- **Dart with Shelf** - HTTP web framework
- **PostgreSQL** - Relational database for users and todos
- **Bcrypt** - Password hashing and security
- **Mailer** - Email sending (Gmail support)
- **CORS** - Cross-origin resource sharing

## Prerequisites

- Flutter SDK 3.19 or higher
- Dart 3.3 or higher
- For iOS: macOS with Xcode
- For Android: Android Studio with Android SDK
- For Web: Any modern browser

## Quick Start

### Prerequisites

- Flutter SDK 3.19 or higher
- PostgreSQL 12+ installed and running
- Dart SDK 3.3+ (comes with Flutter)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd todoandroidapp
```

2. Set up PostgreSQL database:
```sql
CREATE DATABASE todo_db;
CREATE USER todo_user WITH PASSWORD 'todo_password';
GRANT ALL PRIVILEGES ON DATABASE todo_db TO todo_user;
```

3. Configure server:
```bash
cd server
cp .env.example .env
# Edit .env if needed
```

4. Start the backend server:
```bash
# Windows
start.bat

# Mac/Linux
chmod +x start.sh
./start.sh
```

5. Install Flutter dependencies:
```bash
cd ..  # back to root
flutter pub get
flutter gen-l10n
```

**📖 For detailed setup instructions, see [AUTH_GUIDE.md](AUTH_GUIDE.md) or [QUICK_START.md](QUICK_START.md)**

### Development

#### Web
```bash
flutter run -d chrome
```

#### Android
```bash
flutter run -d android
```
(Requires Android emulator or connected device)

#### iOS
```bash
flutter run -d ios
```
(Requires macOS with Xcode and iOS Simulator)

## Building for Production

### Web Build (PWA)

Build static web bundle:
```bash
flutter build web
```

The output will be in `build/web/`. Deploy this folder to any static hosting service:

- **Vercel**: Drag `build/web` to Vercel dashboard
- **Netlify**: Configure build folder as `build/web`
- **GitHub Pages**: Upload contents of `build/web`
- **Firebase Hosting**: Run `firebase deploy`
- **Any CDN**: Upload `build/web` contents

The web build includes:
- Service worker for offline support
- PWA manifest for installable app
- Optimized production assets

### Android Build

**APK (for direct installation):**
```bash
flutter build apk --release
```
Output: `build/app/outputs/flutter-apk/app-release.apk`

**App Bundle (for Play Store):**
```bash
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`

### iOS Build

**IPA (for App Store or TestFlight):**
```bash
flutter build ipa --release
```
Requires:
- macOS with Xcode installed
- Valid Apple Developer account
- Properly configured signing certificates

Output: `build/ios/ipa/` directory

## Testing

Run all tests:
```bash
flutter test
```

Run tests in watch mode (for development):
```bash
flutter test --watch
```

Test coverage report:
```bash
flutter test --coverage
```

The project includes:
- **Repository tests** - CRUD operations, JSON serialization, corruption handling
- **Provider tests** - State management, filtering, search, sorting
- **Widget tests** - UI component rendering and interactions

## Code Quality

Run static analysis:
```bash
flutter analyze
```

Format code:
```bash
flutter format .
```

Auto-fix linter issues:
```bash
dart fix --apply
```

## Project Structure

```
lib/
├── main.dart                              # Application entry point
├── app.dart                               # MaterialApp configuration
├── core/
│   ├── theme/app_theme.dart              # Material 3 themes (light/dark)
│   └── utils/responsive.dart             # Screen size utilities
├── features/
│   ├── todos/
│   │   ├── domain/todo.dart              # Todo model and Priority enum
│   │   ├── data/todo_repository.dart     # Storage interface and implementation
│   │   └── presentation/
│   │       ├── widgets/                  # Reusable UI components
│   │       │   ├── task_item.dart
│   │       │   ├── task_editor.dart
│   │       │   ├── filters_bar.dart
│   │       │   ├── empty_state.dart
│   │       │   └── toolbar.dart
│   │       └── pages/
│   │           ├── todos_page.dart       # Main list view
│   │           └── todo_details_page.dart # Edit/create view
│   └── settings/
│       └── presentation/settings_page.dart # Theme, language, import/export
├── services/
│   └── clipboard/json_clipboard.dart     # JSON copy/paste service
├── routing/
│   └── app_router.dart                   # GoRouter configuration
└── state/
    ├── todos_provider.dart               # Riverpod providers for todos
    └── settings_provider.dart            # Theme and locale providers
l10n/
├── app_en.arb                            # English translations
├── app_ru.arb                            # Russian translations
└── l10n.yaml                             # Localization configuration
test/
├── todo_repository_test.dart
├── todos_provider_test.dart
└── widget_todos_page_test.dart
web/
├── index.html                            # PWA entry point
└── manifest.json                         # PWA manifest
```

## Architecture

### State Management

The app uses **Riverpod** for state management:

- **TodoRepository** - Data layer interface and SharedPreferences implementation
- **TodosNotifier** - StateNotifier for todo CRUD operations
- **SettingsNotifier** - Theme and locale state with persistence
- **Computed Providers** - Filtering, search, and sorting logic

### Navigation

**go_router** provides:
- Clean URLs for web (e.g., `/task/123`, `/settings`)
- Deep linking support for mobile
- Type-safe navigation with path parameters

### Data Persistence

- **shared_preferences** - All platforms use the same storage API
  - Web: Uses browser localStorage
  - Mobile: Uses native storage
- Tasks stored as JSON with debounced saves (300ms)
- Automatic recovery from corrupt data

### Responsive Design

Single codebase adapts to screen size:
- **≤600px (Mobile)**: Single column list with full-screen editor
- **>600px (Desktop)**: Optimized for larger screens

## PWA Installation (Web)

The web version can be installed as a Progressive Web App:

1. Open the app in a modern browser (Chrome, Edge, Safari, Firefox)
2. Click the install button in the address bar (or app menu)
3. Choose "Install" to add to home screen/desktop
4. The app works offline (first load required)

## Keyboard Shortcuts (Web)

- **Enter** - Submit form / Activate button
- **Escape** - Close dialog / Cancel action
- **Tab** - Navigate between fields
- **Space** - Toggle checkboxes

## Localization

Supported languages:
- English (en) - Default
- Russian (ru)

User can change language in Settings. System language is auto-detected on first launch.

### Adding a New Language

1. Create `l10n/app_XX.arb` with translations
2. Add locale to `pubspec.yaml` and `main.dart`
3. Run `flutter gen-l10n`

## Development Workflow

1. **Make changes** to Dart files
2. **Run `flutter analyze`** to check for errors
3. **Run `flutter test`** to ensure tests pass
4. **Test on target platform** with `flutter run`
5. **Format code** with `flutter format .`
6. **Commit changes**

## Deployment Checklist

### Web
- [ ] Run `flutter build web --release`
- [ ] Test PWA manifest and service worker
- [ ] Verify responsive behavior on mobile/desktop
- [ ] Upload `build/web` to hosting service

### Android
- [ ] Update version in `pubspec.yaml`
- [ ] Run `flutter build appbundle --release`
- [ ] Test on multiple Android devices
- [ ] Upload to Play Store Console

### iOS
- [ ] Update version and build number
- [ ] Configure signing certificates
- [ ] Run `flutter build ipa --release`
- [ ] Test on iOS devices
- [ ] Upload to App Store Connect

## Troubleshooting

### Web Build Issues
- Clear browser cache
- Run `flutter clean` then `flutter pub get`
- Check console for JavaScript errors

### Localization Not Working
- Run `flutter gen-l10n` to regenerate files
- Restart the app after generating
- Check `l10n.yaml` configuration

### Storage Issues
- Tasks persist locally, clearing app data removes them
- Export tasks before clearing data
- Check SharedPreferences permissions

### Tests Failing
- Run `flutter test --reporter expanded`
- Check for platform-specific test issues
- Ensure all dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and write tests
4. Run `flutter analyze` and `flutter test`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Credits

- Built with [Flutter](https://flutter.dev)
- UI components from [Material Design 3](https://m3.material.io)
- State management with [Riverpod](https://riverpod.dev)
- Routing with [go_router](https://pub.dev/packages/go_router)

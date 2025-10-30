# Universal TODO App

A production-ready universal TODO application built with Flutter (Dart) that runs on iOS, Android, and Web (PWA) from a single codebase.

## Features

- ✅ **Full CRUD operations** - Create, read, update, and delete tasks
- 🔐 **Authentication** - Register and log in through the bundled Dart server with secure token storage
- 🔍 **Search and filter** - Filter by All/Active/Completed, search by title or description
- 📅 **Due dates and priorities** - Set due dates with overdue indicators, prioritize tasks (Low/Medium/High)
- 🌙 **Theme support** - Light, Dark, and System theme modes with persistence
- 🌐 **Internationalization** - English and Russian localization with system language detection
- 💾 **Local database** - Tasks saved to local SQLite database using Drift
- ☁️ **API backend** - Shelf-based Dart server with SQLite authentication storage
- 📤 **Import/Export** - Share tasks as JSON for backup or transfer
- 📱 **Responsive design** - Adaptive layout optimized for all screen sizes
- ♿ **Accessibility** - Full keyboard navigation and semantic widgets
- 🎨 **Material 3** - Modern Material Design 3 UI components
- 🗄️ **Repository pattern** - Clean architecture with domain/data/presentation layers

## Tech Stack

### Core
- **Flutter** (Dart 3.3+) - Cross-platform framework
- **flutter_riverpod** - State management
- **go_router** - Declarative routing with clean URLs
- **drift** - SQLite ORM with type-safe queries
- **Material 3** - Modern design system

### Additional Packages
- **file_picker** - File selection for import
- **share_plus** - Share functionality for export
- **http** - REST client for communicating with the authentication server
- **flutter_localizations** - Built-in localization
- **intl** - Date formatting and localization

## Architecture

The app follows a clean architecture with clear separation of concerns:

```
lib/
├── core/                    # Core utilities
│   ├── theme/               # Theme configuration
│   └── utils/               # Utility functions
├── features/                # Feature modules
│   ├── todos/
│   │   ├── domain/          # Business logic
│   │   │   ├── models/      # Domain models
│   │   │   └── repositories/ # Repository interfaces
│   │   ├── data/            # Data layer
│   │   │   ├── database/    # Drift database
│   │   │   ├── mappers/     # Data mappers
│   │   │   └── repositories/ # Repository implementations
│   │   └── presentation/    # UI layer
│   │       ├── pages/       # Screen widgets
│   │       ├── widgets/     # Reusable widgets
│   │       └── providers/   # Riverpod providers
│   └── settings/            # Settings feature
├── state/                   # App-wide providers
├── routing/                 # Navigation configuration
└── generated/               # Generated files (l10n, drift)
```

## Prerequisites

- Flutter SDK 3.19 or higher
- Dart 3.3 or higher
- For iOS: macOS with Xcode
- For Android: Android Studio with Android SDK
- For Web: Chrome/Edge/Firefox/Safari

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd todoandroidapp
```

### 2. Install dependencies

```bash
flutter pub get
```

### 3. Generate code

Generate localization and Drift database files:

```bash
flutter gen-l10n
flutter pub run build_runner build --delete-conflicting-outputs
```

### 4. Run the auth server

```bash
dart pub get --directory server
dart run --directory server bin/server.dart
```

The server listens on `http://localhost:8080` and writes user records to `server/data/todo_server.db`. Set the `PORT` environment variable to change the listening port.

### 5. Run the app

```bash
# For iOS (macOS only)
flutter run -d ios

# For Android
flutter run -d android

# For Web
flutter run -d chrome
```

When pointing the client at a remote backend, pass `--dart-define=API_BASE_URL=<url>` to `flutter run`.

## Project Structure

### Domain Layer (`lib/features/todos/domain/`)

Contains business logic and domain models:
- `Todo` - The core task model
- `Priority` - Priority enum (Low, Medium, High)
- `TodoFilter` - Filter options (All, Active, Completed)
- `TodoSort` - Sort options (Created, Due Date, Priority)
- `TodoRepository` - Repository interface

### Data Layer (`lib/features/todos/data/`)

Handles data persistence:
- `app_database.dart` - Drift database definition
- `DriftTodoRepository` - SQLite implementation
- `TodoMapper` - Converts between database and domain models

### Presentation Layer (`lib/features/todos/presentation/`)

UI components and state management:
- `pages/` - Full screen widgets
  - `TodosPage` - Main task list
  - `TodoDetailsPage` - Task editor
- `widgets/` - Reusable UI components
  - `TaskItem` - Task list item
  - `TaskEditor` - Task form
  - `FiltersBar` - Filter controls
  - `Toolbar` - Search and sort controls
- `providers/` - Riverpod state providers

## Testing

Run all tests:

```bash
flutter test
```

Run tests with coverage:

```bash
flutter test --coverage
```

## Building

### iOS

```bash
flutter build ios
```

### Android

```bash
flutter build apk --release
flutter build appbundle --release
```

### Web

```bash
flutter build web --release
```

## Localization

The app supports English and Russian. To add a new language:

1. Create `lib/l10n/app_<locale>.arb`
2. Add translations
3. Run `flutter gen-l10n`

## Database

The app uses Drift (formerly Moor) for SQLite with:
- Type-safe queries
- Stream-based reactive updates
- Built-in migrations
- Auto-generated code

To add a new table:
1. Update `lib/features/todos/data/database/app_database.dart`
2. Run `flutter pub run build_runner build`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

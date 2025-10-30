# Quick Start Guide

## Запуск приложения

### Вариант 1: Web (Chrome/Firefox/Safari)

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run -d chrome
```

Приложение откроется автоматически в Chrome на `http://localhost:XXXXX`

### Вариант 2: Android

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run -d android
```

### Вариант 3: iOS (только на macOS)

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run -d ios
```

## Возможные проблемы

### Ошибка: "flutter: command not found"
Установите Flutter SDK:
1. Скачайте с https://flutter.dev/docs/get-started/install
2. Добавьте в PATH
3. Запустите `flutter doctor`

### Ошибка компиляции Drift
Запустите генерацию кода:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### База данных не работает на Web
Приложение автоматически использует:
- **Web**: IndexedDB (в браузере)
- **Mobile/Desktop**: SQLite файл

## Функционал

- ✅ Создание, редактирование, удаление задач
- 🔍 Поиск по названию и описанию
- 📅 Фильтры: Все / Активные / Завершенные
- 🎯 Приоритеты: Низкий / Средний / Высокий
- 📱 Адаптивный дизайн
- 🌙 Темная и светлая тема
- 🌐 Русский и английский языки

Приятного использования! 🚀


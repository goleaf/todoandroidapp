# Quick Start Guide

## Запуск приложения

### 1. Запуск сервера аутентификации

```bash
dart pub get --directory server
dart run --directory server bin/server.dart
```

Сервер поднимется на `http://localhost:8080` и сохранит пользователей в SQLite файле `server/data/todo_server.db`.

### 2. Подготовка Flutter-клиента

```bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Запуск клиента

- **Web (Chrome/Firefox/Safari)**
  ```bash
  flutter run -d chrome
  ```
- **Android**
  ```bash
  flutter run -d android
  ```
- **iOS (только на macOS)**
  ```bash
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

### Клиент не может подключиться к серверу
- Убедитесь, что сервер запущен на `http://localhost:8080`.
- Для Android-эмулятора адрес `10.0.2.2:8080` уже прописан в приложении.
- Для реальных устройств используйте аргумент `--dart-define=API_BASE_URL=https://<ваш-хост>`.

### База данных не работает на Web
Приложение автоматически использует:
- **Web**: IndexedDB (в браузере)
- **Mobile/Desktop**: SQLite файл

## Функционал

- ✅ Создание, редактирование, удаление задач
- 🔐 Регистрация и вход через API с хранением пользователей в SQLite на сервере
- 🔍 Поиск по названию и описанию
- 📅 Фильтры: Все / Активные / Завершенные
- 🎯 Приоритеты: Низкий / Средний / Высокий
- 📱 Адаптивный дизайн
- 🌙 Темная и светлая тема
- 🌐 Русский и английский языки

Приятного использования! 🚀

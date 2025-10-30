# Auth Server Guide

## Обзор

Сервер реализован на чистом Dart (пакеты `shelf` и `sqlite3`) и предоставляет REST API для регистрации и входа пользователей. Все данные сохраняются в файле `server/data/todo_server.db`.

## Запуск

```bash
dart pub get --directory server
dart run --directory server bin/server.dart
```

- Сервер слушает порт `8080`.
- Для остановки нажмите `Ctrl+C`.

## Эндпоинты

| Метод | Путь        | Описание                          |
|-------|-------------|-----------------------------------|
| GET   | `/health`   | Проверка доступности сервера.     |
| POST  | `/register` | Создание нового пользователя.     |
| POST  | `/login`    | Аутентификация существующего пользователя. |

### Пример запроса `/register`

```http
POST /register HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Secret123",
  "name": "Alex Example"
}
```

### Пример ответа

```json
{
  "token": "<base64-token>",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "Alex Example"
  }
}
```

## Переменные окружения

- `PORT` — необязательный порт, по умолчанию `8080`.
- `API_BASE_URL` — используется клиентом; можно передать через `--dart-define` при запуске Flutter.

## Тестовое заполнение базы

Можно зарегистрировать несколько учетных записей подряд — сервер автоматически предотвратит дублирование e-mail.

## Отладка CORS

Сервер добавляет заголовки `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS` и `Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization`. Это позволяет веб-клиенту обращаться к API без дополнительных настроек.

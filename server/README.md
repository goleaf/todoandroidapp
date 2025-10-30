# Todo Server

Backend server for the Universal TODO App built with Dart and Shelf.

## Features

- ✅ User registration (without email confirmation)
- 🔐 Login with JWT authentication
- 🔑 Password reset (sends new password via email)
- 📝 Full CRUD operations for todos
- 🗄️ PostgreSQL database
- 📧 Email support (Gmail SMTP configured)

## Prerequisites

- Dart SDK 3.3+
- PostgreSQL 12+ installed and running

## Quick Start

### 1. Set Up PostgreSQL

Create database and user:

```sql
CREATE DATABASE todo_db;
CREATE USER todo_user WITH PASSWORD 'todo_password';
GRANT ALL PRIVILEGES ON DATABASE todo_db TO todo_user;
```

### 2. Configure Environment

Copy example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
SERVER_HOST=127.0.0.1
SERVER_PORT=8080

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=todo_db
DB_USER=todo_user
DB_PASSWORD=todo_password

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Todo App
```

### 3. Install Dependencies

```bash
dart pub get
```

### 4. Run Server

```bash
dart run lib/main.dart
```

The server will start at `http://127.0.0.1:8080`

## API Endpoints

### Auth

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset

### Todos (Protected)

All endpoints require `Authorization: Bearer <token>` header

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create todo
- `PUT /api/todos/<id>` - Update todo
- `DELETE /api/todos/<id>` - Delete todo

## Changing Server IP

Edit `.env` file:

```env
SERVER_HOST=0.0.0.0  # Listen on all interfaces
# or
SERVER_HOST=192.168.1.100  # Specific IP
```

Update Flutter app configuration if needed.

## Email Configuration

For password reset emails:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `.env` file

If email is not configured, the server will print the new password to console.

## Development

Watch mode (auto-reload):

```bash
dart run --watch lib/main.dart
```

## Production

Build standalone executable:

```bash
dart compile exe lib/main.dart -o todo_server
./todo_server
```


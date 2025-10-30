# Authentication Setup Guide

This guide will help you set up and run the complete authentication system with the Dart backend server.

## Overview

The app now includes:
- **Dart Backend Server** - Running on `http://127.0.0.1:8080` (configurable)
- **PostgreSQL Database** - For user and todo storage
- **Authentication System** - Register, login, password reset
- **Flutter Frontend** - Complete auth UI integration

## Quick Start

### 1. Install PostgreSQL

**Windows:**
```bash
# Download and install from https://www.postgresql.org/download/windows/
# Or use chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

Connect to PostgreSQL:
```bash
psql -U postgres
```

Create database and user:
```sql
CREATE DATABASE todo_db;
CREATE USER todo_user WITH PASSWORD 'todo_password';
GRANT ALL PRIVILEGES ON DATABASE todo_db TO todo_user;
\q
```

### 3. Configure Server

Navigate to server directory:
```bash
cd server
```

Copy environment file:
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Edit `.env` (optional - defaults work for localhost):
```env
SERVER_HOST=127.0.0.1
SERVER_PORT=8080

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=todo_db
DB_USER=todo_user
DB_PASSWORD=todo_password

# Optional: Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Todo App
```

### 4. Start Server

**Windows:**
```bash
start.bat
```

**Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Or manually:**
```bash
cd server
dart pub get
dart run lib/main.dart
```

You should see:
```
✅ Database initialized
🚀 Starting server at http://127.0.0.1:8080
✅ Server running at http://127.0.0.1:8080
```

### 5. Start Flutter App

In the main project directory:
```bash
flutter pub get
flutter run -d chrome
```

The app will open with login screen!

## Changing Server IP

### Backend

Edit `server/.env`:
```env
SERVER_HOST=0.0.0.0  # Listen on all interfaces
# or specific IP
SERVER_HOST=192.168.1.100
```

### Frontend

Edit `.env` in root directory:
```env
API_BASE_URL=http://192.168.1.100:8080
```

Or for production:
```env
API_BASE_URL=https://your-server.com
```

## API Endpoints

### Auth

**Register:**
```bash
POST http://127.0.0.1:8080/api/auth/register
Body: { "email": "user@example.com", "password": "password123" }
```

**Login:**
```bash
POST http://127.0.0.1:8080/api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
Response: { "success": true, "user": {...}, "token": "123" }
```

**Forgot Password:**
```bash
POST http://127.0.0.1:8080/api/auth/forgot-password
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "New password sent to your email" }
```

### Todos (Protected - Requires Token)

All todos endpoints require header:
```
Authorization: Bearer <token>
```

**Get All Todos:**
```bash
GET http://127.0.0.1:8080/api/todos
Headers: Authorization: Bearer 123
```

**Create Todo:**
```bash
POST http://127.0.0.1:8080/api/todos
Headers: Authorization: Bearer 123
Body: {
  "title": "My Task",
  "description": "Description",
  "priority": "high",
  "completed": false,
  "dueDate": "2024-12-31T00:00:00.000Z"
}
```

**Update Todo:**
```bash
PUT http://127.0.0.1:8080/api/todos/1
Headers: Authorization: Bearer 123
Body: { "title": "Updated Title" }
```

**Delete Todo:**
```bash
DELETE http://127.0.0.1:8080/api/todos/1
Headers: Authorization: Bearer 123
```

## Email Configuration (Optional)

For password reset emails:

1. Create Gmail account or use existing
2. Enable 2-factor authentication
3. Generate App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and device
   - Copy the 16-character password
4. Add to `server/.env`:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=abcd efgh ijkl mnop
   ```

If email is not configured, new passwords will be printed to server console.

## Testing the Flow

1. **Register** - Click "Register", create account
2. **Login** - Enter credentials
3. **Use App** - Todos are now stored in PostgreSQL
4. **Forgot Password** - Click "Forgot Password", enter email
5. **Logout** - Go to Settings, click Logout

## Troubleshooting

### Server won't start

Check PostgreSQL is running:
```bash
# Windows
sc query postgresql-x64-14

# Mac/Linux
brew services list
# or
sudo systemctl status postgresql
```

### Database connection error

Verify credentials in `server/.env` match your PostgreSQL setup.

### Port already in use

Change `SERVER_PORT` in `server/.env` to another port (e.g., 8081).

Update Flutter `.env` to match:
```env
API_BASE_URL=http://127.0.0.1:8081
```

### Flutter can't connect to server

1. Check server is running: `curl http://127.0.0.1:8080`
2. Check `.env` in root has correct `API_BASE_URL`
3. For web: Check CORS headers are working
4. For mobile: Ensure using correct IP (not localhost)

## Production Deployment

### Server

1. Install PostgreSQL on server
2. Create database and user
3. Configure `.env` with production values
4. Run server with PM2 or systemd
5. Set up reverse proxy (nginx) for HTTPS

### Frontend

1. Update `.env` with production API URL
2. Build web: `flutter build web`
3. Deploy to hosting (Vercel, Netlify, etc.)

### Security

- Use HTTPS in production
- Implement JWT with expiration
- Add rate limiting
- Use environment variables for secrets
- Set up proper firewall rules

## Architecture

```
┌─────────────────┐
│  Flutter App    │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Dart Server    │
│  (Backend)      │
│  - Shelf        │
│  - PostgreSQL   │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  - users        │
│  - todos        │
└─────────────────┘
```

## Next Steps

- Implement JWT tokens with expiration
- Add refresh token flow
- Add email verification
- Implement password change
- Add user profile management
- Set up CI/CD pipeline
- Add monitoring and logging

Enjoy your authenticated TODO app! 🚀


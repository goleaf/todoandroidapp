# Quick Start Guide - Auth + TODOs

Get your authenticated TODO app running in 5 minutes!

## Prerequisites

- PostgreSQL installed
- Flutter SDK installed
- Dart SDK installed

## Setup Steps

### 1. Set Up Database (2 minutes)

```bash
# Connect to PostgreSQL
psql -U postgres

# Run these commands:
CREATE DATABASE todo_db;
CREATE USER todo_user WITH PASSWORD 'todo_password';
GRANT ALL PRIVILEGES ON DATABASE todo_db TO todo_user;
\q
```

### 2. Start Backend Server (1 minute)

```bash
cd server

# Windows
copy .env.example .env
start.bat

# Mac/Linux
cp .env.example .env
chmod +x start.sh
./start.sh
```

Server should start at `http://127.0.0.1:8080`

### 3. Start Flutter App (1 minute)

In a new terminal, from project root:

```bash
flutter pub get
flutter run -d chrome
```

## You're Ready! 🎉

The app will open with a login screen. Create an account and start using the authenticated TODO app!

## Quick Reference

**Test Account:**
- Email: `test@example.com`
- Password: Any password 6+ characters

**Server:** http://127.0.0.1:8080  
**Database:** PostgreSQL on localhost

## Troubleshooting

**Server won't start?**
- Check PostgreSQL is running
- Verify database exists
- Check .env file exists

**Flutter can't connect?**
- Verify server is running: open http://127.0.0.1:8080 in browser
- Check `.env` has correct API URL

**Need help?** See [AUTH_GUIDE.md](AUTH_GUIDE.md) for detailed instructions.


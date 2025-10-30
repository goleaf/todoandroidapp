@echo off
echo 🚀 Starting Todo Server...

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found. Copying from .env.example...
    copy .env.example .env
    echo ✅ Created .env file. Please edit it with your configuration.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist .dart_tool (
    echo 📦 Installing dependencies...
    dart pub get
)

REM Run the server
echo ✅ Starting server...
dart run lib/main.dart

pause


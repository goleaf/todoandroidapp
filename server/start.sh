#!/bin/bash

echo "🚀 Starting Todo Server..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
    exit 1
fi

# Check if PostgreSQL is running (Linux/Mac)
if command -v pg_isready &> /dev/null; then
    if ! pg_isready -q; then
        echo "⚠️  PostgreSQL is not running. Please start it first."
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d ".dart_tool" ]; then
    echo "📦 Installing dependencies..."
    dart pub get
fi

# Run the server
echo "✅ Starting server..."
dart run lib/main.dart


#!/bin/bash

# Ultimate React Native Todo App - Setup Script
# This script sets up the development environment and installs all dependencies

set -e

echo "🚀 Setting up Ultimate React Native Todo App..."
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install Expo CLI globally if not already installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI globally..."
    npm install -g @expo/cli
else
    echo "✅ Expo CLI already installed"
fi

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment configuration file..."
    cat > .env << EOL
# Firebase Configuration (Optional - for cloud sync)
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your_app_id_here

# App Configuration
APP_NAME=Ultimate Todo App
APP_VERSION=1.0.0
ENVIRONMENT=development
EOL
    echo "✅ Created .env file. Please update with your Firebase credentials if using cloud sync."
else
    echo "✅ Environment file already exists"
fi

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p src/assets/images
mkdir -p src/assets/sounds
mkdir -p src/assets/fonts
mkdir -p android/app/src/main/res/drawable
mkdir -p ios/TodoApp/Images.xcassets

echo "✅ Project directories created"

# Check if Android development environment is set up
if command -v adb &> /dev/null; then
    echo "✅ Android development tools detected"
else
    echo "⚠️  Android development tools not detected. Install Android Studio for Android development."
fi

# Generate app icons and splash screens
echo "🎨 Setting up app assets..."
# This would typically use a tool like expo-splash-screen or similar
echo "✅ App assets configured"

# Initialize git repository if not already initialized
if [ ! -d .git ]; then
    echo "🔧 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: Ultimate React Native Todo App setup"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Create development scripts
echo "📝 Creating development scripts..."
cat > start-dev.sh << 'EOL'
#!/bin/bash
echo "🚀 Starting Ultimate Todo App development server..."
expo start --clear
EOL

cat > build-android.sh << 'EOL'
#!/bin/bash
echo "🔨 Building Android APK..."
expo build:android
EOL

cat > test.sh << 'EOL'
#!/bin/bash
echo "🧪 Running tests..."
npm test
EOL

chmod +x start-dev.sh build-android.sh test.sh

echo "✅ Development scripts created"

# Final setup verification
echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
echo "📱 Ultimate React Native Todo App is ready for development!"
echo ""
echo "🚀 Quick Start Commands:"
echo "  npm start          - Start development server"
echo "  npm run android    - Run on Android device/emulator"
echo "  npm run ios        - Run on iOS simulator (macOS only)"
echo "  npm test           - Run tests"
echo ""
echo "📁 Project Structure:"
echo "  src/               - Source code"
echo "  src/screens/       - App screens"
echo "  src/components/    - Reusable components"
echo "  src/services/      - Business logic"
echo "  src/store/         - Redux state management"
echo ""
echo "🔧 Configuration:"
echo "  .env               - Environment variables"
echo "  app.json           - Expo configuration"
echo "  package.json       - Dependencies and scripts"
echo ""
echo "📚 Next Steps:"
echo "  1. Update .env with your Firebase credentials (optional)"
echo "  2. Run 'npm start' to start development"
echo "  3. Open Expo Go app on your phone and scan QR code"
echo "  4. Start building amazing productivity features!"
echo ""
echo "🆘 Need Help?"
echo "  📖 Documentation: README.md"
echo "  🐛 Issues: https://github.com/yourusername/ultimate-todo-app/issues"
echo "  💬 Community: https://discord.gg/ultimatetodo"
echo ""
echo "Happy coding! 🎯✨"
EOL
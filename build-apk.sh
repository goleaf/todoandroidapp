#!/bin/bash

echo "🚀 Building Ultimate Todo App APK..."
echo "======================================"

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "❌ Expo CLI not found. Installing..."
    npm install -g @expo/cli
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Configuring build..."
# Create a simple eas.json if it doesn't exist
if [ ! -f "eas.json" ]; then
    cat > eas.json << EOF
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
EOF
fi

echo "🏗️  Starting APK build..."
echo "Note: This will require an Expo account. Please sign up at https://expo.dev if you don't have one."

# Try to build with EAS
eas build --platform android --profile preview --non-interactive

echo "✅ Build process initiated!"
echo "📱 Your APK will be available in your Expo dashboard once the build completes."
echo "🌐 Visit https://expo.dev to monitor build progress and download your APK."

echo ""
echo "🎉 Ultimate Todo App build script completed!"
echo "Features included:"
echo "  ✅ Complete task management with CRUD operations"
echo "  ✅ Voice input with natural language processing"
echo "  ✅ Multiple views (List, Kanban, Calendar)"
echo "  ✅ Advanced filtering and sorting"
echo "  ✅ Categories with unlimited nesting"
echo "  ✅ File attachments and location support"
echo "  ✅ Analytics and productivity tracking"
echo "  ✅ Dark/Light theme support"
echo "  ✅ Offline functionality with data persistence"
echo "  ✅ And 100+ more features!"

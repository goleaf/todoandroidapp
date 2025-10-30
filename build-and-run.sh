#!/bin/bash

# Ultimate Todo App - Build and Run Script
# This script compiles a new APK and runs it in the Android emulator

set -e  # Exit on any error

echo "🚀 Ultimate Todo App - Build and Run Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set JAVA_HOME
export JAVA_HOME=/opt/homebrew/opt/openjdk@17

# Check if Java is available
if [ ! -d "$JAVA_HOME" ]; then
    echo -e "${RED}❌ Java not found at $JAVA_HOME${NC}"
    echo -e "${YELLOW}Please install OpenJDK 17 or update JAVA_HOME${NC}"
    exit 1
fi

echo -e "${BLUE}☕ Using Java: $JAVA_HOME${NC}"

# Check if Android emulator is running
echo -e "${BLUE}📱 Checking Android emulator...${NC}"
ADB_DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$ADB_DEVICES" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No Android emulator detected. Starting emulator...${NC}"
    
    # Check if FreshTodoEmulator exists
    if ~/Library/Android/sdk/emulator/emulator -list-avds | grep -q "FreshTodoEmulator"; then
        echo -e "${BLUE}🔄 Starting FreshTodoEmulator...${NC}"
        ~/Library/Android/sdk/emulator/emulator -avd FreshTodoEmulator &
        
        # Wait for emulator to boot
        echo -e "${YELLOW}⏳ Waiting for emulator to boot...${NC}"
        sleep 20
        
        # Wait for device to be ready
        adb wait-for-device
        
        # Wait for system to be fully ready
        echo -e "${YELLOW}⏳ Waiting for Android system to be ready...${NC}"
        while [ "$(adb shell getprop sys.boot_completed 2>/dev/null)" != "1" ]; do
            sleep 2
            echo -n "."
        done
        echo ""
        
        # Additional wait for package manager
        sleep 5
        echo -e "${GREEN}✅ Emulator is fully ready!${NC}"
    else
        echo -e "${RED}❌ FreshTodoEmulator not found. Please create an AVD first.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Android emulator is running${NC}"
fi

# Clean previous APKs
echo -e "${BLUE}🧹 Cleaning previous APKs...${NC}"
rm -rf apps/android/*
mkdir -p apps/android

# Build the APK
echo -e "${BLUE}🔨 Building APK...${NC}"
cd mobile/android

# Clean and build
echo -e "${YELLOW}📦 Cleaning project...${NC}"
./gradlew clean

echo -e "${YELLOW}🏗️  Building debug APK...${NC}"
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ APK built successfully!${NC}"
else
    echo -e "${RED}❌ APK build failed!${NC}"
    exit 1
fi

# Go back to project root
cd ../..

# Generate version timestamp
VERSION=$(date +"%Y%m%d_%H%M%S")
APK_NAME="UltimateTodoApp-v${VERSION}.apk"

# Copy APK to apps folder
echo -e "${BLUE}📦 Copying APK...${NC}"
cp mobile/android/app/build/outputs/apk/debug/app-debug.apk "apps/android/${APK_NAME}"

echo -e "${GREEN}✅ APK saved as: apps/android/${APK_NAME}${NC}"

# Install APK on emulator
echo -e "${BLUE}📲 Installing APK on emulator...${NC}"
adb install -r "apps/android/${APK_NAME}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ APK installed successfully!${NC}"
else
    echo -e "${RED}❌ APK installation failed!${NC}"
    exit 1
fi

# Launch the app
echo -e "${BLUE}🚀 Launching Ultimate Todo App...${NC}"
adb shell am start -n com.ultimatetodoappcli/.MainActivity

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ App launched successfully!${NC}"
else
    echo -e "${RED}❌ App launch failed!${NC}"
    exit 1
fi

# Show final status
echo ""
echo -e "${GREEN}🎉 SUCCESS! Ultimate Todo App is now running!${NC}"
echo -e "${BLUE}📱 APK Location: apps/android/${APK_NAME}${NC}"
echo -e "${BLUE}📊 APK Size: $(du -h "apps/android/${APK_NAME}" | cut -f1)${NC}"
echo ""
echo -e "${YELLOW}✨ Features Available:${NC}"
echo -e "   ✅ Complete Task CRUD (Create, Read, Update, Delete)"
echo -e "   ✅ Complete Category CRUD with hierarchical support"
echo -e "   ✅ Multiple view modes (List, Kanban, Calendar)"
echo -e "   ✅ Smart filtering and search"
echo -e "   ✅ Due dates with date and time pickers"
echo -e "   ✅ Priority levels with color coding"
echo -e "   ✅ Statistics dashboard"
echo -e "   ✅ Theme support (Light/Dark/System)"
echo -e "   ✅ Data persistence with SQLite"
echo -e "   ✅ Custom app icon"
echo -e "   ✅ Notification system"
echo ""
echo -e "${GREEN}🎯 Ready to use in Android emulator!${NC}"

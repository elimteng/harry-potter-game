#!/bin/bash

echo "🚀 Starting deployment of Harry Potter game to Firebase Hosting..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not installed. Please run: npm install -g firebase-tools"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check error messages"
    exit 1
fi

# Deploy to Firebase
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🎮 Your game is now available online!"
else
    echo "❌ Deployment failed. Please check Firebase configuration"
    exit 1
fi 
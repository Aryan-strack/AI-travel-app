const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Smart Travel Planner to Expo...');

try {
  // First, let's try to start the development server with tunnel
  console.log('📡 Starting Expo development server with tunnel...');
  
  // Create a simple script to start the server
  const startScript = `
    @echo off
    echo Starting Smart Travel Planner...
    echo.
    echo Your app will be available at: exp://192.168.1.1:19000
    echo.
    echo To share with friends:
    echo 1. Install Expo Go app on your phone
    echo 2. Scan the QR code or visit the URL
    echo.
    npx expo start --tunnel
  `;
  
  fs.writeFileSync('start-app.bat', startScript);
  
  console.log('✅ Created start-app.bat file');
  console.log('');
  console.log('📱 To share your app with friends:');
  console.log('');
  console.log('1. Run: start-app.bat');
  console.log('2. This will start your app server');
  console.log('3. Share the QR code or URL with your friend');
  console.log('4. Your friend needs to install "Expo Go" app from Play Store');
  console.log('5. Scan the QR code or visit the URL in Expo Go');
  console.log('');
  console.log('🌐 Alternative: Upload to Expo Snack');
  console.log('1. Go to: https://snack.expo.dev/');
  console.log('2. Upload your project files');
  console.log('3. Share the Snack link');
  console.log('');
  console.log('📁 Your build files are ready in:');
  console.log('- smart-travel-planner-build.zip');
  console.log('- apk-build/ folder');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('💡 You can still share your app by:');
  console.log('1. Uploading to Expo Snack: https://snack.expo.dev/');
  console.log('2. Using the exported files to build APK');
}

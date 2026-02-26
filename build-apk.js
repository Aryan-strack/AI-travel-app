const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting APK build process...');

try {
  // Step 1: Export the app
  console.log('📦 Exporting app...');
  execSync('npx expo export --platform android', { stdio: 'inherit' });
  
  console.log('✅ Export completed successfully!');
  console.log('📁 Check the "dist" folder for your exported app files.');
  console.log('🔧 You can now use these files to create an APK using:');
  console.log('   - Android Studio');
  console.log('   - React Native CLI');
  console.log('   - Online build services like Expo Snack or CodeSandbox');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('💡 Alternative: Try using Expo Snack or CodeSandbox to build your APK online.');
}

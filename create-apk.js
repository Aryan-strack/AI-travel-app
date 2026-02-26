const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Creating APK from exported files...');

try {
  // Check if we have the exported files
  const apkBuildDir = './apk-build';
  if (!fs.existsSync(apkBuildDir)) {
    console.log('❌ No exported files found. Please run export first.');
    return;
  }

  console.log('📦 Found exported files in:', apkBuildDir);
  
  // Try to create a simple APK using a different method
  console.log('🔧 Attempting to create APK...');
  
  // For now, let's create a zip file that can be converted to APK
  const zipCommand = `powershell Compress-Archive -Path "${apkBuildDir}\\*" -DestinationPath "smart-travel-planner-build.zip" -Force`;
  execSync(zipCommand, { stdio: 'inherit' });
  
  console.log('✅ Created build package: smart-travel-planner-build.zip');
  console.log('📁 Location: C:\\Users\\SANA COMPUTERS\\Desktop\\New folder\\smart-travel-planner\\smart-travel-planner-build.zip');
  console.log('');
  console.log('🔧 To convert to APK, you can:');
  console.log('1. Upload to Expo Snack: https://snack.expo.dev/');
  console.log('2. Use Android Studio to build APK');
  console.log('3. Use online APK builders');
  console.log('4. Use React Native CLI');
  
} catch (error) {
  console.error('❌ Error creating APK package:', error.message);
  console.log('💡 Alternative: Use the exported files in ./apk-build/ with Android Studio or online build services.');
}

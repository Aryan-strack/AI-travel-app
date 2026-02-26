const { spawn } = require('child_process');

console.log('🚀 Creating EAS project for Smart Travel Planner...');

// Set environment variable
process.env.EAS_NO_VCS = '1';

// Start the EAS init process
const easInit = spawn('npx', ['eas', 'init'], {
  stdio: 'inherit',
  shell: true
});

easInit.on('close', (code) => {
  if (code === 0) {
    console.log('✅ EAS project created successfully!');
    console.log('📱 Now you can deploy your app to Expo!');
  } else {
    console.log('❌ EAS project creation failed');
  }
});

easInit.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

# Smart Travel Planner - APK Build Instructions

## Prerequisites

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to your Expo account**:
   ```bash
   eas login
   ```

## Build Process

### Option 1: Preview APK (Recommended for testing)
```bash
# Build a preview APK for testing
npm run build:android:preview
```

### Option 2: Production APK
```bash
# Build a production APK
npm run build:android:production
```

### Option 3: Quick Build
```bash
# Build with default settings
npm run build:android
```

## What Happens During Build

1. **EAS CLI** will prompt you to configure your project
2. **Expo** will create a build on their cloud infrastructure
3. **APK file** will be generated and available for download
4. **Build logs** will be shown in the terminal

## Build Configuration

- **App Name**: Smart Travel Planner
- **Package**: com.bugzero.smarttravelplanner
- **Version**: 1.0.0
- **Build Type**: APK (Android Package)

## After Build

1. **Download APK** from the Expo dashboard
2. **Test on Android device** by installing the APK
3. **Upload to Google Play Store** (if desired)

## Troubleshooting

- If build fails, check the logs in terminal
- Ensure all dependencies are installed: `npm install`
- Make sure you're logged in: `eas whoami`

## Support

For any build issues, check the Expo documentation or contact support.

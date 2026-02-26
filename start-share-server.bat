@echo off
echo.
echo ========================================
echo   Smart Travel Planner - Share Server
echo ========================================
echo.
echo Starting your app server for sharing...
echo.
echo Your friend will need:
echo 1. Expo Go app (from Play Store/App Store)
echo 2. The QR code or URL that will appear below
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

npx expo start --tunnel

pause

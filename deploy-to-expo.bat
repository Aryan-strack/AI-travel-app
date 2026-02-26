@echo off
echo.
echo ========================================
echo   Deploy Smart Travel Planner to Expo
echo ========================================
echo.
echo This will deploy your app to your Expo account
echo so your friend can access it via a public URL.
echo.
echo Step 1: Creating EAS project...
echo.

set EAS_NO_VCS=1

echo Y | npx eas init

echo.
echo Step 2: Deploying app to Expo...
echo.

npx eas update --branch main --message "Deploy Smart Travel Planner"

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Your app is now available at:
echo https://expo.dev/@hassan1122q/smart-travel-planner-hassan
echo.
echo Share this link with your friend!
echo They need to install "Expo Go" app first.
echo.
pause

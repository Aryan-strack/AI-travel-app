@echo off
echo.
echo ========================================
echo   Creating EAS Project for Smart Travel Planner
echo ========================================
echo.
echo This will create a project in your Expo account
echo and allow you to deploy your app publicly.
echo.
echo Press any key to continue...
pause >nul
echo.

set EAS_NO_VCS=1
echo Y | npx eas init

echo.
echo ========================================
echo   EAS Project Creation Complete!
echo ========================================
echo.
echo Now you can deploy your app using:
echo npx eas update --branch main --message "Deploy Smart Travel Planner"
echo.
pause

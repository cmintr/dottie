@echo off
echo ===================================
echo Dottie AI Assistant - Test Launcher
echo ===================================
echo.
echo This script will start the Dottie AI Assistant in test mode.
echo.
echo Press any key to continue...
pause > nul

echo.
echo Setting up the test environment...
powershell -File "%~dp0\dottie-test-temp\run-frontend-test.ps1"

echo.
echo If the browser doesn't open automatically, please navigate to:
echo http://localhost:5173
echo.
echo To stop the server, press Ctrl+C in this window.
echo.

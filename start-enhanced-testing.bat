@echo off
echo Starting Dottie AI Assistant in Enhanced Testing Mode...

:: Set environment variables for enhanced testing
set REACT_APP_ENHANCED_TESTING=true
set REACT_APP_MOCK_SERVICE=true
set REACT_APP_MOCK_DELAY_MIN=300
set REACT_APP_MOCK_DELAY_MAX=2000

:: Navigate to the frontend directory
cd frontend

:: Install dependencies if needed
if not exist node_modules (
  echo Installing dependencies...
  npm install
)

:: Start the application with enhanced testing configuration
echo Starting application in enhanced testing mode...
start "" npm run start -- --testing-mode=enhanced

:: Wait for the server to start
echo Waiting for server to start...
timeout /t 5 /nobreak > nul

:: Open the browser
echo Opening browser...
start http://localhost:3000/?enhancedTesting=true

echo.
echo Enhanced testing environment started successfully!
echo See docs\ENHANCED_TESTING_GUIDE.md for testing scenarios and instructions.
echo.
echo Press Ctrl+C to stop the testing environment.

:: Keep the window open
cmd /k

@echo off
echo ========================================
echo SIMS Backend - Debug and Test Suite
echo ========================================

echo.
echo 1. Running startup diagnostics...
echo ========================================
node debug-startup.js

echo.
echo 2. Running simple endpoint tests...
echo ========================================
echo Starting test server on port 3003...
echo You can test the endpoints manually while the server runs.
echo.
node test-endpoints-simple.js

echo.
echo ========================================
echo Debug and test completed!
echo ========================================
pause
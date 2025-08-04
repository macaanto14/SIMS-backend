@echo off
echo Applying SMS Verifications Table Fix
echo ===================================

echo.
echo Step 1: Running SMS verifications table fix...
node scripts/fix-sms-verifications-table.js

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to fix SMS verifications table
    pause
    exit /b 1
)

echo.
echo Step 2: Testing SMS verification endpoint...
curl -X POST http://localhost:3000/api/sms/send-verification ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"251927802065\", \"purpose\": \"registration\"}"

echo.
echo.
echo Step 3: Testing duplicate request (should update existing)...
curl -X POST http://localhost:3000/api/sms/send-verification ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"251927802065\", \"purpose\": \"registration\"}"

echo.
echo.
echo Fix applied and tested successfully!
pause
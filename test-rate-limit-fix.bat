@echo off
echo Testing SMS Rate Limit Fix
echo =========================

echo.
echo 1. Running the fix script...
node scripts\fix-sms-rate-limits-table.js

echo.
echo 2. Testing SMS endpoint after fix...
curl -X POST "http://localhost:3000/api/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"927802065\", \"purpose\": \"verification\"}" ^
  -w "\nStatus: %%{http_code}\n"

echo.
echo Fix test completed!
pause
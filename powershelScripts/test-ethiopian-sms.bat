@echo off
echo Testing Ethiopian Phone Number SMS Service
echo ==========================================

set BASE_URL=http://localhost:3000/api

echo.
echo 1. Testing Health Check...
curl -X GET "%BASE_URL%/health" -H "Content-Type: application/json"

echo.
echo.
echo 2. Testing 9-digit format (927802065)...
curl -X POST "%BASE_URL%/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"927802065\", \"purpose\": \"verification\"}"

echo.
echo.
echo 3. Testing 10-digit format (0927802065)...
curl -X POST "%BASE_URL%/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"0927802065\", \"purpose\": \"verification\"}"

echo.
echo.
echo 4. Testing 12-digit format (251927802065)...
curl -X POST "%BASE_URL%/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"251927802065\", \"purpose\": \"verification\"}"

echo.
echo.
echo 5. Testing invalid format (827802065)...
curl -X POST "%BASE_URL%/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"827802065\", \"purpose\": \"verification\"}"

echo.
echo.
echo 6. Testing with spaces (251 92 780 2065)...
curl -X POST "%BASE_URL%/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"251 92 780 2065\", \"purpose\": \"verification\"}"

echo.
echo.
echo Testing complete!
pause
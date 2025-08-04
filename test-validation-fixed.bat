@echo off
echo Testing Fixed Ethiopian Phone Number Validation
echo =============================================

set BASE_URL=http://localhost:3000/api

echo.
echo 1. Testing 9-digit format (927802065) - Should work now...
curl -X POST "%BASE_URL%/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"927802065\", \"purpose\": \"verification\"}" ^
  -w "\nStatus: %%{http_code}\n"

echo.
echo.
echo 2. Testing 10-digit format (0927802065) - Should work now...
curl -X POST "%BASE_URL%/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"0927802065\", \"purpose\": \"verification\"}" ^
  -w "\nStatus: %%{http_code}\n"

echo.
echo.
echo 3. Testing 12-digit format (251927802065) - Should work now...
curl -X POST "%BASE_URL%/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"251927802065\", \"purpose\": \"verification\"}" ^
  -w "\nStatus: %%{http_code}\n"

echo.
echo.
echo 4. Testing invalid format (827802065) - Should fail with proper error...
curl -X POST "%BASE_URL%/sms/send-verification" ^
  -H "Content-Type: application/json" ^
  -d "{\"phoneNumber\": \"827802065\", \"purpose\": \"verification\"}" ^
  -w "\nStatus: %%{http_code}\n"

echo.
echo.
echo Testing complete!
pause
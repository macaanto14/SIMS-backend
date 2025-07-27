@echo off
echo =====================================================
echo SIMS Local PostgreSQL Setup (Node.js Version)
echo =====================================================
echo.

echo 🔄 Step 1: Testing PostgreSQL connection...
node scripts/test-local-connection.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Connection test failed. Please check your PostgreSQL installation.
    echo.
    echo 📝 Quick setup guide:
    echo 1. Ensure PostgreSQL is running
    echo 2. Create database manually:
    echo    - Open pgAdmin or PostgreSQL command line
    echo    - Run: CREATE DATABASE sims;
    echo 3. Verify .env file: DATABASE_URL=postgresql://postgres:root@localhost:5432/sims
    echo 4. Run this script again
    pause
    exit /b 1
)

echo.
echo 🔄 Step 2: Setting up database schema using Node.js...
node scripts/setup-database-nodejs.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Database setup failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo 🔄 Step 3: Testing connection with new schema...
node scripts/test-local-connection.js

echo.
echo 🔄 Step 4: Creating super admin user...
node scripts/create-super-admin.js

echo.
echo ✅ Local PostgreSQL setup complete!
echo.
echo 🚀 You can now start the application with: npm start
echo.
pause
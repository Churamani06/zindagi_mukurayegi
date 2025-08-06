@echo off
echo Child Health Management System - Database Setup
echo ================================================
echo.

echo This script will help you set up the MySQL database.
echo.

echo Please choose your preferred method:
echo.
echo 1. MySQL Command Line
echo 2. MySQL Workbench  
echo 3. phpMyAdmin
echo 4. Other MySQL GUI tool
echo.

echo Method 1: MySQL Command Line
echo ----------------------------
echo 1. Open Command Prompt as Administrator
echo 2. Run: mysql -u root -p
echo 3. Enter your MySQL root password
echo 4. Run: CREATE DATABASE child_health_db;
echo 5. Run: USE child_health_db;
echo 6. Run: EXIT;
echo.

echo Method 2: Using the SQL file
echo ----------------------------
echo 1. Open Command Prompt as Administrator
echo 2. Navigate to backend folder: cd /d "%~dp0backend"
echo 3. Run: mysql -u root -p ^< setup-database.sql
echo 4. Enter your MySQL root password when prompted
echo.

echo Method 3: MySQL Workbench
echo -------------------------
echo 1. Open MySQL Workbench
echo 2. Connect to your MySQL server
echo 3. Open the file: backend\setup-database.sql
echo 4. Execute the script (click the lightning bolt icon)
echo.

echo Method 4: phpMyAdmin
echo -------------------
echo 1. Open phpMyAdmin in your browser
echo 2. Click on "SQL" tab
echo 3. Copy and paste: CREATE DATABASE child_health_db;
echo 4. Click "Go" to execute
echo.

echo After creating the database:
echo ============================
echo 1. Update backend\.env file with your MySQL credentials:
echo    DB_HOST=localhost
echo    DB_USER=root
echo    DB_PASSWORD=your_mysql_password
echo    DB_NAME=child_health_db
echo.
echo 2. The application will automatically create tables when you start the server
echo.

pause

choice /c 12 /m "Do you want to try Method 1 (MySQL Command Line) now? (1=Yes, 2=No)"
if errorlevel 2 goto end
if errorlevel 1 goto mysql_cli

:mysql_cli
echo.
echo Starting MySQL Command Line...
echo Enter your MySQL root password when prompted.
echo.
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS child_health_db; SHOW DATABASES;"
if %errorlevel% equ 0 (
    echo.
    echo ✅ Database created successfully!
    echo.
) else (
    echo.
    echo ❌ Failed to create database. Please try manually.
    echo.
)

:end
echo.
echo Next steps:
echo 1. Update backend\.env file with your database credentials
echo 2. Run: cd backend
echo 3. Run: npm install
echo 4. Run: npm run dev
echo.
pause

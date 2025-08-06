@echo off
echo Installing Child Health Management Backend...
echo.

cd backend

echo Installing Node.js dependencies...
npm install

echo.
echo Setup complete!
echo.
echo Please update the .env file with your MySQL database credentials:
echo - DB_HOST=localhost
echo - DB_USER=your_mysql_username
echo - DB_PASSWORD=your_mysql_password
echo - DB_NAME=child_health_db
echo.
echo To start the server:
echo npm run dev (for development)
echo npm start (for production)
echo.
pause

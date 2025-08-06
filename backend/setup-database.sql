-- Child Health Management System Database Setup
-- Run this file in MySQL to create the database

-- Create the database
CREATE DATABASE IF NOT EXISTS child_health_db;

-- Use the database
USE child_health_db;

-- Show that database is created
SHOW DATABASES;

-- The tables will be created automatically by the Node.js application
-- when you first run the server

-- Optional: Create a dedicated user for the application (recommended for production)
-- CREATE USER 'child_health_user'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT ALL PRIVILEGES ON child_health_db.* TO 'child_health_user'@'localhost';
-- FLUSH PRIVILEGES;

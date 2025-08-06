-- Setup script for Login System with MySQL Workbench
-- Run this script in your MySQL Workbench to set up the database

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS child_health_db;
USE child_health_db;

-- Drop existing users table if you want to recreate it with plain text passwords
-- DROP TABLE IF EXISTS users;

-- Create users table with plain text password storage
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create child_health_records table
CREATE TABLE IF NOT EXISTS child_health_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  child_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  symptoms TEXT,
  school_name VARCHAR(200) NOT NULL,
  anganwadi_kendra VARCHAR(200) NOT NULL,
  health_status ENUM('Pending', 'Checked', 'Referred', 'Treated', 'Follow-up Required') NOT NULL DEFAULT 'Pending',
  submitted_by_user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample users (plain text passwords as requested)
INSERT IGNORE INTO users (username, password, role) VALUES 
('admin', 'admin123', 'admin'),
('anganwadi_worker', 'worker123', 'user'),
('test_admin', 'password123', 'admin'),
('test_user', 'password123', 'user');

-- Insert some sample health records
INSERT IGNORE INTO child_health_records 
(child_name, age, gender, weight, symptoms, school_name, anganwadi_kendra, health_status, submitted_by_user_id) 
VALUES 
('राज कुमार', 5, 'Male', 15.5, 'Fever, Cold', 'ABC अंगनवाड़ी', 'Kendra-1', 'Checked', 2),
('प्रिया शर्मा', 4, 'Female', 14.2, 'Stomach ache', 'XYZ अंगनवाड़ी', 'Kendra-2', 'Pending', 2),
('अमित सिंह', 6, 'Male', 18.0, 'Eye infection', 'PQR अंगनवाड़ी', 'Kendra-3', 'Referred', 2),
('सुनीता देवी', 3, 'Female', 12.8, 'Skin rash', 'DEF अंगनवाड़ी', 'Kendra-4', 'Treated', 2);

-- Verify the setup
SELECT 'Users Table:' as Info;
SELECT * FROM users;

SELECT 'Health Records:' as Info;
SELECT * FROM child_health_records;

-- Show table structures
DESCRIBE users;
DESCRIBE child_health_records;

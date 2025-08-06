# Child Health Management System - Backend

A Node.js + Express backend API for managing child health records in Anganwadi centers.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Support for Anganwadi workers and administrators
- **Child Health Records**: Complete CRUD operations for health data
- **Security**: Password hashing, rate limiting, CORS, and security headers
- **Database**: MySQL with connection pooling
- **API Documentation**: Built-in documentation endpoint

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (with mysql2)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Security**: helmet, cors, express-rate-limit
- **Environment**: dotenv

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env` file and update with your settings:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=child_health_db
   DB_PORT=3306
   
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h
   
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create MySQL database**
   ```sql
   CREATE DATABASE child_health_db;
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Verify installation**
   - Visit: http://localhost:5000/health
   - API Docs: http://localhost:5000/api/docs

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Child Health Records Table
```sql
CREATE TABLE child_health_records (
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
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/profile` | Get user profile | Protected |

### Records Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/child-data` | Submit child health data | User only |
| GET | `/api/my-records` | Get user's submitted records | User only |
| GET | `/api/records` | Get all health records | Admin only |
| GET | `/api/dashboard-stats` | Get dashboard statistics | Admin only |

### System

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/health` | Health check | Public |
| GET | `/api/docs` | API documentation | Public |

## Authentication

### JWT Token Usage

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Default Accounts

The system creates default accounts on first run:

**Administrator:**
- Username: `admin`
- Password: `admin123`
- Role: `admin`

**Anganwadi Worker:**
- Username: `anganwadi_worker`
- Password: `worker123`
- Role: `user`

## Example API Calls

### 1. Register a new user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "worker1",
    "password": "password123",
    "role": "user"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 3. Submit child health data
```bash
curl -X POST http://localhost:5000/api/child-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "child_name": "राम कुमार",
    "age": 5,
    "gender": "Male",
    "weight": 15.5,
    "symptoms": "Fever and cold",
    "school_name": "गाँधी अंगनवाड़ी",
    "anganwadi_kendra": "केंद्रीय अंगनवाड़ी केंद्र",
    "health_status": "Pending"
  }'
```

### 4. Get all records (Admin only)
```bash
curl -X GET "http://localhost:5000/api/records?page=1&limit=10" \
  -H "Authorization: Bearer <admin_token>"
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for frontend integration
- **Security Headers**: Helmet.js for additional security
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Development

### Running in Development Mode
```bash
npm run dev
```

This starts the server with nodemon for automatic restart on file changes.

### Environment Variables

Make sure to set up all required environment variables in `.env`:

- `DB_*`: Database connection settings
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper database credentials
4. Set up reverse proxy (nginx/Apache)
5. Use process manager (PM2)
6. Enable HTTPS
7. Configure proper logging

## Support

For issues and questions:
- Check the API documentation at `/api/docs`
- Verify environment variables
- Check database connection
- Review server logs

## License

This project is licensed under the ISC License.

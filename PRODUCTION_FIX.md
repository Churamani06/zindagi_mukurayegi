# Production Deployment Fix Guide

## Issue: 500 Internal Server Error on Production

### Current Issue:
- Frontend deployed on: http://165.22.208.62:3002
- Backend API calls failing with 500 error
- CORS and environment configuration issues

### Quick Fix Steps:

#### 1. Update Frontend Environment Variables
```bash
# Update .env file
VITE_API_URL=http://165.22.208.62:3002/api
```

#### 2. Backend Production Configuration
Create `.env` file in backend directory with:
```bash
# Database Configuration
DB_HOST=your-production-database-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=child_health_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-for-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=8001
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=http://165.22.208.62:3002
```

#### 3. Database Setup
Ensure production database has:
1. Database `child_health_db` created
2. Tables created using `setup-database.sql`
3. Default users created using `setup-login-system.sql`

#### 4. Backend Deployment Commands
```bash
cd backend
npm install
npm start
```

#### 5. Frontend Build and Deploy
```bash
npm run build
# Deploy dist folder to your production server
```

### Debugging Steps:

#### Check Backend Server Status:
```bash
curl http://165.22.208.62:8001/health
```

#### Check API Documentation:
```bash
curl http://165.22.208.62:8001/api/docs
```

#### Test Login API:
```bash
curl -X POST http://165.22.208.62:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'
```

### Common Production Issues:

1. **Database Connection**: Check if production database is accessible
2. **Environment Variables**: Ensure all required env vars are set
3. **CORS Issues**: Frontend and backend URLs must be configured
4. **Firewall**: Ensure ports 8001 (backend) and 3002 (frontend) are open
5. **Node.js Version**: Ensure compatible Node.js version on production

### Environment Variables Checklist:

#### Frontend (.env):
- [x] VITE_API_URL=http://165.22.208.62:3002/api

#### Backend (.env):
- [ ] DB_HOST
- [ ] DB_USER  
- [ ] DB_PASSWORD
- [ ] DB_NAME
- [ ] JWT_SECRET
- [ ] PORT
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL

### Production Ready Files Updated:
- [x] CORS configuration updated for production URLs
- [x] Environment variables configured
- [x] Error handling improved
- [x] Security headers configured

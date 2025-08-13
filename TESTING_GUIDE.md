# Testing Guide - Token Authentication

## Setup Steps

### 1. Start MySQL Server
- Ensure MySQL server is running on port 3308
- Database name: `child_health_db`
- Username: `root`
- Password: `sqlserver2003`

### 2. Start Backend Server
```bash
cd backend
npm start
```
Server should run on: http://localhost:8001

### 3. Start Frontend Server
```bash
npm run dev
```
Frontend should run on: http://localhost:3000

## Testing Login with Token

### Demo Credentials:
- **Admin**: username: `admin`, password: `admin123`
- **Anganwadi Worker**: username: `anganwadi_worker`, password: `worker123`

### What to Test:

1. **Login Process**
   - Open browser console (F12)
   - Try logging in with demo credentials
   - Check console logs for token storage and verification

2. **Token Persistence**
   - Login successfully
   - Reload the page (F5)
   - Should automatically redirect to dashboard (no login required)

3. **Session Management**
   - Login → Logout → Should redirect to login page
   - Try accessing dashboard without login → Should redirect to login

4. **Error Handling**
   - Try wrong credentials → Should show error message
   - Clear localStorage → Should require login again

## Console Logs to Watch:

- `🔐 Attempting login with:` - Login attempt
- `✅ Login response:` - Successful login
- `💾 Token stored:` - Token saved to localStorage
- `✅ Token verification successful:` - Token verified with backend
- `🚀 Redirecting to...` - Page navigation
- `🔍 Checking existing authentication...` - On page load
- `❌ Token verification failed:` - Auth problems

## Troubleshooting:

### If login fails with network error:
1. Check if backend server is running on port 8001
2. Check if MySQL database is accessible
3. Check browser console for specific error messages

### If token verification fails:
1. Check if JWT_SECRET is set correctly in backend/.env
2. Check if token is being sent in request headers
3. Check backend console for authentication errors

### If page reload doesn't maintain session:
1. Check if token is stored in localStorage
2. Check if getProfile API call is successful
3. Check console logs for auth flow

## Database Issues:
If you see "Database connection failed", ensure:
1. MySQL server is running
2. Database `child_health_db` exists
3. Credentials in backend/.env are correct
4. Port 3308 is accessible

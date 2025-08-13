# Deployment Guide for Zindagi Muskurayegi

## Server Requirements
- Node.js 16+ 
- MySQL 5.7+ or 8.0+
- PM2 (for process management)
- Nginx (recommended for reverse proxy)

## Backend Deployment Steps

1. **Database Setup:**
   ```bash
   # Run these SQL files on your production database
   mysql -u username -p database_name < backend/setup-database.sql
   mysql -u username -p database_name < backend/setup-login-system.sql
   ```

2. **Environment Configuration:**
   ```bash
   cd backend
   cp .env.production .env
   # Edit .env with your production database details
   ```

3. **Install Dependencies:**
   ```bash
   npm install --production
   ```

4. **Start Backend with PM2:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "child-health-backend"
   pm2 startup
   pm2 save
   ```

## Frontend Deployment Steps

1. **Build for Production:**
   ```bash
   npm run build:prod
   ```

2. **Serve with PM2:**
   ```bash
   pm2 serve dist 3000 --name "child-health-frontend"
   ```

## Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Environment Variables Checklist
- [ ] Update DB_HOST to production database
- [ ] Update DB_USER and DB_PASSWORD
- [ ] Change JWT_SECRET to secure value
- [ ] Set NODE_ENV=production
- [ ] Update FRONTEND_URL to production domain
- [ ] Update VITE_API_URL in frontend .env

## Security Checklist
- [ ] Use HTTPS in production
- [ ] Secure database with proper firewall rules
- [ ] Use strong JWT secret
- [ ] Enable database SSL if available
- [ ] Regular security updates

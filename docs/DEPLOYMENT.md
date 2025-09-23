# Deployment Guide for Aquatic Exotica

## Prerequisites

- Node.js v18 or higher
- PostgreSQL database
- Redis server
- Git

## Environment Variables

Create a `.env` file in the root directory:

```env
# Required
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-secure-session-secret

# Optional
SENDGRID_API_KEY=your-sendgrid-key
PORT=3000  # Default port, can be changed
```

## Deployment Steps

### 1. Local Testing

```bash
# Install dependencies
npm install

# Build for production
npm run deploy:build

# Start production server
npm run deploy:start
```

### 2. Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Configure Vercel:
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

3. Set environment variables in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add all required environment variables

### 3. Traditional VPS Deployment

1. Clone repository:
```bash
git clone https://github.com/yourusername/AquaticExotica.git
cd AquaticExotica
```

2. Install PM2:
```bash
npm install -g pm2
```

3. Setup application:
```bash
# Install dependencies
npm install

# Build for production
npm run deploy:build

# Start with PM2
pm2 start npm --name "aquatic-exotica" -- run deploy:start

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

4. Setup Nginx reverse proxy:
```nginx
server {
    listen 80;
    server_name aquaticexotica.com www.aquaticexotica.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. Setup SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d aquaticexotica.com -d www.aquaticexotica.com
```

### 4. Docker Deployment

1. Build Docker image:
```bash
docker build -t aquatic-exotica .
```

2. Run container:
```bash
docker run -d \
  --name aquatic-exotica \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your_database_url \
  -e REDIS_URL=your_redis_url \
  -e SESSION_SECRET=your_session_secret \
  aquatic-exotica
```

## Post-Deployment Checklist

- [ ] Verify database connection
- [ ] Check Redis connection
- [ ] Confirm HTTPS redirection
- [ ] Test user authentication
- [ ] Verify static asset serving
- [ ] Check API endpoints
- [ ] Monitor error logs
- [ ] Setup monitoring (optional)

## Monitoring

### Application Logs

```bash
# View PM2 logs
pm2 logs aquatic-exotica

# View last 1000 lines
pm2 logs aquatic-exotica --lines 1000
```

### Performance Monitoring

- Use PM2 monitoring:
```bash
pm2 monit
```

- Or integrate with external services:
  - New Relic
  - Datadog
  - Sentry

## Troubleshooting

### Common Issues

1. **Blank Pages**:
   - Check if `dist/index.html` exists
   - Verify static file serving configuration
   - Check console for JavaScript errors

2. **API 404 Errors**:
   - Verify API routes are registered
   - Check proxy configuration
   - Confirm server is running

3. **Database Connection Issues**:
   - Verify DATABASE_URL format
   - Check network connectivity
   - Confirm database permissions

4. **Redis Connection Issues**:
   - Verify REDIS_URL format
   - Check Redis server status
   - Confirm Redis connectivity

### Debug Mode

To enable debug logging:
```bash
DEBUG=* npm run deploy:start
```

## Rollback Procedure

1. Using Git:
```bash
# Get last working commit
git log

# Revert to specific commit
git checkout <commit-hash>

# Rebuild and restart
npm run deploy:build
pm2 restart aquatic-exotica
```

2. Using PM2:
```bash
# List previous processes
pm2 list

# Revert to previous version
pm2 revert aquatic-exotica
```

## Support

For deployment issues:
- Check server logs: `pm2 logs`
- Review application logs in `dist/logs/`
- Contact support: mahesh@aquaticexotica.com 
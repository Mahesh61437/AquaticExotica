# Environment Variables Setup Guide

This guide explains how to set up environment variables for the Aquatic Exotica project.

## Quick Start

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in your values**:
   - Open `.env` file
   - Replace placeholder values with your actual credentials
   - Never commit `.env` to version control

## Required Environment Variables

### Frontend Variables (Vite - must start with `VITE_`)

#### API Configuration
- `VITE_API_BASE` - Backend API base URL

#### Google Analytics 4
- `VITE_GA4_MEASUREMENT_ID` - GA4 Measurement ID (format: G-XXXXXXXXXX)
- `VITE_ENABLE_ANALYTICS` - Enable/disable analytics (true/false)

#### PayU Checkout Plus
- `VITE_PAYU_MERCHANT_KEY` - PayU Merchant Key (from PayU dashboard)
- `VITE_PAYU_MODE` - Environment mode: `sandbox` or `production`
- `VITE_PAYU_SUCCESS_URL` - URL path or full URL for success redirect (e.g., `/payment/success` or `https://yourdomain.com/payment/success`)
- `VITE_PAYU_FAILURE_URL` - URL path or full URL for failure redirect (e.g., `/payment/failure` or `https://yourdomain.com/payment/failure`)
- `VITE_PAYU_API_BASE` - PayU API base URL (optional, auto-detected based on mode)

**Note**: Success/Failure URLs can be:
- **Paths** (recommended): `/payment/success` - Will automatically use current domain
- **Full URLs**: `https://yourdomain.com/payment/success` - Use if you need a specific domain

### Backend Variables (Server-side only)

#### Server Configuration
- `NODE_ENV` - Node environment: `development` or `production`
- `PORT` - Server port (default: 3000)
- `SESSION_SECRET` - Secure random string for session encryption

#### Caddy Configuration (For reverse proxy)
- `CADDY_DOMAIN` - Domain name for Caddy to serve (default: `www.aquaticexotica.com`)
- `API_BASE` - Backend API URL for reverse proxy (set to same value as `VITE_API_BASE`, e.g., `https://web-production-b3867.up.railway.app`)

#### Database
- `DATABASE_URL` - PostgreSQL connection string

#### Redis
- `REDIS_URL` - Redis connection string

#### PayU (Backend Only)
- `PAYU_SALT` - **IMPORTANT**: PayU Salt (NEVER expose in frontend!)
  - This should only be used server-side for hash generation
  - Hash generation must be done on the backend for security

#### Email Service (Optional)
- `SENDGRID_API_KEY` - SendGrid API key for email notifications

## Security Notes

### ⚠️ Critical Security Rules

1. **Never commit `.env` to version control**
   - `.env` is already in `.gitignore`
   - Use `.env.example` as a template (safe to commit)

2. **PayU Salt Security**
   - Salt must NEVER be in frontend code
   - Salt should only be used server-side
   - Hash generation must be done on backend
   - Frontend should call backend API to get payment hash

3. **Environment Variable Naming**
   - Frontend variables must start with `VITE_` (Vite requirement)
   - Backend variables can use any naming convention
   - Use descriptive names

4. **Production Deployment**
   - Use production credentials in production environment
   - Never use sandbox/test credentials in production
   - Ensure all URLs use HTTPS in production

## Development vs Production

### Development
```env
VITE_PAYU_MODE=sandbox
NODE_ENV=development
```

### Production
```env
VITE_PAYU_MODE=production
NODE_ENV=production
```

## Testing Environment Variables

You can verify your environment variables are loaded correctly:

1. **Frontend**: Check browser console in development mode
   - PayU config will log if properly configured
   - Analytics config will log if properly configured

2. **Backend**: Check server logs
   - Environment variables should be loaded on server start

## Getting Credentials

### PayU Credentials
1. Sign up at [PayU India](https://payu.in/signup)
2. Complete KYC verification
3. Get Merchant Key and Salt from PayU dashboard
4. Use sandbox credentials for testing
5. Switch to production credentials when going live

### Google Analytics
1. Go to [Google Analytics](https://analytics.google.com)
2. Create GA4 property
3. Get Measurement ID from Admin > Data Streams

### Database
- Get connection string from your PostgreSQL provider
- Format: `postgresql://username:password@host:port/database`

## Troubleshooting

### Variables not loading?
- Ensure variable names start with `VITE_` for frontend
- Restart development server after changing `.env`
- Check for typos in variable names
- Verify `.env` file is in project root

### PayU not working?
- Verify `VITE_PAYU_MERCHANT_KEY` is set
- Check `VITE_PAYU_MODE` is correct (sandbox/production)
- Ensure success/failure URLs are accessible
- Verify backend has `PAYU_SALT` configured

### Analytics not tracking?
- Verify `VITE_GA4_MEASUREMENT_ID` is set
- Check `VITE_ENABLE_ANALYTICS` is `true`
- Ensure GA4 property is properly configured

## File Structure

```
AquaticExotica/
├── .env                 # Your actual environment variables (NOT in git)
├── .env.example         # Template file (safe to commit)
├── .gitignore           # Ensures .env is not committed
└── client/
    └── src/
        └── config/
            ├── analytics.ts  # Uses VITE_GA4_* variables
            └── payu.ts       # Uses VITE_PAYU_* variables
```

## Need Help?

- Check `.env.example` for all available variables
- See `PAYU_CHECKOUT_PLUS_IMPLEMENTATION.md` for PayU setup
- See `ANALYTICS_SETUP.md` for GA4 setup
- Review `docs/DEPLOYMENT.md` for deployment configuration


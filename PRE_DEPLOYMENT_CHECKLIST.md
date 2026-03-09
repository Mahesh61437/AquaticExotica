# Pre-Deployment Checklist for PayU Payment Integration

## 🎯 Overview

This checklist covers all steps needed before deploying PayU payment integration to production.

---

## 1. ✅ Environment Variables Setup

### Frontend Environment Variables

Create/update `.env` file in project root:

```env
# API Configuration
VITE_API_BASE=https://your-production-api-url.com

# PayU Frontend Configuration
VITE_PAYU_MERCHANT_KEY=your_production_merchant_key
VITE_PAYU_MODE=production
# URLs can be paths (recommended) or full URLs
# Paths will automatically use current domain
VITE_PAYU_SUCCESS_URL=/payment/success
VITE_PAYU_FAILURE_URL=/payment/failure
# Or use full URLs if needed:
# VITE_PAYU_SUCCESS_URL=https://yourdomain.com/payment/success
# VITE_PAYU_FAILURE_URL=https://yourdomain.com/payment/failure
```

**Important**: 
- Replace `your_production_merchant_key` with your actual PayU production merchant key
- Set `VITE_PAYU_MODE=production` (not `sandbox`)
- Use your actual production domain in URLs

### Backend Environment Variables

Update backend `.env` file:

```env
# PayU Backend Configuration
PAYU_MERCHANT_KEY=your_production_merchant_key
PAYU_MERCHANT_SALT=your_production_salt
PAYU_MODE=production
PAYU_BASE_URL=https://secure.payu.in/_payment
PAYU_SUCCESS_URL=https://yourdomain.com/payment/success
PAYU_FAILURE_URL=https://yourdomain.com/payment/failure
```

**Critical Security Notes**:
- ⚠️ **NEVER** expose `PAYU_MERCHANT_SALT` in frontend
- Salt must only be used server-side for hash generation
- Use production credentials (not sandbox/test credentials)

---

## 2. 🌐 URL Configuration

### Required URLs to Configure

#### Frontend URLs (in `.env`)
```env
# Recommended: Use paths (will auto-use current domain)
VITE_PAYU_SUCCESS_URL=/payment/success
VITE_PAYU_FAILURE_URL=/payment/failure

# Or use full URLs if you need a specific domain
# VITE_PAYU_SUCCESS_URL=https://yourdomain.com/payment/success
# VITE_PAYU_FAILURE_URL=https://yourdomain.com/payment/failure
```

#### Backend URLs (in backend `.env`)
```env
# Recommended: Use paths (backend constructs full URL from request)
PAYU_SUCCESS_URL=/payment/success
PAYU_FAILURE_URL=/payment/failure

# Or use full URLs if you need a specific domain
# PAYU_SUCCESS_URL=https://yourdomain.com/payment/success
# PAYU_FAILURE_URL=https://yourdomain.com/payment/failure
```

**Note**: 
- Using paths is more flexible - works across dev/staging/production
- Backend should construct full URLs from paths using request origin
- Frontend automatically combines paths with `window.location.origin`

#### PayU Dashboard Configuration

1. Login to [PayU Dashboard](https://dashboard.payu.in)
2. Go to **Settings** → **Integration** or **Merchant Settings**
3. Configure:
   - **Success URL**: `https://yourdomain.com/payment/success`
   - **Failure URL**: `https://yourdomain.com/payment/failure`
   - **Webhook URL**: `https://yourdomain.com/api/payments/webhook/`

**Important**: 
- All URLs must use `https://` (not `http://`)
- URLs must be publicly accessible
- No trailing slashes in URLs

---

## 3. 🔐 PayU Credentials

### Get Production Credentials

1. **Login to PayU Dashboard**
   - Go to https://dashboard.payu.in
   - Use your production account (not test account)

2. **Get Merchant Key**
   - Navigate to: **Settings** → **Merchant Key**
   - Copy your production Merchant Key

3. **Get Salt**
   - Navigate to: **Settings** → **Salt**
   - Copy your production Salt
   - ⚠️ **Keep this secret!** Never commit to version control

4. **Verify Credentials**
   - Test credentials in PayU test environment first
   - Ensure you're using production credentials (not sandbox)

---

## 4. 🔒 SSL/HTTPS Certificate

### Requirements

- ✅ **HTTPS is mandatory** for PayU in production
- ✅ Valid SSL certificate must be installed
- ✅ Certificate must not be expired
- ✅ Certificate must match your domain

### Verify SSL

```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Or use online tools
# https://www.ssllabs.com/ssltest/
```

### If Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (set up cron)
sudo certbot renew --dry-run
```

---

## 5. 🧪 Backend API Endpoints

### Verify Backend Endpoints are Implemented

Ensure these endpoints exist and are working:

#### 1. Payment Initiation Endpoint
- **URL**: `POST /api/payments/initiate/<order_id>/`
- **Auth**: JWT Bearer token required
- **Response**: Payment parameters with hash

#### 2. Payment Webhook Endpoint
- **URL**: `POST /api/payments/webhook/`
- **Auth**: None (PayU calls directly)
- **Purpose**: Handle payment callbacks

### Test Endpoints

```bash
# Test payment initiation (replace with actual values)
curl -X POST https://your-api.com/api/payments/initiate/123/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Should return payment parameters
```

---

## 6. 📋 PayU Dashboard Configuration

### Webhook Setup

1. **Login to PayU Dashboard**
2. Go to **Settings** → **Webhooks** or **Callbacks**
3. **Add Webhook URL**:
   ```
   https://yourdomain.com/api/payments/webhook/
   ```
4. **Enable Webhook Notifications**
5. **Test Webhook Delivery**
   - PayU should send a test webhook
   - Verify your backend receives it
   - Check backend logs

### Payment Methods

1. **Enable Payment Methods**:
   - Credit/Debit Cards
   - Net Banking
   - UPI
   - Wallets
   - EMI (if needed)
   - BNPL (if needed)

2. **Configure Payment Limits** (if applicable)

---

## 7. 🧪 Testing Checklist

### Pre-Production Testing

- [ ] Test payment flow in PayU sandbox
- [ ] Test successful payment scenario
- [ ] Test failed payment scenario
- [ ] Test cancelled payment scenario
- [ ] Verify order status updates correctly
- [ ] Test webhook callbacks
- [ ] Verify hash generation and verification
- [ ] Test error handling
- [ ] Test on different browsers
- [ ] Test on mobile devices

### Test Scenarios

1. **Successful Payment**:
   - Create order → Initiate payment → Complete payment → Verify order status

2. **Failed Payment**:
   - Create order → Initiate payment → Fail payment → Verify error handling

3. **Cancelled Payment**:
   - Create order → Initiate payment → Cancel → Verify order status

4. **Network Issues**:
   - Test timeout handling
   - Test retry logic

---

## 8. 📊 Monitoring & Logging

### Set Up Monitoring

1. **Error Logging**:
   - Log all payment initiation attempts
   - Log all payment callbacks
   - Log hash verification failures
   - Log order status updates

2. **Analytics**:
   - Track payment success rate
   - Track payment failure reasons
   - Monitor average payment time

3. **Alerts**:
   - Set up alerts for payment failures
   - Monitor webhook delivery failures
   - Track hash verification failures

---

## 9. 🔄 Database & Order Status

### Verify Order Status Flow

Ensure your backend handles these order statuses:

- `pending` - Order created, payment pending
- `paid` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled

### Database Updates

- [ ] Verify order table has payment status field
- [ ] Verify order status updates on webhook
- [ ] Test order status queries
- [ ] Verify order history tracking

---

## 10. 📧 Email Notifications

### Configure Email Notifications (Optional)

- [ ] Order confirmation email
- [ ] Payment success email
- [ ] Payment failure email
- [ ] Order status update emails

---

## 11. 🚀 Deployment Steps

### Frontend Deployment

1. **Build for Production**:
   ```bash
   npm run build
   ```

2. **Verify Build**:
   - Check `dist/` folder exists
   - Verify all assets are included
   - Test production build locally:
     ```bash
     npm run preview
     ```

3. **Deploy to Hosting**:
   - Deploy `dist/` folder to your hosting provider
   - Configure environment variables on hosting platform
   - Set up custom domain
   - Configure SSL certificate

### Backend Deployment

1. **Update Environment Variables**:
   - Set production PayU credentials
   - Update success/failure URLs
   - Configure webhook URL

2. **Deploy Backend**:
   - Deploy to your hosting platform (Railway, AWS, etc.)
   - Verify environment variables are set
   - Test API endpoints are accessible

3. **Verify Deployment**:
   - Test payment initiation endpoint
   - Test webhook endpoint accessibility
   - Check logs for errors

---

## 12. ✅ Final Verification

### Pre-Launch Checklist

- [ ] All environment variables set correctly
- [ ] Production PayU credentials configured
- [ ] Success/failure URLs are correct and accessible
- [ ] SSL certificate installed and valid
- [ ] Backend endpoints are working
- [ ] Webhook URL configured in PayU dashboard
- [ ] Payment methods enabled in PayU dashboard
- [ ] Tested payment flow end-to-end
- [ ] Error handling tested
- [ ] Monitoring and logging set up
- [ ] Database order status flow verified
- [ ] Frontend build successful
- [ ] Backend deployed and accessible
- [ ] All URLs use HTTPS
- [ ] No test/sandbox credentials in production

### Post-Deployment Testing

1. **Test Real Payment** (with small amount):
   - Create test order
   - Complete payment with real card (small amount)
   - Verify order status updates
   - Verify webhook received
   - Check email notifications (if configured)

2. **Monitor First Transactions**:
   - Watch payment logs
   - Monitor error rates
   - Check webhook delivery
   - Verify order status updates

---

## 13. 🔧 Troubleshooting

### Common Issues

1. **Payment Not Initiating**:
   - Check backend API is accessible
   - Verify JWT token is valid
   - Check backend logs for errors
   - Verify PayU credentials are correct

2. **Webhook Not Received**:
   - Verify webhook URL is correct in PayU dashboard
   - Check backend endpoint is accessible
   - Verify SSL certificate is valid
   - Check firewall/security settings

3. **Hash Verification Failing**:
   - Verify salt is correct
   - Check parameter order in hash generation
   - Verify amount formatting
   - Check backend logs for hash details

4. **Redirect Not Working**:
   - Verify success/failure URLs are correct
   - Check URLs are accessible
   - Verify HTTPS is used
   - Check browser console for errors

---

## 14. 📝 Documentation

### Update Documentation

- [ ] Update API documentation
- [ ] Document payment flow
- [ ] Create troubleshooting guide
- [ ] Document environment variables
- [ ] Update deployment guide

---

## 15. 🔐 Security Checklist

- [ ] Salt never exposed in frontend
- [ ] All API calls use HTTPS
- [ ] JWT tokens properly secured
- [ ] Environment variables not committed to git
- [ ] Webhook endpoint validates hash
- [ ] Order amount validation implemented
- [ ] Rate limiting on payment endpoints
- [ ] Error messages don't expose sensitive data

---

## 16. 📞 Support & Contacts

### PayU Support

- **PayU Support**: https://payu.in/support
- **PayU Documentation**: https://docs.payu.in
- **PayU Dashboard**: https://dashboard.payu.in

### Internal Contacts

- Backend Developer: [Your contact]
- Frontend Developer: [Your contact]
- DevOps: [Your contact]

---

## 🎯 Quick Deployment Checklist

### Must Do Before Deploying

1. ✅ Set production PayU credentials
2. ✅ Configure production URLs (success/failure)
3. ✅ Install SSL certificate
4. ✅ Update PayU dashboard with webhook URL
5. ✅ Test payment flow in sandbox
6. ✅ Verify backend endpoints are working
7. ✅ Build and deploy frontend
8. ✅ Deploy backend with production env vars
9. ✅ Test real payment (small amount)
10. ✅ Monitor first transactions

---

## 📋 Environment Variables Template

### Frontend `.env` (Production)

```env
# API
VITE_API_BASE=https://your-production-api.com

# PayU
VITE_PAYU_MERCHANT_KEY=YOUR_PRODUCTION_MERCHANT_KEY
VITE_PAYU_MODE=production
VITE_PAYU_SUCCESS_URL=https://yourdomain.com/payment/success
VITE_PAYU_FAILURE_URL=https://yourdomain.com/payment/failure
```

### Backend `.env` (Production)

```env
# PayU
PAYU_MERCHANT_KEY=YOUR_PRODUCTION_MERCHANT_KEY
PAYU_MERCHANT_SALT=YOUR_PRODUCTION_SALT
PAYU_MODE=production
PAYU_BASE_URL=https://secure.payu.in/_payment
PAYU_SUCCESS_URL=https://yourdomain.com/payment/success
PAYU_FAILURE_URL=https://yourdomain.com/payment/failure
```

---

**Status**: Ready for deployment once all checklist items are completed.

**Next Steps**: Start with environment variables and URL configuration, then proceed with testing and deployment.


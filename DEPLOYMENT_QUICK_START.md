# PayU Payment Integration - Quick Deployment Guide

## 🚀 Essential Steps Before Deploying

### Step 1: Get PayU Production Credentials

1. Login to [PayU Dashboard](https://dashboard.payu.in)
2. Get your **Production Merchant Key**
3. Get your **Production Salt** (keep secret!)
4. Note: Use production credentials, NOT sandbox/test credentials

---

### Step 2: Configure Environment Variables

#### Frontend `.env` File

Create/update `.env` in project root:

```env
# API Configuration
VITE_API_BASE=https://web-production-b3867.up.railway.app

# PayU Configuration (Production)
VITE_PAYU_MERCHANT_KEY=your_production_merchant_key_here
VITE_PAYU_MODE=production
# Use paths (recommended) - automatically uses current domain
VITE_PAYU_SUCCESS_URL=/payment/success
VITE_PAYU_FAILURE_URL=/payment/failure
```

**Replace**:
- `your_production_merchant_key_here` → Your actual PayU production merchant key
- `yourdomain.com` → Your actual production domain

#### Backend `.env` File

Update backend `.env`:

```env
# PayU Backend (Production)
PAYU_MERCHANT_KEY=your_production_merchant_key_here
PAYU_MERCHANT_SALT=your_production_salt_here
PAYU_MODE=production
PAYU_BASE_URL=https://secure.payu.in/_payment
# Use paths (recommended) - backend constructs full URL from request
PAYU_SUCCESS_URL=/payment/success
PAYU_FAILURE_URL=/payment/failure
```

**⚠️ CRITICAL**: Salt must NEVER be in frontend code!

---

### Step 3: Configure PayU Dashboard

1. **Login**: https://dashboard.payu.in
2. **Go to**: Settings → Integration (or Merchant Settings)
3. **Set URLs**:
   - Success URL: `https://yourdomain.com/payment/success`
   - Failure URL: `https://yourdomain.com/payment/failure`
   - Webhook URL: `https://yourdomain.com/api/payments/webhook/`
4. **Enable Payment Methods**: Cards, UPI, Net Banking, etc.

---

### Step 4: Verify SSL/HTTPS

- ✅ **HTTPS is mandatory** for PayU production
- ✅ Install valid SSL certificate
- ✅ All URLs must use `https://` (not `http://`)
- ✅ Certificate must match your domain

**Check SSL**:
```bash
# Verify SSL certificate
curl -I https://yourdomain.com
```

---

### Step 5: Verify Backend Endpoints

Ensure these endpoints are implemented and working:

1. **Payment Initiation**: `POST /api/payments/initiate/<order_id>/`
   - Requires JWT authentication
   - Returns payment parameters with hash

2. **Payment Webhook**: `POST /api/payments/webhook/`
   - No authentication (PayU calls directly)
   - Handles payment callbacks
   - Updates order status

**Test Endpoints**:
```bash
# Test payment initiation
curl -X POST https://your-api.com/api/payments/initiate/123/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

### Step 6: Pre-Deployment Testing

#### Test in Sandbox First

1. **Use Sandbox Credentials**:
   ```env
   VITE_PAYU_MODE=sandbox
   PAYU_MODE=sandbox
   PAYU_BASE_URL=https://test.payu.in/_payment
   ```

2. **Test Scenarios**:
   - ✅ Successful payment
   - ✅ Failed payment
   - ✅ Cancelled payment
   - ✅ Webhook delivery
   - ✅ Order status updates

3. **Switch to Production**:
   - Update all credentials to production
   - Change `MODE` to `production`
   - Update `PAYU_BASE_URL` to `https://secure.payu.in/_payment`

---

### Step 7: Build and Deploy

#### Frontend

```bash
# Build for production
npm run build

# Verify build
npm run preview

# Deploy dist/ folder to your hosting
```

#### Backend

1. Update environment variables on hosting platform
2. Deploy backend code
3. Verify endpoints are accessible
4. Test webhook endpoint

---

### Step 8: Post-Deployment Verification

1. **Test Real Payment** (small amount):
   - Create test order
   - Complete payment
   - Verify order status updates
   - Check webhook received

2. **Monitor**:
   - Payment logs
   - Error rates
   - Webhook delivery
   - Order status updates

---

## 📋 Quick Checklist

### Before Deploying

- [ ] Production PayU credentials obtained
- [ ] Frontend `.env` configured with production values
- [ ] Backend `.env` configured with production values
- [ ] PayU dashboard URLs configured
- [ ] SSL certificate installed and valid
- [ ] Backend endpoints implemented and tested
- [ ] Webhook URL configured in PayU dashboard
- [ ] Payment methods enabled in PayU dashboard
- [ ] Tested in sandbox environment
- [ ] All URLs use HTTPS
- [ ] No test/sandbox credentials in production

### After Deploying

- [ ] Test real payment (small amount)
- [ ] Verify order status updates
- [ ] Check webhook delivery
- [ ] Monitor error logs
- [ ] Verify email notifications (if configured)

---

## 🔗 Important URLs

### PayU URLs

- **Production**: `https://secure.payu.in/_payment`
- **Sandbox**: `https://test.payu.in/_payment`
- **Dashboard**: https://dashboard.payu.in
- **Support**: https://payu.in/support
- **Documentation**: https://docs.payu.in

### Your URLs (Replace with actual domain)

- **Success**: `https://yourdomain.com/payment/success`
- **Failure**: `https://yourdomain.com/payment/failure`
- **Webhook**: `https://yourdomain.com/api/payments/webhook/`

---

## ⚠️ Security Reminders

1. **Never commit `.env` files** to version control
2. **Salt must be server-side only** - never in frontend
3. **Use HTTPS everywhere** - PayU requires it
4. **Validate all payment data** on backend
5. **Verify hash on webhook** - never trust without verification

---

## 🆘 Troubleshooting

### Payment Not Working?

1. Check environment variables are set
2. Verify PayU credentials are correct
3. Check backend API is accessible
4. Verify SSL certificate is valid
5. Check PayU dashboard configuration
6. Review backend logs for errors

### Webhook Not Received?

1. Verify webhook URL in PayU dashboard
2. Check backend endpoint is accessible
3. Verify SSL certificate
4. Check firewall/security settings
5. Test webhook endpoint manually

---

## 📞 Support

- **PayU Support**: https://payu.in/support
- **PayU Docs**: https://docs.payu.in/docs/checkout-plus-integration
- **Backend API Guide**: See `BACKEND_PAYU_API.md`
- **Full Checklist**: See `PRE_DEPLOYMENT_CHECKLIST.md`

---

**Ready to deploy?** Complete the checklist above and you're good to go! 🚀


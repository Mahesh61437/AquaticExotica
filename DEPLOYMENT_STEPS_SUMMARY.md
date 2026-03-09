# Pre-Deployment Steps Summary

## 🎯 Critical Steps Before Deploying PayU Payment Integration

### 1. ✅ Get PayU Production Credentials

**Action Required**:
- [ ] Login to PayU Dashboard: https://dashboard.payu.in
- [ ] Get **Production Merchant Key**
- [ ] Get **Production Salt** (keep secret!)
- [ ] Verify you're using production account (not test)

---

### 2. ✅ Configure Environment Variables

#### Frontend `.env` (Project Root)

```env
VITE_API_BASE=https://web-production-b3867.up.railway.app
VITE_PAYU_MERCHANT_KEY=YOUR_PRODUCTION_MERCHANT_KEY
VITE_PAYU_MODE=production
# Use paths (recommended) - will auto-use current domain
VITE_PAYU_SUCCESS_URL=/payment/success
VITE_PAYU_FAILURE_URL=/payment/failure
```

**Replace**:
- `YOUR_PRODUCTION_MERCHANT_KEY` → Your actual PayU production merchant key
- `yourdomain.com` → Your actual production domain

#### Backend `.env` (Backend Server)

```env
PAYU_MERCHANT_KEY=YOUR_PRODUCTION_MERCHANT_KEY
PAYU_MERCHANT_SALT=YOUR_PRODUCTION_SALT
PAYU_MODE=production
PAYU_BASE_URL=https://secure.payu.in/_payment
# Use paths (recommended) - backend constructs full URL from request
PAYU_SUCCESS_URL=/payment/success
PAYU_FAILURE_URL=/payment/failure
```

**⚠️ CRITICAL**: Salt must NEVER be in frontend!

---

### 3. ✅ Configure PayU Dashboard

**URLs to Set**:
1. **Success URL**: `https://yourdomain.com/payment/success`
2. **Failure URL**: `https://yourdomain.com/payment/failure`
3. **Webhook URL**: `https://yourdomain.com/api/payments/webhook/`

**Steps**:
1. Login to https://dashboard.payu.in
2. Go to **Settings** → **Integration**
3. Enter the URLs above
4. Enable webhook notifications
5. Enable payment methods (Cards, UPI, Net Banking, etc.)

---

### 4. ✅ SSL/HTTPS Certificate

**Requirements**:
- ✅ HTTPS is **mandatory** for PayU production
- ✅ Valid SSL certificate must be installed
- ✅ Certificate must match your domain
- ✅ All URLs must use `https://`

**Verify**:
```bash
curl -I https://yourdomain.com
```

---

### 5. ✅ Verify Backend Endpoints

**Required Endpoints**:

1. **Payment Initiation**: `POST /api/payments/initiate/<order_id>/`
   - Must require JWT authentication
   - Must return payment parameters with hash

2. **Payment Webhook**: `POST /api/payments/webhook/`
   - Must be publicly accessible
   - Must verify hash from PayU
   - Must update order status

**Test**:
```bash
# Test payment initiation
curl -X POST https://your-api.com/api/payments/initiate/123/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 6. ✅ Pre-Deployment Testing

**Test in Sandbox First**:

1. Use sandbox credentials
2. Set `VITE_PAYU_MODE=sandbox`
3. Test complete payment flow
4. Verify webhook delivery
5. Check order status updates

**Then Switch to Production**:
- Update all credentials
- Set `MODE=production`
- Update `PAYU_BASE_URL` to `https://secure.payu.in/_payment`

---

### 7. ✅ Build and Deploy

#### Frontend
```bash
npm run build
# Deploy dist/ folder
```

#### Backend
- Deploy with production environment variables
- Verify endpoints are accessible
- Test webhook endpoint

---

### 8. ✅ Post-Deployment Verification

1. Test real payment (small amount)
2. Verify order status updates
3. Check webhook received
4. Monitor error logs
5. Verify email notifications (if configured)

---

## 📋 Quick Checklist

### Must Do
- [ ] Production PayU credentials obtained
- [ ] Frontend `.env` configured
- [ ] Backend `.env` configured
- [ ] PayU dashboard URLs set
- [ ] SSL certificate installed
- [ ] Backend endpoints working
- [ ] Webhook configured
- [ ] Tested in sandbox
- [ ] All URLs use HTTPS

### After Deploy
- [ ] Test real payment
- [ ] Monitor logs
- [ ] Verify webhooks
- [ ] Check order status

---

## 🔗 Important URLs

**Your Production URLs** (replace `yourdomain.com`):
- Success: `https://yourdomain.com/payment/success`
- Failure: `https://yourdomain.com/payment/failure`
- Webhook: `https://yourdomain.com/api/payments/webhook/`

**PayU URLs**:
- Production: `https://secure.payu.in/_payment`
- Dashboard: https://dashboard.payu.in
- Support: https://payu.in/support

---

## 📚 Documentation

- **Full Checklist**: `PRE_DEPLOYMENT_CHECKLIST.md`
- **Quick Start**: `DEPLOYMENT_QUICK_START.md`
- **Environment Setup**: `ENV_SETUP.md`
- **Backend API**: `BACKEND_PAYU_API.md`

---

**Ready?** Complete the checklist and deploy! 🚀


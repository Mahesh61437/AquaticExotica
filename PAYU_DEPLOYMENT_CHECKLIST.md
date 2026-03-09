# PayU Integration - Deployment Readiness Checklist

## ✅ Frontend Implementation Status

### Completed ✅
- [x] PayU service utility (`client/src/lib/payu-service.ts`)
  - [x] `initiatePayUPayment()` - Calls backend API
  - [x] `getPaymentStatus()` - Fetches payment status
  - [x] `redirectToPayU()` - Creates and submits form to PayU
  - [x] `processPayUPayment()` - Complete payment flow
  - [x] TypeScript interfaces match API spec

- [x] Checkout form integration (`client/src/components/checkout/CheckoutForm.tsx`)
  - [x] Order creation
  - [x] Automatic payment initiation after order
  - [x] Error handling for payment initiation failures
  - [x] Cart clearing after order creation

- [x] Payment success page (`client/src/pages/PaymentSuccess.tsx`)
  - [x] Extracts parameters from PayU redirect
  - [x] Fetches payment status from backend
  - [x] Fetches order details
  - [x] Displays payment confirmation
  - [x] Navigation buttons

- [x] Payment failure page (`client/src/pages/PaymentFailure.tsx`)
  - [x] Extracts error details from PayU redirect
  - [x] Fetches payment status from backend
  - [x] Displays error message
  - [x] Retry payment option
  - [x] Support contact information

- [x] Routes (`client/src/App.tsx`)
  - [x] `/payment/success` route
  - [x] `/payment/failure` route

---

## ⚠️ Backend Implementation Required

### Critical - Must Implement Before Deployment

#### 1. Payment Initiation Endpoint
```
POST /api/payments/initiate/<order_id>/
```
**Status**: ⚠️ **NOT IMPLEMENTED** - Required for payment flow

**Required Implementation**:
- [ ] Fetch order from database by `order_id`
- [ ] Verify order belongs to authenticated user
- [ ] Check order status (prevent duplicate payments)
- [ ] Extract customer info from order's shipping address
- [ ] Calculate amount from order (grandTotal or total + shipping)
- [ ] Generate product info from order items
- [ ] Generate SHA-512 hash using PayU formula
- [ ] Construct success/failure URLs
- [ ] Return payment parameters in correct format

**Response Format**:
```json
{
  "key": "merchant_key",
  "txnid": "transaction_id",
  "amount": "1500.00",
  "productinfo": "Order #42",
  "firstname": "John",
  "email": "john@example.com",
  "phone": "9876543210",
  "hash": "sha512_hash",
  "surl": "https://yoursite.com/payment/success",
  "furl": "https://yoursite.com/payment/failure",
  "payu_url": "https://test.payu.in/_payment"
}
```

#### 2. Payment Status Endpoint
```
GET /api/payments/status/<order_id>/
```
**Status**: ⚠️ **NOT IMPLEMENTED** - Required for payment status display

**Required Implementation**:
- [ ] Fetch payment record from database by `order_id`
- [ ] Verify payment belongs to authenticated user
- [ ] Return payment status with all details

**Response Format**:
```json
{
  "id": 1,
  "txnid": "a1b2c3d4e5f6g7h8i9j0",
  "order_id": 42,
  "user_email": "john@example.com",
  "amount": "1500.00",
  "status": "success",
  "verified": true,
  "phone": "9876543210",
  "mihpayid": "403993715524357839",
  "mode": "CC",
  "created_at": "2026-01-20T15:30:00Z",
  "updated_at": "2026-01-20T15:32:00Z"
}
```

#### 3. Payment Callback Endpoint (Webhook)
```
POST /api/payments/callback/
```
**Status**: ⚠️ **NOT IMPLEMENTED** - Critical for order status updates

**Required Implementation**:
- [ ] Accept form-encoded POST request from PayU
- [ ] Extract payment parameters (status, txnid, amount, hash, etc.)
- [ ] Verify hash using reverse order formula (case-sensitive)
- [ ] Create/update payment record in database
- [ ] Update order status based on payment result
- [ ] Handle duplicate webhook calls (idempotency)
- [ ] Return appropriate response to PayU

**Important**: 
- Must disable CSRF for this endpoint
- Hash verification is critical for security
- This is the PRIMARY source of truth for payment status

---

## 📋 Backend Database Requirements

### Payment Model/Table
Create a Payment model to store payment records:

**Required Fields**:
- `id` (primary key)
- `txnid` (transaction ID, unique)
- `order_id` (foreign key to Order)
- `user_email` (customer email)
- `amount` (decimal)
- `status` (string: initiated, pending, success, failure, cancelled, refunded)
- `verified` (boolean)
- `phone` (string)
- `mihpayid` (PayU payment ID, nullable)
- `mode` (payment mode: CC, UPI, etc., nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Order Model Updates
Ensure Order model has:
- `payment_status` (string: pending, completed, failed)
- `payment_transaction_id` (string, nullable)
- `payment_amount` (decimal, nullable)

---

## 🔐 Environment Variables Required

### Backend Environment Variables
```env
# PayU Credentials (REQUIRED)
PAYU_MERCHANT_KEY=your_merchant_key_here
PAYU_SALT=your_salt_here  # MUST be kept secret!

# PayU Configuration
PAYU_MODE=sandbox  # or 'production'
PAYU_SUCCESS_URL=/payment/success  # or full URL
PAYU_FAILURE_URL=/payment/failure  # or full URL
PAYU_BASE_URL=https://test.payu.in/_payment  # or https://secure.payu.in/_payment for production
```

**Status**: ⚠️ **MUST BE CONFIGURED** before deployment

---

## 🧪 Testing Requirements

### Before Production Deployment

#### 1. Sandbox Testing
- [ ] Get PayU sandbox credentials (Merchant Key & Salt)
- [ ] Test payment initiation endpoint
- [ ] Test successful payment flow
- [ ] Test failed payment flow
- [ ] Test webhook callback
- [ ] Verify hash generation
- [ ] Verify hash verification
- [ ] Test payment status endpoint

#### 2. Test Scenarios
- [ ] Successful card payment
- [ ] Failed card payment
- [ ] UPI payment
- [ ] Payment cancellation
- [ ] Duplicate payment prevention
- [ ] Webhook retry handling

#### 3. PayU Dashboard Configuration
- [ ] Configure webhook URL in PayU dashboard
- [ ] Test webhook delivery
- [ ] Verify webhook receives callbacks

---

## 🚀 Deployment Readiness

### Can Deploy Frontend? ✅ YES
- Frontend implementation is complete
- All routes are configured
- Error handling is in place
- Payment flow is integrated

### Can Deploy Backend? ⚠️ NO - Must Implement First
- Payment initiation endpoint: **NOT IMPLEMENTED**
- Payment status endpoint: **NOT IMPLEMENTED**
- Payment callback/webhook endpoint: **NOT IMPLEMENTED**
- Payment model/table: **NOT CREATED**
- Environment variables: **NOT CONFIGURED**

---

## 📝 Deployment Steps

### Step 1: Backend Implementation (REQUIRED)
1. Create Payment model/table
2. Implement `POST /api/payments/initiate/<order_id>/` endpoint
3. Implement `GET /api/payments/status/<order_id>/` endpoint
4. Implement `POST /api/payments/callback/` endpoint (webhook)
5. Add PayU environment variables
6. Test all endpoints in sandbox

### Step 2: PayU Dashboard Configuration
1. Log in to PayU dashboard
2. Get sandbox credentials (Merchant Key & Salt)
3. Configure webhook URL: `https://yourdomain.com/api/payments/callback/`
4. Test webhook delivery

### Step 3: Frontend Deployment
1. Build frontend: `npm run build`
2. Deploy to hosting (Railway, etc.)
3. Verify routes are accessible

### Step 4: Testing
1. Test complete payment flow in sandbox
2. Verify webhook receives callbacks
3. Verify order status updates correctly
4. Test error scenarios

### Step 5: Production Switch
1. Get production credentials from PayU
2. Update environment variables:
   - `PAYU_MODE=production`
   - `PAYU_MERCHANT_KEY=<production_key>`
   - `PAYU_SALT=<production_salt>`
   - `PAYU_BASE_URL=https://secure.payu.in/_payment`
3. Update webhook URL in PayU dashboard
4. Test with small real transaction

---

## ⚠️ Critical Notes

1. **Backend APIs are NOT implemented** - Payment will fail without them
2. **Environment variables must be set** - Payment initiation will fail without credentials
3. **Webhook must be configured** - Order status won't update without webhook
4. **Hash verification is critical** - Never skip hash verification in webhook
5. **Test in sandbox first** - Always test before going to production

---

## 📚 Documentation

All implementation details are in:
- `PAYU_BACKEND_API_REQUIREMENTS.md` - Complete backend API specifications
- `PAYU_PAYMENT_STATUS_FLOW.md` - Payment status flow explanation
- Code examples and hash generation formulas included

---

## Summary

**Frontend**: ✅ Ready to deploy
**Backend**: ⚠️ Must implement 3 endpoints before deployment
**Configuration**: ⚠️ Must configure environment variables
**Testing**: ⚠️ Must test in sandbox before production

**Recommendation**: Implement backend APIs first, then deploy and test in sandbox before going live.


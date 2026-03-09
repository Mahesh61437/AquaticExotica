# PayU Payment Gateway - Backend API Requirements

This document lists all the backend APIs needed for PayU hosted checkout integration.

## Overview

PayU hosted checkout integration requires:
1. **Payment Initiation API** - Generate payment hash and return payment parameters
2. **Payment Callback API** - Handle payment response from PayU and update order status
3. **Order Status Update** - Update order payment status based on payment result

---

## 1. Payment Initiation Endpoint

### Endpoint
```
POST /api/payments/initiate/<order_id>/
```

### Authentication
- **Required**: Yes (JWT Bearer token)
- User must be authenticated to initiate payment
- Backend must verify that the order belongs to the authenticated user

### URL Parameters
- `order_id` (integer, required): The order ID in the URL path

### Request Body
```json
{}
```
**Note**: No request body needed. Backend fetches all required information from the order in the database.

### Backend Implementation Requirements
1. **Fetch Order from Database**: 
   - Get order by `order_id` from URL
   - Verify order belongs to authenticated user
   - Verify order exists and is in valid state for payment

2. **Extract Customer Information**:
   - Get customer info from order's shipping address
   - Extract `first_name` from `recipient_name` field
   - Extract `email` from order's user email or shipping address
   - Extract `phone` from shipping address `recipient_phone`

3. **Calculate Amount**:
   - Get `grandTotal` from order (or calculate: subtotal + shipping_cost)
   - Format to 2 decimal places

4. **Generate Product Info**:
   - Create product description from order items
   - Format: `"Order #<order_id> - <item_count> item(s)"` or similar

### Success Response (200 OK)
```json
{
  "key": "7PdoB0",
  "txnid": "a1b2c3d4e5f6g7h8i9j0",
  "amount": "1500.00",
  "productinfo": "Order #42",
  "firstname": "John",
  "email": "john@example.com",
  "phone": "9876543210",
  "hash": "abc123def456789...",
  "surl": "https://yoursite.com/payment/success",
  "furl": "https://yoursite.com/payment/failure",
  "payu_url": "https://test.payu.in/_payment"
}
```

### Error Responses

| Status | Response | Reason |
|--------|----------|--------|
| 400 | `{"error": "Order is in 'processing' status and cannot be paid"}` | Order already paid/processing |
| 400 | `{"error": "Order already has a successful payment"}` | Duplicate payment attempt |
| 401 | `{"detail": "Authentication credentials were not provided."}` | Missing JWT token |
| 404 | `{"detail": "Not found."}` | Order doesn't exist or doesn't belong to user |

### Implementation Requirements

#### 1. Hash Generation Formula
```
hashString = key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
hash = SHA512(hashString)
```

**Important Notes:**
- Use pipe (`|`) as separator
- Empty UDF fields should still have pipes (10 empty pipes)
- Order of parameters is critical
- Amount should be formatted to 2 decimal places (e.g., "1500.00")
- Transaction ID (`txnid`) can be the order_id as string

#### 2. Environment Variables Required
```env
PAYU_MERCHANT_KEY=your_merchant_key_here
PAYU_SALT=your_salt_here  # MUST be kept secret, server-side only
PAYU_MODE=sandbox  # or 'production'
PAYU_SUCCESS_URL=/payment/success  # Can be path or full URL
PAYU_FAILURE_URL=/payment/failure  # Can be path or full URL
PAYU_BASE_URL=https://test.payu.in/_payment  # or https://secure.payu.in/_payment for production
```

#### 3. URL Construction
- If `PAYU_SUCCESS_URL` and `PAYU_FAILURE_URL` are paths (start with `/`), construct full URLs using request origin
- If they are full URLs (start with `http`), use them as-is
- Example:
  ```python
  def build_full_url(path_or_url: str, request) -> str:
      if path_or_url.startswith('http'):
          return path_or_url
      scheme = request.scheme  # 'http' or 'https'
      host = request.get_host()  # 'yourdomain.com'
      path = path_or_url if path_or_url.startswith('/') else '/' + path_or_url
      return f"{scheme}://{host}{path}"
  ```

#### 4. Example Implementation (Python/Django)
```python
import hashlib
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import json

def generate_payu_hash(key, txnid, amount, productinfo, firstname, email, salt):
    """Generate SHA-512 hash for PayU payment"""
    amount_str = f"{float(amount):.2f}"
    hash_string = (
        f"{key}|{txnid}|{amount_str}|{productinfo}|{firstname}|{email}"
        f"||||||||||{salt}"
    )
    return hashlib.sha512(hash_string.encode('utf-8')).hexdigest()

def build_full_url(path_or_url: str, request) -> str:
    """Build full URL from path or return full URL as-is"""
    if path_or_url.startswith('http'):
        return path_or_url
    scheme = request.scheme
    host = request.get_host()
    path = path_or_url if path_or_url.startswith('/') else '/' + path_or_url
    return f"{scheme}://{host}{path}"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request, order_id):
    """Initiate PayU payment and return payment parameters
    Backend fetches order and customer info from database
    """
    try:
        # Get credentials from environment
        key = os.getenv('PAYU_MERCHANT_KEY')
        salt = os.getenv('PAYU_SALT')
        payu_base_url = os.getenv('PAYU_BASE_URL', 'https://test.payu.in/_payment')
        
        # Get success/failure URLs
        success_url_env = os.getenv('PAYU_SUCCESS_URL', '/payment/success')
        failure_url_env = os.getenv('PAYU_FAILURE_URL', '/payment/failure')
        
        # Build full URLs
        surl = build_full_url(success_url_env, request)
        furl = build_full_url(failure_url_env, request)
        
        # Fetch order from database and verify ownership
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Order not found or access denied'
            }, status=404)
        
        # Verify order is in valid state for payment
        if order.payment_status == 'completed':
            return JsonResponse({
                'success': False,
                'message': 'Order already paid'
            }, status=400)
        
        # Extract customer information from order
        shipping_address = order.shipping_address
        if not shipping_address:
            return JsonResponse({
                'success': False,
                'message': 'Shipping address not found for order'
            }, status=400)
        
        # Get first name from recipient_name (first word)
        recipient_name = shipping_address.recipient_name or ''
        first_name = recipient_name.split(' ')[0] if recipient_name else ''
        
        # Get email (prefer user email, fallback to shipping address email)
        email = request.user.email or shipping_address.recipient_email or ''
        if not email:
            return JsonResponse({
                'success': False,
                'message': 'Email not found for order'
            }, status=400)
        
        # Get phone from shipping address
        phone = shipping_address.recipient_phone or ''
        if not phone:
            return JsonResponse({
                'success': False,
                'message': 'Phone number not found for order'
            }, status=400)
        
        # Calculate amount from order
        amount = float(order.grandTotal) if hasattr(order, 'grandTotal') else (
            float(order.total) + float(order.shipping_cost or 0)
        )
        amount_str = f"{amount:.2f}"
        
        # Generate product info from order items
        item_count = order.items.count() if hasattr(order.items, 'count') else len(order.items)
        product_info = f"Order #{order_id} - {item_count} item(s)"
        
        # Generate transaction ID (use order_id)
        txnid = str(order_id)
        
        # Generate hash
        hash_value = generate_payu_hash(
            key, txnid, amount_str, product_info,
            first_name, email, salt
        )
        
        # Return payment parameters (matching API spec)
        return JsonResponse({
            'key': key,
            'txnid': txnid,
            'amount': amount_str,
            'productinfo': product_info,
            'firstname': first_name,
            'email': email,
            'phone': phone,
            'hash': hash_value,
            'surl': surl,
            'furl': furl,
            'payu_url': payu_base_url
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)
```

---

## 2. Payment Status Endpoint

### Endpoint
```
GET /api/payments/status/<order_id>/
```

### Authentication
- **Required**: Yes (JWT Bearer token)
- User must be authenticated to check payment status

### URL Parameters
- `order_id` (integer, required): The order ID to check payment status for

### Success Response (200 OK)
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

### Status Values
| Status | Description |
|--------|-------------|
| `initiated` | Payment started, awaiting user action |
| `pending` | Payment in progress |
| `success` | Payment successful |
| `failure` | Payment failed |
| `cancelled` | Payment cancelled |
| `refunded` | Payment refunded |

### Error Responses
| Status | Response | Reason |
|--------|----------|--------|
| 401 | `{"detail": "Authentication credentials were not provided."}` | Missing JWT |
| 404 | `{"error": "No payment found for this order"}` | No payment exists |
| 404 | `{"detail": "Not found."}` | Order doesn't exist |

### Implementation Requirements

1. **Fetch Payment Record**: Query payment table/collection by `order_id`
2. **Verify Ownership**: Ensure payment belongs to authenticated user (via order ownership)
3. **Return Status**: Return payment status and all relevant details

### Example cURL
```bash
curl -X GET "https://api.yoursite.com/api/payments/status/42/" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR..."
```

---

## 3. Payment Callback Endpoint

### Endpoint
```
POST /api/payments/callback/
```

### Authentication
- **Required**: No (PayU calls this directly)
- Must use `@csrf_exempt` or disable CSRF for this endpoint
- Must verify hash to ensure request is from PayU

### Request Body (Form-Encoded)
PayU sends data as `application/x-www-form-urlencoded`:
```
status=success
txnid=123
amount=1500.00
productinfo=Order #123 - 2 item(s)
firstname=John
email=john@example.com
phone=9876543210
hash=response_hash_from_payu
```

### Request Parameters
- `status` (string): Payment status (`success` or `failure`)
- `txnid` (string): Transaction ID (same as order_id)
- `amount` (string): Amount paid
- `productinfo` (string): Product information
- `firstname` (string): Customer first name
- `email` (string): Customer email
- `phone` (string): Customer phone
- `hash` (string): Response hash from PayU (for verification)

### Response Verification

#### Hash Verification Formula (REVERSED ORDER)
```
hashString = salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
hash = SHA512(hashString)
```

**Important:** 
- Order is REVERSED for response verification!
- Hash comparison is **case-sensitive** - compare hashes exactly as received
- Always verify hash before updating order status

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "order_id": 123,
  "status": "paid"
}
```

### Error Response (400)
```json
{
  "success": false,
  "message": "Hash verification failed"
}
```

### Implementation Requirements

#### 1. Verify Hash Before Processing
- **Always verify the response hash before updating order status**
- **Hash comparison is case-sensitive** - compare hashes exactly as received
- Never trust payment status without hash verification
- Log all hash verification failures for security monitoring
- **Primary Source of Truth**: Use Server-to-Server (S2S) webhook as the primary source for transaction status, not the browser redirect (surl/furl)

#### 2. Update Order Status
- If `status=success` and hash is valid:
  - Update order status to `paid` or `payment_completed`
  - Update payment_status field
  - Log transaction details
  - Send confirmation email (optional)
- If `status=failure` and hash is valid:
  - Update order status to `payment_failed` or `failed`
  - Log failure reason
  - Do NOT delete the order (user can retry payment)

#### 3. Prevent Duplicate Processing
- Check if order is already paid before processing
- Use database transactions to prevent race conditions
- Log all payment attempts

#### 4. Example Implementation (Python/Django)
```python
import hashlib
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

def verify_payu_response(status, txnid, amount, productinfo, firstname, email, hash_received, key, salt):
    """Verify PayU response hash - CASE SENSITIVE comparison"""
    # Build hash string in REVERSE order
    hash_string = (
        f"{salt}|{status}|||||||||{email}|{firstname}|{productinfo}|{amount}|{txnid}|{key}"
    )
    calculated_hash = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()
    # IMPORTANT: Hash comparison is case-sensitive per PayU documentation
    return calculated_hash == hash_received  # Exact match, not case-insensitive

@csrf_exempt
def payu_callback(request):
    """Handle PayU payment callback"""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Method not allowed'}, status=405)
    
    try:
        # Extract parameters from form data
        status = request.POST.get('status')
        txnid = request.POST.get('txnid')
        amount = request.POST.get('amount')
        productinfo = request.POST.get('productinfo')
        firstname = request.POST.get('firstname')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        hash_received = request.POST.get('hash')
        
        # Get credentials
        key = os.getenv('PAYU_MERCHANT_KEY')
        salt = os.getenv('PAYU_SALT')
        
        # Verify hash (case-sensitive comparison)
        if not verify_payu_response(status, txnid, amount, productinfo, firstname, email, hash_received, key, salt):
            # Log security warning with hash details for debugging
            print(f"SECURITY WARNING: Hash verification failed for transaction {txnid}")
            print(f"Received hash: {hash_received}")
            # Recalculate for logging
            hash_string = f"{salt}|{status}|||||||||{email}|{firstname}|{productinfo}|{amount}|{txnid}|{key}"
            recalc_hash = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()
            print(f"Calculated hash: {recalc_hash}")
            return JsonResponse({
                'success': False,
                'message': 'Hash verification failed'
            }, status=400)
        
        # Get order by transaction ID
        order_id = int(txnid)
        order = Order.objects.get(id=order_id)
        
        # Prevent duplicate processing
        if order.payment_status == 'completed':
            return JsonResponse({
                'success': True,
                'message': 'Payment already processed',
                'order_id': order.id,
                'status': order.payment_status
            })
        
        # Update order status
        if status == 'success':
            order.status = 'paid'
            order.payment_status = 'completed'
            order.payment_transaction_id = txnid
            order.payment_amount = float(amount)
            order.save()
            
            # Send confirmation email (optional)
            # send_order_confirmation_email(order)
            
            return JsonResponse({
                'success': True,
                'message': 'Payment processed successfully',
                'order_id': order.id,
                'status': 'paid'
            })
        else:
            order.payment_status = 'failed'
            order.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Payment failed',
                'order_id': order.id,
                'status': 'failed'
            })
            
    except Order.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Order not found'
        }, status=404)
    except Exception as e:
        # Log error
        print(f"Error processing PayU callback: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Internal server error'
        }, status=500)
```

---

## 3. Order Model Updates

### Required Fields
Ensure your Order model has these fields:
- `payment_status` (string): Status of payment (`pending`, `completed`, `failed`)
- `payment_transaction_id` (string, nullable): PayU transaction ID
- `payment_amount` (decimal, nullable): Amount paid
- `status` (string): Overall order status (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `failed`)

### Order Status Flow
```
Order Created → payment_status: pending
    ↓
Payment Initiated → (no change)
    ↓
Payment Success → payment_status: completed, status: paid
    ↓
Payment Failed → payment_status: failed, status: failed (order remains, can retry)
```

---

## 4. Security Best Practices

### 1. Never Expose Salt
- Salt must only be used server-side
- Never send salt to frontend
- Never log salt in plain text
- Store salt in environment variables

### 2. Hash Verification
- Always verify response hash from PayU
- Never trust payment status without hash verification
- Log all hash verification failures
- Implement rate limiting on callback endpoint

### 3. HTTPS Only
- Use HTTPS for all payment endpoints
- PayU requires HTTPS in production
- Never send payment data over HTTP

### 4. Order Validation
- Verify order exists before processing payment
- Verify order belongs to the user (for initiation)
- Verify order amount matches payment amount
- Prevent duplicate payment processing

### 5. Error Handling
- Log all payment attempts
- Handle network timeouts gracefully
- Implement retry logic for failed callbacks
- Send alerts for critical failures

---

## 5. Testing

### Sandbox Testing

#### Step 1: Pre-Payment Validation
1. **Verify API Credentials**: Double-check test key and salt
2. **Validate Hash Calculation**: 
   - Temporarily print the hash string on server
   - Ensure parameter order matches exactly: `key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt`
   - Verify no empty/null values for mandatory parameters
   - If "Checksum failed" error appears, debug hash first

#### Step 2: Test Successful Transaction
1. Initiate payment on your site
2. Verify redirect to PayU payment page
3. Check transaction amount and product details display correctly
4. **Test Card Payment**:
   - Select Credit Card
   - Use test card: `5123456789012346`
   - Expiry: Any future date (e.g., 12/2030)
   - CVV: `123`
   - Enter OTP: `123456` on dummy bank page
5. **Test UPI Payment**:
   - Select UPI
   - Enter: `anything@payu` or `9999999999@payu`
   - Click Verify and Pay Now

#### Step 3: Test Failed Transaction
1. Initiate new payment
2. Use failure test card: `5123456789012340`
3. Verify failure handling

#### Step 4: Post-Transaction Verification
1. **Check Return URLs**: Verify surl/furl redirects work correctly
2. **Verify S2S Webhook**: 
   - Check server logs for webhook POST request
   - Validate hash in webhook response
   - **Important**: Use webhook as primary source of truth, not browser redirect
3. **Cross-Verify in PayU Dashboard**: Check transactions section for correct status

**Reference**: [PayU Integration Testing Guide](https://docs.payu.in/docs/prebuilt-checkout-page-integration)

### Test Credentials

#### From PayU Dashboard:
- Sandbox Merchant Key
- Sandbox Salt

#### Test Card Numbers (from PayU documentation):
- **Success Card**: 
  - Card Number: `5123456789012346`
  - Expiry: Any valid future date (e.g., 12/2030)
  - CVV: `123`
  - Name: Test Name
  - OTP: `123456` (for 3D Secure)
- **Failure Card**: 
  - Card Number: `5123456789012340` (Payment failed by user)

#### Test UPI IDs:
- `anything@payu` or `9999999999@payu`

**Reference**: [PayU Test Cards Documentation](https://docs.payu.in/docs/prebuilt-checkout-page-integration)

### Webhook Configuration
In PayU dashboard:
1. Go to Settings → Webhooks
2. Set callback URL: `https://yourdomain.com/api/payments/callback/`
3. Enable webhook notifications
4. Test webhook delivery

**Important**: 
- **S2S Webhook is the primary source of truth** for transaction status
- Always update order status based on webhook, not browser redirect
- Implement reconciliation using Verify Payment API if webhook is missed

---

## 6. Summary Checklist

### Backend Implementation Checklist
- [ ] Create `POST /api/payments/initiate/<order_id>/` endpoint
- [ ] Implement SHA-512 hash generation
- [ ] Implement URL construction for success/failure URLs
- [ ] Create `POST /api/payments/callback/` endpoint
- [ ] Implement hash verification (reverse order)
- [ ] Update Order model with payment fields
- [ ] Implement order status update logic
- [ ] Add environment variables for PayU credentials
- [ ] Configure CSRF exemption for callback endpoint
- [ ] Implement duplicate payment prevention
- [ ] Add error handling and logging
- [ ] Test with PayU sandbox
- [ ] Configure webhook in PayU dashboard

### Environment Variables Checklist
- [ ] `PAYU_MERCHANT_KEY` - Merchant key from PayU
- [ ] `PAYU_SALT` - Salt from PayU (keep secret!)
- [ ] `PAYU_MODE` - `sandbox` or `production`
- [ ] `PAYU_SUCCESS_URL` - Success redirect URL (can be path or full URL)
- [ ] `PAYU_FAILURE_URL` - Failure redirect URL (can be path or full URL)
- [ ] `PAYU_BASE_URL` - PayU payment URL
  - Test: `https://test.payu.in/_payment`
  - Production: `https://secure.payu.in/_payment`

---

## 7. Support & Documentation

- **PayU Hosted Checkout Documentation**: [https://docs.payu.in/docs/prebuilt-checkout-page-integration](https://docs.payu.in/docs/prebuilt-checkout-page-integration)
- PayU Support: https://payu.in/support
- PayU Test Credentials: Check PayU dashboard
- PayU Developer Portal: https://docs.payu.in

---

## 8. API Flow Diagram

```
Frontend                    Backend                    PayU
   │                          │                         │
   │  POST /api/payments/     │                         │
   │  initiate/                │                         │
   │──────────────────────────>│                         │
   │                          │                         │
   │                          │ Generate hash           │
   │                          │ Return params           │
   │<──────────────────────────│                         │
   │                          │                         │
   │ Submit form to PayU      │                         │
   │────────────────────────────────────────────────────>│
   │                          │                         │
   │                          │                         │ User pays
   │                          │                         │
   │                          │ POST /api/payments/      │
   │                          │ callback/                │
   │                          │<─────────────────────────│
   │                          │                         │
   │                          │ Verify hash             │
   │                          │ Update order            │
   │                          │                         │
   │ Redirect to success/fail │                         │
   │<──────────────────────────│                         │
```

---

## Notes

1. **Transaction ID**: Use order_id as transaction ID (`txnid`) for simplicity
2. **Amount Format**: Always format amount to 2 decimal places (e.g., "1500.00")
3. **Hash Order**: Remember that request hash and response hash use different parameter orders
4. **Hash Comparison**: Hash comparison is **case-sensitive** - compare exactly as received
5. **Callback Security**: Always verify hash before processing payment
6. **Primary Source of Truth**: Use S2S webhook as primary source, not browser redirect (surl/furl)
7. **Order Persistence**: Never delete orders on payment failure - allow retry
8. **Error Handling**: Log all errors for debugging and monitoring
9. **Reconciliation**: Implement Verify Payment API for reconciliation if webhook is missed
10. **Test Environment**: 
    - Test endpoint: `https://test.payu.in/_payment`
    - Production endpoint: `https://secure.payu.in/_payment`


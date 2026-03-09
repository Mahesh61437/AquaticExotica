# Backend API for PayU Checkout Plus Integration

This document describes the backend API endpoints required for PayU Checkout Plus integration.

## Prerequisites

1. **PayU Credentials**:
   - Merchant Key (from PayU dashboard)
   - Salt (from PayU dashboard) - **MUST be kept secret, server-side only**

2. **SHA-512 Hash Generation**:
   - Backend must be able to generate SHA-512 hashes
   - Hash generation must be done server-side for security

3. **Environment Variables** (Backend):
   ```env
   PAYU_MERCHANT_KEY=your_merchant_key
   PAYU_SALT=your_salt_here
   PAYU_MODE=sandbox  # or 'production'
   PAYU_SUCCESS_URL=/payment/success  # Can be path or full URL
   PAYU_FAILURE_URL=/payment/failure  # Can be path or full URL
   PAYU_BASE_URL=https://test.payu.in/_payment  # or https://secure.payu.in/_payment for production
   ```
   
   **Note**: Success/Failure URLs can be:
   - Full URLs: `https://yourdomain.com/payment/success`
   - Paths: `/payment/success` (backend should construct full URL using request origin)

## Required API Endpoints

### 1. Payment Initiation Endpoint

**Endpoint**: `POST /api/payments/initiate`

**Purpose**: Generate payment hash and return payment parameters for PayU Checkout Plus.

**Request Body**:
```json
{
  "order_id": 123,
  "amount": 1500.00,
  "customer_info": {
    "first_name": "John",
    "email": "john@example.com",
    "phone": "9876543210"
  },
  "product_info": "Order #123 - 2 item(s)"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "merchant_key": "your_merchant_key",
  "txnid": "TXN123456789",
  "amount": "1500.00",
  "productinfo": "Order #123 - 2 item(s)",
  "firstname": "John",
  "email": "john@example.com",
  "phone": "9876543210",
  "surl": "https://yourdomain.com/payment/success",
  "furl": "https://yourdomain.com/payment/failure",
  "hash": "generated_sha512_hash_here",
  "service_provider": "payu_paisa"
}
```

**Response** (Error - 400/500):
```json
{
  "success": false,
  "message": "Error message here"
}
```

**Implementation Details**:

1. **Generate Transaction ID (txnid)**:
   - Use order_id as txnid, or generate unique transaction ID
   - Format: Can be order_id as string, or unique identifier

2. **Hash Generation Formula**:
   ```
   hashString = key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
   hash = SHA512(hashString)
   ```
   
   **Important Notes**:
   - Use pipe (`|`) as separator
   - Empty UDF fields should still have pipes
   - Order of parameters is critical
   - Amount should be formatted to 2 decimal places (e.g., "1500.00")

3. **Example Hash Generation** (Python):
   ```python
   import hashlib
   
   def generate_payu_hash(key, txnid, amount, productinfo, firstname, email, salt):
       # Format amount to 2 decimal places
       amount_str = f"{float(amount):.2f}"
       
       # Build hash string with pipe separators
       hash_string = (
           f"{key}|{txnid}|{amount_str}|{productinfo}|{firstname}|{email}"
           f"||||||||||{salt}"
       )
       
       # Generate SHA-512 hash
       hash_obj = hashlib.sha512(hash_string.encode('utf-8'))
       return hash_obj.hexdigest()
   ```

4. **Example Hash Generation** (Node.js):
   ```javascript
   const crypto = require('crypto');
   
   function generatePayUHash(key, txnid, amount, productinfo, firstname, email, salt) {
     // Format amount to 2 decimal places
     const amountStr = parseFloat(amount).toFixed(2);
     
     // Build hash string with pipe separators
     const hashString = `${key}|${txnid}|${amountStr}|${productinfo}|${firstname}|${email}||||||||||${salt}`;
     
     // Generate SHA-512 hash
     return crypto.createHash('sha512').update(hashString).digest('hex');
   }
   ```

5. **Example Hash Generation** (Django/Python):
   ```python
   import hashlib
   
   def generate_payu_hash(key, txnid, amount, productinfo, firstname, email, salt):
       amount_str = f"{float(amount):.2f}"
       hash_string = f"{key}|{txnid}|{amount_str}|{productinfo}|{firstname}|{email}||||||||||{salt}"
       return hashlib.sha512(hash_string.encode('utf-8')).hexdigest()
   ```

### 2. Payment Callback Endpoint

**Endpoint**: `POST /api/payments/callback`

**Purpose**: Handle payment response from PayU and update order status.

**Request Body** (from PayU):
```
status=success
txnid=TXN123456789
amount=1500.00
productinfo=Order #123 - 2 item(s)
firstname=John
email=john@example.com
hash=response_hash_from_payu
```

**Note**: PayU sends data as form-encoded POST request.

**Response Verification**:

1. **Verify Response Hash**:
   ```
   hashString = salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
   hash = SHA512(hashString)
   ```
   
   **Important**: Order is REVERSED for response verification!

2. **Example Verification** (Python):
   ```python
   def verify_payu_response(status, txnid, amount, productinfo, firstname, email, hash_received, key, salt):
       # Build hash string in REVERSE order
       hash_string = f"{salt}|{status}|||||||||{email}|{firstname}|{productinfo}|{amount}|{txnid}|{key}"
       
       # Generate hash
       calculated_hash = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()
       
       # Compare with received hash
       return calculated_hash.lower() == hash_received.lower()
   ```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "order_id": 123,
  "status": "paid"
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "message": "Hash verification failed"
}
```

**Implementation Steps**:

1. Extract all parameters from PayU POST request
2. Verify hash using reverse order formula
3. If hash is valid:
   - Update order status to "paid" (if status=success)
   - Update order status to "failed" (if status=failure)
   - Log transaction details
   - Send confirmation email (optional)
4. If hash is invalid:
   - Log security warning
   - Return error response
   - Do NOT update order status

### 3. Order Status Update

After payment callback, update the order in your database:

```python
# Example Django view
@csrf_exempt
def payu_callback(request):
    if request.method == 'POST':
        status = request.POST.get('status')
        txnid = request.POST.get('txnid')
        amount = request.POST.get('amount')
        hash_received = request.POST.get('hash')
        
        # Get order by transaction ID
        order = Order.objects.get(id=int(txnid))
        
        # Verify hash
        if verify_payu_response(...):
            if status == 'success':
                order.status = 'paid'
                order.payment_status = 'completed'
                order.save()
                # Send confirmation email
            else:
                order.status = 'failed'
                order.payment_status = 'failed'
                order.save()
            
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'message': 'Hash verification failed'}, status=400)
```

## Security Best Practices

1. **Never expose Salt**:
   - Salt must only be used server-side
   - Never send salt to frontend
   - Never log salt in plain text

2. **Hash Verification**:
   - Always verify response hash from PayU
   - Never trust payment status without hash verification
   - Log all hash verification failures

3. **HTTPS Only**:
   - Use HTTPS for all payment endpoints
   - PayU requires HTTPS in production

4. **Order Validation**:
   - Verify order exists before processing payment
   - Verify order amount matches payment amount
   - Prevent duplicate payment processing

5. **Error Handling**:
   - Log all payment attempts
   - Handle network timeouts gracefully
   - Implement retry logic for failed callbacks

## Testing

### Sandbox Testing

1. Use PayU sandbox credentials
2. Test with PayU test cards:
   - Success: Use test card numbers from PayU docs
   - Failure: Use test scenarios from PayU docs

3. Test Scenarios:
   - Successful payment
   - Failed payment
   - Cancelled payment
   - Hash verification failure
   - Network timeout

### Test Credentials

Get test credentials from PayU dashboard:
- Sandbox Merchant Key
- Sandbox Salt
- Test card numbers
- Test UPI IDs

## Error Codes

Common PayU error codes:
- `E001`: Invalid hash
- `E002`: Invalid amount
- `E003`: Invalid transaction ID
- `E004`: Transaction already processed

## Webhook Configuration

In PayU dashboard:
1. Go to Settings → Webhooks
2. Set callback URL: `https://yourdomain.com/api/payments/callback`
3. Enable webhook notifications
4. Test webhook delivery

## Example Complete Implementation

### Django Example

```python
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import hashlib
import os

def build_full_url(path_or_url: str, request) -> str:
    """Build full URL from path or return full URL as-is"""
    if path_or_url.startswith('http'):
        return path_or_url
    # Get scheme and host from request
    scheme = request.scheme  # 'http' or 'https'
    host = request.get_host()  # 'yourdomain.com' or 'yourdomain.com:8000'
    # Ensure path starts with /
    path = path_or_url if path_or_url.startswith('/') else '/' + path_or_url
    return f"{scheme}://{host}{path}"

@csrf_exempt
def initiate_payment(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        # Get credentials from environment
        key = os.getenv('PAYU_MERCHANT_KEY')
        salt = os.getenv('PAYU_SALT')
        
        # Get success/failure URLs (can be paths or full URLs)
        success_url_env = os.getenv('PAYU_SUCCESS_URL', '/payment/success')
        failure_url_env = os.getenv('PAYU_FAILURE_URL', '/payment/failure')
        
        # Build full URLs
        surl = build_full_url(success_url_env, request)
        furl = build_full_url(failure_url_env, request)
        
        # Extract data
        order_id = data['order_id']
        amount = data['amount']
        customer_info = data['customer_info']
        
        # Generate transaction ID
        txnid = str(order_id)
        
        # Generate hash
        amount_str = f"{float(amount):.2f}"
        hash_string = (
            f"{key}|{txnid}|{amount_str}|{data['product_info']}|"
            f"{customer_info['first_name']}|{customer_info['email']}"
            f"||||||||||{salt}"
        )
        hash_value = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()
        
        # Return payment parameters
        return JsonResponse({
            'success': True,
            'merchant_key': key,
            'txnid': txnid,
            'amount': amount_str,
            'productinfo': data['product_info'],
            'firstname': customer_info['first_name'],
            'email': customer_info['email'],
            'phone': customer_info['phone'],
            'surl': surl,  # Full URL constructed from env var
            'furl': furl,  # Full URL constructed from env var
            'hash': hash_value,
            'service_provider': 'payu_paisa',
            'payu_url': os.getenv('PAYU_BASE_URL', 'https://test.payu.in/_payment')
        })

@csrf_exempt
def payu_callback(request):
    if request.method == 'POST':
        # Extract parameters
        status = request.POST.get('status')
        txnid = request.POST.get('txnid')
        amount = request.POST.get('amount')
        productinfo = request.POST.get('productinfo')
        firstname = request.POST.get('firstname')
        email = request.POST.get('email')
        hash_received = request.POST.get('hash')
        
        # Get credentials
        key = os.getenv('PAYU_MERCHANT_KEY')
        salt = os.getenv('PAYU_SALT')
        
        # Verify hash (reverse order)
        hash_string = f"{salt}|{status}|||||||||{email}|{firstname}|{productinfo}|{amount}|{txnid}|{key}"
        calculated_hash = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()
        
        if calculated_hash.lower() != hash_received.lower():
            return JsonResponse({'success': False, 'message': 'Hash verification failed'}, status=400)
        
        # Update order
        order = Order.objects.get(id=int(txnid))
        if status == 'success':
            order.status = 'paid'
        else:
            order.status = 'failed'
        order.save()
        
        return JsonResponse({'success': True, 'order_id': order.id, 'status': order.status})
```

## Support

For PayU integration support:
- PayU Documentation: https://docs.payu.in
- PayU Support: https://payu.in/support
- PayU Test Credentials: Check PayU dashboard


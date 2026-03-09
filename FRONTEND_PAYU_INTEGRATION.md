# Frontend PayU Integration Guide

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/payments/initiate/<order_id>/` | JWT Required | Generates PayU payment parameters |
| `POST` | `/api/payments/webhook/` | None | PayU callback (handled by backend) |

---

## Step 1: Initiate Payment

When the user clicks "Pay Now", call the backend to get payment parameters:

```javascript
const initiatePayment = async (orderId, accessToken) => {
  const response = await fetch(`${API_BASE_URL}/api/payments/initiate/${orderId}/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to initiate payment');
  }
  
  return await response.json();
};
```

### Response Structure
```json
{
  "key": "your_merchant_key",
  "txnid": "abc123xyz",
  "amount": "1500.00",
  "productinfo": "Order #42",
  "firstname": "John",
  "email": "john@example.com",
  "phone": "9876543210",
  "hash": "generated_hash_value",
  "surl": "https://yoursite.com/payment/success",
  "furl": "https://yoursite.com/payment/failure",
  "payu_url": "https://test.payu.in/_payment"
}
```

---

## Step 2: Redirect to PayU

Create a hidden form and submit it to redirect the user to PayU's payment page:

```javascript
const redirectToPayU = (paymentData) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentData.payu_url;

  const fields = [
    'key', 'txnid', 'amount', 'productinfo', 
    'firstname', 'email', 'phone', 'hash', 'surl', 'furl'
  ];
  
  fields.forEach(field => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = field;
    input.value = paymentData[field] || '';
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};
```

### Combined Usage
```javascript
const handlePayNow = async (orderId) => {
  try {
    const paymentData = await initiatePayment(orderId, userToken);
    redirectToPayU(paymentData);
  } catch (error) {
    console.error('Payment error:', error);
    alert('Failed to initiate payment. Please try again.');
  }
};
```

---

## Step 3: Create Redirect Pages

### Success Page (`/payment/success`)
```jsx
// pages/payment/success.js (Next.js example)
export default function PaymentSuccess() {
  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your order. You will receive a confirmation email shortly.</p>
      <a href="/orders">View My Orders</a>
    </div>
  );
}
```

### Failure Page (`/payment/failure`)
```jsx
// pages/payment/failure.js (Next.js example)
export default function PaymentFailure() {
  return (
    <div>
      <h1>Payment Failed</h1>
      <p>Unfortunately, your payment could not be processed.</p>
      <a href="/cart">Return to Cart</a>
      <a href="/orders">View My Orders</a>
    </div>
  );
}
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. User clicks "Pay Now"                                           │
│         │                                                            │
│         ▼                                                            │
│  2. Frontend → POST /api/payments/initiate/<order_id>/              │
│         │                                                            │
│         ▼                                                            │
│  3. Backend generates hash, returns payment params                   │
│         │                                                            │
│         ▼                                                            │
│  4. Frontend submits hidden form to PayU                            │
│         │                                                            │
│         ▼                                                            │
│  5. User completes payment on PayU page                             │
│         │                                                            │
│         ├──────────────────────────────────────┐                    │
│         ▼                                      ▼                    │
│  6a. PayU → webhook → Backend           6b. PayU redirects user    │
│      (updates order status)                  to surl/furl           │
│         │                                      │                    │
│         ▼                                      ▼                    │
│  7. Order status: "processing"          8. Show success/failure    │
│     or "cancelled"                          page to user            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## React Component Example

```jsx
import { useState } from 'react';

const PayUButton = ({ orderId, accessToken, apiBaseUrl }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Step 1: Get payment data from backend
      const response = await fetch(
        `${apiBaseUrl}/api/payments/initiate/${orderId}/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Payment initiation failed');
      
      const paymentData = await response.json();

      // Step 2: Create and submit form to PayU
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentData.payu_url;

      const fields = [
        'key', 'txnid', 'amount', 'productinfo',
        'firstname', 'email', 'phone', 'hash', 'surl', 'furl'
      ];

      fields.forEach(field => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field;
        input.value = paymentData[field] || '';
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
};

export default PayUButton;
```

---

## Environment Variables (Backend)

Make sure these are set in your backend `.env`:

```env
PAYU_MERCHANT_KEY=your_merchant_key
PAYU_MERCHANT_SALT=your_merchant_salt
PAYU_BASE_URL=https://test.payu.in/_payment    # Use https://secure.payu.in/_payment for production
PAYU_SUCCESS_URL=https://yoursite.com/payment/success
PAYU_FAILURE_URL=https://yoursite.com/payment/failure
```

# PayU Checkout Plus Integration Guide

This guide outlines the complete steps to seamlessly integrate PayU Checkout Plus into your Aquatic Exotica e-commerce platform.

## 📋 Overview

PayU Checkout Plus is a redirectionless payment solution that displays a payment modal directly on your website, supporting:
- Credit/Debit Cards
- Net Banking
- UPI
- Wallets
- EMI
- BNPL (Buy Now Pay Later)

## 🚀 Implementation Steps

### Step 1: Account Setup & Credentials

1. **Create PayU Merchant Account**
   - Sign up at [PayU India](https://payu.in/signup)
   - Complete KYC verification
   - Get your **Merchant Key** and **Salt** from the dashboard

2. **Environment Configuration**
   - Add PayU credentials to your environment variables
   - Create/update `.env` file in project root:

```env
# PayU Configuration (Frontend)
VITE_PAYU_MERCHANT_KEY=your_merchant_key_here
VITE_PAYU_MODE=sandbox  # or 'production' for live
VITE_PAYU_SUCCESS_URL=https://yourdomain.com/payment/success
VITE_PAYU_FAILURE_URL=https://yourdomain.com/payment/failure

# PayU Salt (Backend Only - NEVER in frontend!)
# Salt should only be used server-side for hash generation
PAYU_SALT=your_salt_here
```

**Important**: 
- Never commit `.env` file to version control. Add it to `.gitignore`.
- **Salt must NEVER be in frontend code** - it should only be used on the backend for hash generation
- See `.env.example` file for complete environment variable template

### Step 2: Backend API Setup

You'll need to create backend endpoints to:
1. Generate payment hash (server-side for security)
2. Handle payment success/failure callbacks
3. Update order status based on payment result

#### 2.1 Create Payment Hash Endpoint

**Required Backend Endpoint**: `POST /api/payments/initiate`

This endpoint should:
- Accept order details (order_id, amount, customer info)
- Generate SHA512 hash using PayU's formula
- Return payment parameters to frontend

**Hash Generation Formula**:
```
hashString = key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
hash = SHA512(hashString)
```

**Parameters to include**:
- `key` - Merchant Key
- `txnid` - Unique transaction ID (order_id)
- `amount` - Order total amount
- `productinfo` - Product description
- `firstname` - Customer first name
- `email` - Customer email
- `phone` - Customer phone
- `surl` - Success URL
- `furl` - Failure URL
- `hash` - Generated hash

#### 2.2 Payment Callback Endpoint

**Required Backend Endpoint**: `POST /api/payments/callback`

This endpoint should:
- Verify payment hash from PayU response
- Update order status (paid/pending/failed)
- Handle payment success/failure logic

### Step 3: Frontend Integration

#### 3.1 Install PayU Checkout Plus SDK

Add the PayU Checkout Plus script to your `index.html`:

```html
<!-- Add before closing </head> tag -->
<script src="https://checkout-static.payu.in/v1/checkout.js"></script>
```

#### 3.2 Create PayU Service/Utility

Create a new file: `client/src/lib/payu.ts`

```typescript
// PayU Checkout Plus integration utilities

export interface PayUPaymentParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  service_provider: string;
}

export interface PayUResponse {
  status: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  hash: string;
  error?: string;
  error_Message?: string;
}

declare global {
  interface Window {
    PayU?: {
      checkout: (params: PayUPaymentParams, callback: (response: PayUResponse) => void) => void;
    };
  }
}

export const initiatePayUPayment = async (
  orderId: string,
  amount: number,
  customerInfo: {
    firstName: string;
    email: string;
    phone: string;
  },
  productInfo: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Call backend to get payment parameters with hash
    fetch('/api/payments/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        amount: amount,
        customer_info: customerInfo,
        product_info: productInfo,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          reject(new Error(data.message || 'Failed to initiate payment'));
          return;
        }

        const paymentParams: PayUPaymentParams = {
          key: data.merchant_key,
          txnid: data.txnid,
          amount: data.amount,
          productinfo: data.productinfo,
          firstname: data.firstname,
          email: data.email,
          phone: data.phone,
          surl: data.surl,
          furl: data.furl,
          hash: data.hash,
          service_provider: 'payu_paisa',
        };

        // Initialize PayU Checkout Plus
        if (window.PayU && window.PayU.checkout) {
          window.PayU.checkout(paymentParams, (response: PayUResponse) => {
            if (response.status === 'success') {
              // Payment successful
              resolve();
            } else {
              // Payment failed
              reject(new Error(response.error_Message || 'Payment failed'));
            }
          });
        } else {
          reject(new Error('PayU SDK not loaded'));
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};
```

#### 3.3 Update CheckoutForm Component

Modify `client/src/components/checkout/CheckoutForm.tsx`:

**Key Changes**:
1. After order creation, initiate PayU payment instead of directly completing
2. Handle payment success/failure callbacks
3. Update order status based on payment result

**Modified Flow**:
```typescript
// In onSubmit function, after order creation:

// 1. Create order first (pending status)
const orderResponse = await apiRequest("/api/orders/", {
  method: "POST",
  // ... order data
});

// 2. Initiate PayU payment
try {
  await initiatePayUPayment(
    orderResponse.id,
    cart.total + shippingCost,
    {
      firstName: data.fullName.split(' ')[0],
      email: data.email,
      phone: data.phone,
    },
    `Order #${orderResponse.id} - ${cart.items.length} item(s)`
  );
  
  // Payment successful - order will be updated via callback
  clearCart();
  setLocation(`/order-confirmation/${orderResponse.id}`);
} catch (error) {
  // Payment failed or cancelled
  toast({
    title: "Payment failed",
    description: error instanceof Error ? error.message : "Payment could not be processed",
    variant: "destructive",
  });
}
```

### Step 4: Create Payment Success/Failure Pages

#### 4.1 Payment Success Page

Create `client/src/pages/PaymentSuccess.tsx`:

```typescript
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  
  // Extract order ID from URL or query params
  // Handle success message and redirect
  
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Your payment has been processed successfully.</p>
          <p className="text-sm text-gray-600">
            Order confirmation will be sent to your email.
          </p>
          <Button onClick={() => setLocation('/')}>
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 4.2 Payment Failure Page

Create `client/src/pages/PaymentFailure.tsx`:

```typescript
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';

export default function PaymentFailure() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-center">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>Your payment could not be processed.</p>
          <p className="text-sm text-gray-600">
            Please try again or contact support if the problem persists.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setLocation('/checkout')}>
              Try Again
            </Button>
            <Button onClick={() => setLocation('/')}>
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 5: Update Order Status Flow

**Order Status States**:
- `pending` - Order created, payment pending
- `paid` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled by user

**Backend should update order status**:
- When payment callback is received from PayU
- Based on hash verification result

### Step 6: Testing

#### 6.1 Sandbox Testing

Use PayU test credentials:
- Test cards: Use PayU's test card numbers
- Test UPI: Use test UPI IDs provided by PayU
- Test net banking: Use test bank credentials

**Test Scenarios**:
1. ✅ Successful payment flow
2. ✅ Failed payment (insufficient funds)
3. ✅ Cancelled payment (user cancels)
4. ✅ Network timeout handling
5. ✅ Invalid payment data handling

#### 6.2 Test Checklist

- [ ] Payment modal opens correctly
- [ ] All payment methods visible
- [ ] Payment success redirects to success page
- [ ] Payment failure redirects to failure page
- [ ] Order status updates correctly
- [ ] Email notifications sent
- [ ] Cart clears after successful payment
- [ ] Hash verification works correctly
- [ ] Error handling works for all scenarios

### Step 7: Production Deployment

1. **Update Environment Variables**:
   - Switch `VITE_PAYU_MODE` to `production`
   - Use production Merchant Key and Salt
   - Update success/failure URLs to production domain

2. **SSL Certificate**:
   - Ensure your site has valid SSL certificate (HTTPS)
   - PayU requires HTTPS for production

3. **Webhook Configuration**:
   - Configure PayU webhook URL in dashboard
   - Point to your production callback endpoint

4. **Monitoring**:
   - Set up error logging for payment failures
   - Monitor payment success rates
   - Track order status updates

## 🔒 Security Best Practices

1. **Never expose Salt in frontend**:
   - Hash generation must be server-side only
   - Salt should never be in client-side code

2. **Hash Verification**:
   - Always verify payment response hash on backend
   - Never trust payment status without hash verification

3. **HTTPS Only**:
   - Use HTTPS in production
   - PayU requires secure connections

4. **Order Validation**:
   - Verify order amount matches payment amount
   - Validate order exists before processing payment
   - Prevent duplicate payment processing

## 📝 Additional Considerations

### Customization

PayU Checkout Plus allows customization:
- Brand colors
- Logo
- Payment method preferences
- UI themes

Configure these in PayU dashboard or via API parameters.

### Analytics Integration

Track payment events:
- `payment_initiated` - When payment modal opens
- `payment_success` - When payment succeeds
- `payment_failed` - When payment fails
- `payment_cancelled` - When user cancels

### Error Handling

Implement comprehensive error handling:
- Network errors
- Timeout handling
- Invalid response handling
- User cancellation handling

## 🐛 Troubleshooting

**Common Issues**:

1. **Payment modal not opening**:
   - Check if PayU SDK is loaded
   - Verify all required parameters are present
   - Check browser console for errors

2. **Hash verification failing**:
   - Verify hash generation formula
   - Check parameter order matches PayU requirements
   - Ensure salt is correct

3. **Callback not received**:
   - Verify callback URL is accessible
   - Check PayU dashboard webhook configuration
   - Ensure server can receive POST requests

## 📚 Resources

- [PayU Checkout Plus Documentation](https://docs.payu.in/docs/checkout-plus-integration)
- [PayU Test Credentials](https://docs.payu.in/docs/test-credentials)
- [PayU Support](https://payu.in/support)

## ✅ Implementation Checklist

- [ ] PayU merchant account created
- [ ] Merchant Key and Salt obtained
- [ ] Environment variables configured
- [ ] Backend hash generation endpoint created
- [ ] Backend callback endpoint created
- [ ] PayU SDK added to frontend
- [ ] PayU service/utility created
- [ ] CheckoutForm updated with payment flow
- [ ] Payment success page created
- [ ] Payment failure page created
- [ ] Order status flow updated
- [ ] Sandbox testing completed
- [ ] Production environment configured
- [ ] SSL certificate installed
- [ ] Webhook configured
- [ ] Error handling implemented
- [ ] Analytics tracking added

---

**Note**: This is a comprehensive guide. Actual implementation may require adjustments based on your specific backend API structure and requirements.


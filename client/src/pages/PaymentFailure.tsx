import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { XCircle, Home, ShoppingBag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { getPaymentStatus } from "@/lib/payu-service";
import React from "react";

export default function PaymentFailure() {
  const [, params] = useRoute("/payment/failure");
  
  // Extract parameters from PayU redirect (GET request with query params)
  // If user lands on /payment/failure, PayU has determined payment failed
  const urlParams = new URLSearchParams(window.location.search);
  const payuStatus = urlParams.get("status"); // Should be "failure"
  const errorMessage = urlParams.get("error_Message") || urlParams.get("error") || "Payment could not be processed";
  const txnid = urlParams.get("txnid");
  const orderId = txnid ? parseInt(txnid) : null;

  // Fetch payment status from backend
  const { data: paymentStatus } = useQuery({
    queryKey: [`/api/payments/status/${orderId}`],
    enabled: !!orderId,
    staleTime: 0,
    retry: 1,
    queryFn: async () => {
      if (!orderId) return null;
      try {
        return await getPaymentStatus(orderId);
      } catch (error) {
        // Payment status might not exist yet, that's okay
        return null;
      }
    },
  });

  // Fetch order from backend
  const { data: order } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
    staleTime: 0,
    retry: 1,
    queryFn: async () => {
      if (!orderId) return null;
      return await apiRequest(`/api/orders/${orderId}`);
    },
  });

  return (
    <>
      <Helmet>
        <title>Payment Failed - Aquatic Exotica</title>
        <meta name="description" content="Your payment could not be processed. Please try again." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <XCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
          
          <h1 className="text-3xl font-heading font-bold mb-4">Payment Failed</h1>
          
          <p className="text-xl text-gray-600 mb-4">
            We're sorry, but your payment could not be processed.
          </p>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{errorMessage}</p>
            </div>
          )}

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                Order ID: <span className="font-semibold">#{orderId}</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Your order has been created but payment is pending. You can retry payment from your order details.
              </p>
              {order && (
                <p className="text-sm text-gray-600 mt-2">
                  Order Status: <span className="font-semibold capitalize">{order.status}</span>
                </p>
              )}
              {paymentStatus && (
                <p className="text-sm text-gray-600 mt-2">
                  Payment Status: <span className="font-semibold capitalize text-red-600">{paymentStatus.status}</span>
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold mb-3">Common reasons for payment failure:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>Insufficient funds in your account</li>
              <li>Incorrect card details entered</li>
              <li>Card expired or blocked</li>
              <li>Network connectivity issues</li>
              <li>Bank security restrictions</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {orderId && (
              <Button asChild>
                <Link href={`/order-confirmation/${orderId}`}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Payment
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/my-orders">
                <ShoppingBag className="mr-2 h-4 w-4" />
                My Orders
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/home">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-600 mb-2">
              Need help? Contact our support team
            </p>
            <a 
              href="mailto:mahesh@aquaticexotica.com" 
              className="text-primary hover:underline"
            >
              mahesh@aquaticexotica.com
            </a>
          </div>
        </div>
      </div>
    </>
  );
}


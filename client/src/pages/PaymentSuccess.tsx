import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { CheckCircle, Package, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { getPaymentStatus } from "@/lib/payu-service";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

interface OrderResponse {
  id: number;
  grandTotal: number;
  status: string;
  createdAt: string;
}

export default function PaymentSuccess() {
  const [, params] = useRoute("/payment/success");
  
  // Extract parameters from PayU redirect (GET request with query params)
  // If user lands on /payment/success, PayU has determined payment was successful
  const urlParams = new URLSearchParams(window.location.search);
  const txnid = urlParams.get("txnid");
  const payuStatus = urlParams.get("status"); // Should be "success"
  const orderId = txnid ? parseInt(txnid) : null;

  // Fetch payment status from backend
  const { data: paymentStatus, isLoading: paymentLoading } = useQuery({
    queryKey: [`/api/payments/status/${orderId}`],
    enabled: !!orderId,
    staleTime: 0,
    retry: 2,
    refetchOnMount: true,
    queryFn: async () => {
      if (!orderId) return null;
      return await getPaymentStatus(orderId);
    },
  });

  // Fetch order from backend to get order details
  const { data: order, isLoading: orderLoading, error } = useQuery<OrderResponse>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
    staleTime: 0,
    retry: 2,
    refetchOnMount: true,
    queryFn: async () => {
      if (!orderId) return null;
      return await apiRequest(`/api/orders/${orderId}`);
    },
  });

  const isLoading = paymentLoading || orderLoading;

  // Payment status from PayU
  const paymentConfirmed = paymentStatus?.status === "success" && paymentStatus?.verified;
  const paymentPending = paymentStatus?.status === "pending" || paymentStatus?.status === "initiated";

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <Skeleton className="h-24 w-full mb-4" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Payment Successful - Aquatic Exotica</title>
        <meta name="description" content="Your payment has been processed successfully." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          
          <h1 className="text-3xl font-heading font-bold mb-4">Payment Successful!</h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your payment has been processed successfully by PayU.
          </p>

          {/* Info message if backend hasn't confirmed yet (webhook might be delayed) */}
          {paymentPending && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Payment confirmed by PayU. Your order status is being updated. This usually takes a few seconds.
              </p>
            </div>
          )}

          {/* Success confirmation when backend has updated order */}
          {paymentConfirmed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                ✓ Payment confirmed and order status updated successfully.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                Unable to fetch order details. Please check your order status from "My Orders" page.
              </p>
            </div>
          )}

          {order && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-green-600">{formatPrice(order.grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Status:</span>
                  <span className="font-semibold capitalize">{order.status}</span>
                </div>
                {paymentStatus && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className="font-semibold capitalize text-green-600">
                        {paymentStatus.status === "success" ? "Paid" : paymentStatus.status}
                      </span>
                    </div>
                    {paymentStatus.mihpayid && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-semibold text-sm">{paymentStatus.mihpayid}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href={`/order-confirmation/${orderId || ''}`}>
                <Package className="mr-2 h-4 w-4" />
                View Order Details
              </Link>
            </Button>
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
        </div>
      </div>
    </>
  );
}


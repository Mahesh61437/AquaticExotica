import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Helmet } from "react-helmet";
import { CheckCircle, Package, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);

  // Extract order ID and transaction ID from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get("order_id") || params.get("id");
    const txnIdParam = params.get("txnid");
    
    if (orderIdParam) {
      setOrderId(parseInt(orderIdParam));
    }
    if (txnIdParam) {
      setTxnId(txnIdParam);
    }
  }, []);

  // Fetch order details if order ID is available
  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <>
      <Helmet>
        <title>Payment Successful - Aquatic Exotica</title>
        <meta name="description" content="Your payment has been processed successfully. Thank you for your purchase!" />
        <meta property="og:title" content="Payment Successful - Aquatic Exotica" />
        <meta property="og:description" content="Your payment has been processed successfully. Thank you for your purchase!" />
      </Helmet>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <CheckCircle className="h-20 w-20 text-green-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-green-100 animate-ping opacity-75"></div>
                  </div>
                </div>
              </div>
              <CardTitle className="text-center text-3xl font-heading font-bold text-green-700">
                Payment Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-lg text-gray-700">
                  Your payment has been processed successfully.
                </p>
                {txnId && (
                  <p className="text-sm text-gray-500">
                    Transaction ID: <span className="font-mono">{txnId}</span>
                  </p>
                )}
                {orderId && (
                  <p className="text-sm text-gray-500">
                    Order ID: <span className="font-mono">#{orderId}</span>
                  </p>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : order && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Package className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900 mb-1">
                        Order Confirmed
                      </p>
                      <p className="text-sm text-green-700">
                        Your order has been confirmed and will be processed shortly. 
                        You will receive an order confirmation email with all the details.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  <strong>What's next?</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>You will receive an order confirmation email shortly</li>
                  <li>We'll check stock availability and contact you via WhatsApp</li>
                  <li>Your order will be shipped once confirmed</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/my-orders")}
                  className="flex items-center justify-center"
                >
                  <Package className="h-4 w-4 mr-2" />
                  View My Orders
                </Button>
                <Button
                  onClick={() => setLocation("/shop")}
                  className="flex items-center justify-center"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/home")}
                  className="flex items-center justify-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {orderId && (
                <div className="text-center pt-4 border-t">
                  <Button
                    variant="link"
                    asChild
                    className="text-sm"
                  >
                    <Link href={`/order-confirmation/${orderId}`}>
                      View Order Details
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}


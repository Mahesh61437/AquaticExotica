import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Helmet } from "react-helmet";
import { XCircle, AlertTriangle, RefreshCw, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PaymentFailure() {
  const [, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Extract error details from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const errorMsgParam = params.get("error_Message");
    const txnIdParam = params.get("txnid");
    const orderIdParam = params.get("order_id") || params.get("id");
    
    if (errorMsgParam) {
      setErrorMessage(errorMsgParam);
    } else if (errorParam) {
      setErrorMessage(errorParam);
    }
    
    if (txnIdParam) {
      setTxnId(txnIdParam);
    }
    
    if (orderIdParam) {
      setOrderId(parseInt(orderIdParam));
    }
  }, []);

  const getCommonReasons = () => [
    "Insufficient funds in your account",
    "Card has been declined by the bank",
    "Network timeout during payment processing",
    "Payment was cancelled by you",
    "Invalid card details entered",
    "Card has expired or is blocked",
  ];

  return (
    <>
      <Helmet>
        <title>Payment Failed - Aquatic Exotica</title>
        <meta name="description" content="Your payment could not be processed. Please try again or contact support." />
        <meta property="og:title" content="Payment Failed - Aquatic Exotica" />
        <meta property="og:description" content="Your payment could not be processed. Please try again or contact support." />
      </Helmet>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <XCircle className="h-20 w-20 text-red-500" />
              </div>
              <CardTitle className="text-center text-3xl font-heading font-bold text-red-700">
                Payment Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-lg text-gray-700">
                  Your payment could not be processed.
                </p>
                {errorMessage && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                {txnId && (
                  <p className="text-sm text-gray-500 mt-2">
                    Transaction ID: <span className="font-mono">{txnId}</span>
                  </p>
                )}
                {orderId && (
                  <p className="text-sm text-gray-500">
                    Order ID: <span className="font-mono">#{orderId}</span>
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  Common reasons for payment failure:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  {getCommonReasons().map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  What you can do:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Check your payment method and try again</li>
                  <li>Ensure you have sufficient funds</li>
                  <li>Verify your card details are correct</li>
                  <li>Try a different payment method</li>
                  <li>Contact your bank if the issue persists</li>
                  <li>Reach out to our support team for assistance</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                  onClick={() => {
                    if (orderId) {
                      setLocation(`/checkout?retry_order=${orderId}`);
                    } else {
                      setLocation("/checkout");
                    }
                  }}
                  className="flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
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

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  Need help? Contact our support team
                </p>
                <Button variant="link" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}


import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { formatPrice } from "../lib/utils";
import { ImageWithFallback } from "@/components/ui/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string;
}

interface Address {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
}

interface Order {
  id: number;
  status: string;
  total: string;
  createdAt: string;
  paymentMethod: string;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
}

export default function OrderDetail() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/orders/:id");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!match || !params?.id) return;

      try {
        // If not authenticated, redirect to login
        if (!currentUser) {
          toast({
            title: "Authentication required",
            description: "Please sign in to view order details",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        setLoading(true);
        const orderId = params.id;
        const data = await apiRequest<Order>(`/api/orders/${orderId}`);
        setOrder(data);
      } catch (error: any) {
        console.error("Failed to fetch order details:", error);
        
        // Handle 403 Forbidden (not the user's order)
        if (error.response?.status === 403) {
          toast({
            title: "Access denied",
            description: "You don't have permission to view this order",
            variant: "destructive",
          });
          navigate("/my-orders");
          return;
        }
        
        // Handle 404 Not Found
        if (error.response?.status === 404) {
          toast({
            title: "Order not found",
            description: "The requested order does not exist",
            variant: "destructive",
          });
          navigate("/my-orders");
          return;
        }
        
        toast({
          title: "Error",
          description: "Failed to load order details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [currentUser, match, params, navigate, toast]);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { 
          icon: <Clock className="h-8 w-8 text-yellow-500" />,
          badge: <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>,
          message: "Your order has been received and is being processed."
        };
      case "processing":
        return { 
          icon: <Package className="h-8 w-8 text-blue-500" />,
          badge: <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Processing</Badge>,
          message: "Your order is being prepared for shipping."
        };
      case "shipped":
        return { 
          icon: <Truck className="h-8 w-8 text-purple-500" />,
          badge: <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Shipped</Badge>,
          message: "Your order is on the way to you."
        };
      case "delivered":
        return { 
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          badge: <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>,
          message: "Your order has been delivered successfully."
        };
      case "cancelled":
        return { 
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          badge: <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>,
          message: "This order has been cancelled."
        };
      default:
        return { 
          icon: <Clock className="h-8 w-8" />,
          badge: <Badge variant="outline">{status}</Badge>,
          message: "Status: " + status
        };
    }
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-lg mb-4">Order not found or you don't have permission to view it.</p>
            <Button onClick={() => navigate("/my-orders")}>Back to My Orders</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          className="p-0 h-auto" 
          onClick={() => navigate("/my-orders")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl mb-1">
                    Order #{order.id}
                  </CardTitle>
                  <CardDescription>
                    Placed on {formatDate(order.createdAt)}
                  </CardDescription>
                </div>
                {statusInfo.badge}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {statusInfo.icon}
                <div>
                  <h3 className="font-medium">Order Status: {order.status}</h3>
                  <p className="text-gray-500">{statusInfo.message}</p>
                </div>
              </div>

              <h3 className="font-medium mb-3">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b">
                    <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      <ImageWithFallback 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(item.price)}</div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(parseFloat(item.price) * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details & Addresses */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Payment Method</div>
                <div>{order.paymentMethod}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Order Status</div>
                <div>{order.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Order Date</div>
                <div>{formatDate(order.createdAt)}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="font-medium">{order.shippingAddress.name}</div>
                <div>{order.shippingAddress.addressLine1}</div>
                {order.shippingAddress.addressLine2 && (
                  <div>{order.shippingAddress.addressLine2}</div>
                )}
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pinCode}
                </div>
                <div>Phone: {order.shippingAddress.phone}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                If you have any questions about your order, please contact our customer service.
              </p>
              <Button variant="outline" onClick={() => window.location.href = "mailto:support@example.com"}>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { formatPrice, generateProductUrl } from "../lib/utils";
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

// Define variant type based on API response
interface OrderVariant {
  id: number;
  product: number;
  variantType: string;
  description: string;
  stock: number;
  originalPrice: string;
  offerPrice: string;
  savings: string;
  discountPercentage: number;
  isInStock: boolean;
}

// Define new order item type based on API response
interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    imageUrl: string;
    thumbnailUrl?: string | null;
  };
  variant: OrderVariant | null;
  quantity: number;
  price: string;
  totalPrice: number;
}

// Define new shipping address type based on API response
interface ShippingAddress {
  id: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  isDefault: boolean;
}

// Define new order type based on API response
interface NewOrder {
  id: number;
  user: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalAmount: string;
  shippingCost: string;
  grandTotal: number;
  status: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


export default function OrderDetail() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/orders/:id");
  const [order, setOrder] = useState<NewOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    if (!match || !params?.id) return;

    try {
      setLoading(true);
      const orderId = params.id;
      const response = await apiRequest<NewOrder | PaginatedResponse<NewOrder>>(`/api/orders/${orderId}`);
      
      // Handle different response formats
      let orderData: NewOrder | null = null;
      if (response && typeof response === 'object' && 'results' in response) {
        // New pagination format: { count, next, previous, results }
        const results = (response as PaginatedResponse<NewOrder>).results;
        orderData = Array.isArray(results) && results.length > 0 ? results[0] : null;
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Old pagination format: { data }
        const data = (response as any).data;
        orderData = Array.isArray(data) && data.length > 0 ? data[0] : null;
      } else if (response && typeof response === 'object' && 'id' in response) {
        // Direct order object
        orderData = response as NewOrder;
      }
      
      setOrder(orderData);
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
  }, [match, params?.id, navigate, toast]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

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
                {Array.isArray(order.items) && order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b">
                    <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <Link href={generateProductUrl(item.product)}>
                        <h4 className="font-medium hover:text-primary cursor-pointer transition-colors">
                          {item.product.name}
                        </h4>
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-gray-600 mt-1">
                          Variant: {item.variant.description || item.variant.variantType}
                        </p>
                      )}
                      <div className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(item.price)}</div>
                      <div className="text-sm text-gray-500">
                        {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(Number(order.totalAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span>{formatPrice(Number(order.shippingCost))}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(order.grandTotal)}</span>
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
                <div className="font-medium">{order.shippingAddress.recipientName}</div>
                <div>{order.shippingAddress.addressLine1}</div>
                {order.shippingAddress.addressLine2 && (
                  <div>{order.shippingAddress.addressLine2}</div>
                )}
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </div>
                <div>{order.shippingAddress.country}</div>
                <div>Phone: {order.shippingAddress.recipientPhone}</div>
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
              <div className="text-sm text-gray-600 mb-4">
                <div><strong>SREENIVASULU MAHESH BABU</strong></div>
                <div>Balaji Nagar, Greamspet</div>
                <div>Chittoor, Andhra Pradesh - 517002</div>
                <div>Phone: +91 8074751370</div>
              </div>
              <Button variant="outline" onClick={() => window.location.href = "mailto:mahesh@aquaticexotica.com"}>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
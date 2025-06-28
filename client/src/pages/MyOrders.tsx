import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { formatPrice } from "../lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

// Define new order item type based on API response
interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: string;
    compareAtPrice: string;
    discountPercentage: number;
    stock: number;
    category: {
      id: number;
      name: string;
      slug: string;
      description: string | null;
      imageUrl: string;
    };
    tags: string;
    rating: string;
    isActive: boolean;
    isNew: boolean;
    isSale: boolean;
    isFeatured: boolean;
    isTrending: boolean;
    isInStock: boolean;
    imageUrl: string;
  };
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

// Define paginated response type
interface PaginatedResponse<T> {
  data?: T[];
}

export default function MyOrders() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<NewOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // If not authenticated, redirect to login
        if (!currentUser) {
          toast({
            title: "Authentication required",
            description: "Please sign in to view your orders",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        setLoading(true);
        const response = await apiRequest<NewOrder[] | PaginatedResponse<NewOrder>>("/api/orders/myorders/");
        
        // Handle different response formats
        let ordersData: NewOrder[] = [];
        if (response && typeof response === 'object' && 'data' in response) {
          ordersData = (response as PaginatedResponse<NewOrder>).data || [];
        } else if (Array.isArray(response)) {
          ordersData = response;
        }
        
        setOrders(ordersData);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast({
          title: "Error",
          description: "Failed to load your orders. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser, navigate, toast]);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Processing</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Shipped</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // View details of a specific order
  const viewOrderDetails = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="container py-8">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold mb-2">My Orders</CardTitle>
        <CardDescription>
          View and track all your orders in one place
        </CardDescription>
      </CardHeader>

      {loading ? (
        <div className="space-y-4 mt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="pt-6 text-center">
            <p className="text-lg mb-4">You haven't placed any orders yet.</p>
            <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4">
          <Table>
            <TableCaption>A list of your recent orders</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{formatPrice(order.grandTotal)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => viewOrderDetails(order.id)}
                      className="flex items-center"
                    >
                      View <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
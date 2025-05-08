import { useState, useEffect } from "react";
import { useNavigate } from "wouter";
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

interface Order {
  id: number;
  status: string;
  total: string;
  createdAt: string;
  shippingAddress: {
    name: string;
    addressLine1: string;
    city: string;
    state: string;
    pinCode: string;
  };
  items: {
    id: number;
    name: string;
    price: string;
    quantity: number;
    imageUrl: string;
  }[];
}

export default function MyOrders() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
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
        const data = await apiRequest<Order[]>("/api/my-orders");
        setOrders(data);
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
                  <TableCell>{formatPrice(order.total)}</TableCell>
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
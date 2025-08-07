import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { CheckCircle, ChevronRight, Truck, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

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

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:id");
  const orderId = params?.id ? parseInt(params.id) : 0;
  
  const { data: response, isLoading } = useQuery<NewOrder | PaginatedResponse<NewOrder>>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Handle different response formats
  const order: NewOrder | null = React.useMemo(() => {
    if (!response) return null;
    
    // Check if response is paginated with new format: { count, next, previous, results }
    if (response && typeof response === 'object' && 'results' in response) {
      const results = (response as PaginatedResponse<NewOrder>).results;
      return Array.isArray(results) && results.length > 0 ? results[0] : null;
    }
    
    // Check if response is paginated with old format: { data }
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as any).data;
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    }
    
    // Check if response is a direct object
    if (response && typeof response === 'object' && 'id' in response) {
      return response as NewOrder;
    }
    
    return null;
  }, [response]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-10 w-3/4 mb-6" />
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-6" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Order Not Found</h1>
        <p className="text-gray-600 mb-6">The order you are looking for does not exist or has been removed.</p>
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Order Confirmation - Aquatic Exotica</title>
        <meta name="description" content={`Thank you for your order #${order.id}. Your purchase has been confirmed and will be shipped soon.`} />
        <meta property="og:title" content="Order Confirmation - Aquatic Exotica" />
        <meta property="og:description" content={`Thank you for your order #${order.id}. Your purchase has been confirmed and will be shipped soon.`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-gray-500 mb-8">
            <Link href="/home" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link href="/shop" className="hover:text-primary">Shop</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-700 font-medium">Order Confirmation</span>
          </div>

          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-heading font-bold mb-2">Thank You for Your Order!</h1>
            <p className="text-xl text-gray-600 mb-2">
              Your order #{order.id} has been received
            </p>
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mt-4 max-w-lg mx-auto">
              <p className="font-medium mb-1">Stock Check in Progress</p>
              <p className="text-sm">
                We are currently checking if the stock is available for your order. 
                We will contact you shortly via WhatsApp with further details about 
                availability, payment options, and delivery.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">Shipping Address</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 ml-7">
                <p>{order.shippingAddress.recipientName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>{`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`}</p>
                <p>{order.shippingAddress.country}</p>
                <p>Phone: {order.shippingAddress.recipientPhone}</p>
              </div>
            </div>
            
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <CalendarClock className="h-5 w-5 text-primary mr-2" />
                  <span className="font-medium">Order Date</span>
                </div>
                <span className="text-sm">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="ml-7 text-sm text-gray-600">Payment Status</span>
                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending confirmation</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="ml-7 text-sm text-gray-600">Order Status</span>
                <span className="text-sm capitalize bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  {order.status}
                </span>
              </div>
            </div>
            
            <h3 className="font-medium mb-3">Order Items</h3>
            <ul className="divide-y">
              {Array.isArray(order.items) && order.items.map((item, index: number) => (
                <li key={index} className="py-3 flex items-center">
                  <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <div className="flex justify-between mt-1 text-sm">
                      <span className="text-gray-600">Qty: {item.quantity}</span>
                      <span>{formatPrice(item.totalPrice)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(Number(order.totalAmount))}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Shipping</span>
                <span>{formatPrice(Number(order.shippingCost))}</span>
              </div>
              <div className="flex justify-between py-1 text-lg font-semibold mt-2">
                <span>Total</span>
                <span>{formatPrice(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button asChild variant="outline" className="border-2">
              <Link href="/home">Return to Home</Link>
            </Button>
            <Button asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState, useEffect } from "react";
import { DataTable, PaginationProps } from "@/components/admin/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, PenLine } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Order } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  processing: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-green-100 text-green-800 border-green-300",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export default function OrderManagement() {
  const { toast } = useToast();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<NewOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [allOrders, setAllOrders] = useState<NewOrder[]>([]);
  const [fetchedPages, setFetchedPages] = useState<Set<number>>(new Set());
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Build API endpoint for orders
  const buildOrdersEndpoint = (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(itemsPerPage)
    });
    
    if (debouncedSearchQuery) {
      params.append('query', debouncedSearchQuery);
    }
    
    return `/api/orders/?${params.toString()}`;
  };

  // Fetch current page of orders
  const { data: currentPageData, isLoading } = useQuery({
    queryKey: ["/api/orders/", currentPage, itemsPerPage, debouncedSearchQuery],
    queryFn: async () => {
      console.log('📦 OrderManagement API call:', buildOrdersEndpoint(currentPage));
      const response = await apiRequest(buildOrdersEndpoint(currentPage));
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return response || [];
    },
  });
  
  // Update all orders when current page data changes
  React.useEffect(() => {
    if (currentPageData && currentPageData.length > 0) {
      setAllOrders(prev => {
        const newOrders = [...prev];
        const startIndex = (currentPage - 1) * itemsPerPage;
        
        // Replace orders for this page
        currentPageData.forEach((order: NewOrder, index: number) => {
          newOrders[startIndex + index] = order;
        });
        
        return newOrders;
      });
      
      setFetchedPages(prev => new Set(Array.from(prev).concat([currentPage])));
      
      // Check if we have more pages
      if (currentPageData.length < itemsPerPage) {
        setHasMorePages(false);
      }
    } else if (currentPageData && currentPageData.length === 0) {
      // No more data
      setHasMorePages(false);
    }
  }, [currentPageData, currentPage, itemsPerPage]);

  // Reset pagination when search changes
  React.useEffect(() => {
    setAllOrders([]);
    setFetchedPages(new Set());
    setHasMorePages(true);
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Function to fetch a specific page
  const fetchPage = async (page: number) => {
    if (fetchedPages.has(page)) return;
    
    setIsLoadingMore(true);
    try {
      const response = await apiRequest(buildOrdersEndpoint(page));
      
      // Handle new pagination format: { count, next, previous, results }
      let pageData;
      if (response && typeof response === 'object' && 'results' in response) {
        pageData = response.results || [];
      } else {
        pageData = response || [];
      }
      
      setAllOrders(prev => {
        const newOrders = [...prev];
        const startIndex = (page - 1) * itemsPerPage;
        
        // Replace orders for this page
        pageData.forEach((order: NewOrder, index: number) => {
          newOrders[startIndex + index] = order;
        });
        
        return newOrders;
      });
      
      setFetchedPages(prev => new Set(Array.from(prev).concat([page])));
      
      // Check if we have more pages
      if (pageData.length < itemsPerPage) {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Error fetching page:', page, error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Calculate total pages based on fetched data
  const totalPages = Math.max(
    Math.ceil(allOrders.length / itemsPerPage),
    Math.max(...Array.from(fetchedPages), 0)
  );

  // Get orders for current page
  const orders: NewOrder[] = allOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ).filter(Boolean);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/"] });
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully",
      });
      setIsStatusOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update order status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-300";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleViewOrder = (order: NewOrder) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const handleUpdateStatus = (order: NewOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusOpen(true);
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !newStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({ id: selectedOrder.id, status: newStatus });
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    
    // Fetch the page if not already fetched
    if (!fetchedPages.has(page)) {
      await fetchPage(page);
    }
    
    // Pre-fetch next page if available
    if (hasMorePages && !fetchedPages.has(page + 1)) {
      fetchPage(page + 1);
    }
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setAllOrders([]);
    setFetchedPages(new Set());
    setHasMorePages(true);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Order Management</h2>
      </div>

      {orders && (
        <DataTable 
          data={orders}
          searchField={{
            placeholder: "Search orders...",
            value: searchQuery,
            onChange: setSearchQuery
          }}
          columns={[
            {
              header: "Order ID",
              accessor: "id",
              className: "font-medium"
            },
            {
              header: "Customer",
              accessor: (order: NewOrder) => order.shippingAddress.recipientName
            },
            {
              header: "Items",
              accessor: (order: NewOrder) => order.items.length
            },
            {
              header: "Total",
              accessor: (order: NewOrder) => formatCurrency(order.grandTotal)
            },
            {
              header: "Status",
              accessor: (order: NewOrder) => getStatusBadge(order.status)
            },
            {
              header: "Date",
              accessor: (order: NewOrder) => formatDate(order.createdAt)
            },
            {
              header: "Actions",
              accessor: (order: NewOrder) => (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleViewOrder(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleUpdateStatus(order)}
                  >
                    <PenLine className="h-4 w-4" />
                  </Button>
                </div>
              ),
              className: "text-right"
            }
          ]}
          pagination={{
            page: currentPage,
            limit: itemsPerPage,
            totalCount: allOrders.length,
            totalPages: totalPages
          }}
          isLoading={isLoading}
          emptyMessage="No orders found."
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* View Order Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Order details and items
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <div className="mt-1">{formatDate(selectedOrder.createdAt)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Amount</Label>
                    <div className="mt-1">{formatCurrency(selectedOrder.grandTotal)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Shipping Cost</Label>
                    <div className="mt-1">{formatPrice(selectedOrder.shippingCost)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div><strong>{selectedOrder.shippingAddress.recipientName}</strong></div>
                    <div>{selectedOrder.shippingAddress.addressLine1}</div>
                    {selectedOrder.shippingAddress.addressLine2 && (
                      <div>{selectedOrder.shippingAddress.addressLine2}</div>
                    )}
                    <div>
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </div>
                    <div>{selectedOrder.shippingAddress.country}</div>
                    <div>Phone: {selectedOrder.shippingAddress.recipientPhone}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items ({selectedOrder.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(item.totalPrice)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Status
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
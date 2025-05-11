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
import { Order } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ImageWithFallback } from "@/components/ui/image";

// Define order item type
interface OrderItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string;
}

// Define address type
interface Address {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Fetch orders with pagination and search
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["/api/admin/orders", currentPage, itemsPerPage, debouncedSearchQuery],
    queryFn: async ({ queryKey }) => {
      const basePath = queryKey[0] as string;
      const page = queryKey[1] as number;
      const limit = queryKey[2] as number;
      const query = queryKey[3] as string;
      
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      
      if (query) {
        params.append('query', query);
      }
      
      const res = await fetch(`${basePath}?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to fetch orders");
      return await res.json();
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include"
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update order status");
      }
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate query to refresh orders list
      const queryKey = ["/api/admin/orders", currentPage, itemsPerPage, debouncedSearchQuery];
      queryKey.forEach((_, index) => {
        const partialKey = queryKey.slice(0, index + 1);
        queryClient.invalidateQueries({ queryKey: partialKey });
      });
      
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
      <span className={`px-2 py-1 text-xs rounded-full border ${colorClass}`}>
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
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const handleUpdateStatus = (order: Order) => {
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Order Management</h2>
      </div>

      {ordersResponse && (
        <DataTable 
          data={ordersResponse.data || []}
          searchField={{
            placeholder: "Search orders...",
            value: searchQuery,
            onChange: setSearchQuery
          }}
          columns={[
            {
              header: "Order ID",
              accessor: (order: Order) => (
                <span className="font-medium">#{order.id}</span>
              )
            },
            {
              header: "Customer",
              accessor: (order: Order) => (
                <div>
                  <p className="font-medium">{order.customerName || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{order.customerEmail || "No email"}</p>
                </div>
              )
            },
            {
              header: "Date",
              accessor: (order: Order) => formatDate(order.createdAt)
            },
            {
              header: "Total",
              accessor: (order: Order) => formatCurrency(Number(order.total) || 0)
            },
            {
              header: "Status",
              accessor: (order: Order) => getStatusBadge(order.status)
            },
            {
              header: "Actions",
              accessor: (order: Order) => (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleViewOrder(order)}
                    title="View Order"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleUpdateStatus(order)}
                    title="Update Status"
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
            totalCount: ordersResponse.pagination.totalCount,
            totalPages: ordersResponse.pagination.totalPages
          }}
          isLoading={isLoading}
          emptyMessage="No orders found."
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      {/* View Order Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Placed on {selectedOrder && formatDate(selectedOrder.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p><span className="font-medium">Name:</span> {selectedOrder.customerName || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail || 'N/A'}</p>
                      <p><span className="font-medium">Phone:</span> {selectedOrder.customerPhone || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p><span className="font-medium">Status:</span> {getStatusBadge(selectedOrder.status)}</p>
                      <p><span className="font-medium">Total:</span> {formatCurrency(Number(selectedOrder.total) || 0)}</p>
                      <p><span className="font-medium">Order Date:</span> {formatDate(selectedOrder.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px] border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Product</th>
                          <th className="text-right p-2">Price</th>
                          <th className="text-right p-2">Quantity</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder.items as any[])?.map((item: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 flex items-center gap-2">
                              {item.imageUrl && (
                                <ImageWithFallback 
                                  src={item.imageUrl} 
                                  alt={item.name} 
                                  className="w-10 h-10 object-cover rounded" 
                                />
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">ID: {item.id}</p>
                              </div>
                            </td>
                            <td className="p-2 text-right">{formatCurrency(Number(item.price))}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{formatCurrency(Number(item.price) * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-medium">
                          <td colSpan={3} className="p-2 text-right">Total:</td>
                          <td className="p-2 text-right">{formatCurrency(Number(selectedOrder.total))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewOpen(false);
                    handleUpdateStatus(selectedOrder);
                  }}
                >
                  Update Status
                </Button>
              </div>
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
              Change the status for order #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleStatusSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newStatus}
                onValueChange={setNewStatus}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select a status" />
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsStatusOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateStatusMutation.isPending}
              >
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
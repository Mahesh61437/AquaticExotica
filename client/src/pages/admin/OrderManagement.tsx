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
import { Input } from "@/components/ui/input";
import { Loader2, Eye, PenLine, Edit, Plus, Minus, Trash2, Save, X, CalendarIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Order } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPrice, generateProductUrl, cn } from "@/lib/utils";
import { format, startOfDay, endOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import React from "react";

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<NewOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Debouncing for quantity updates
  const quantityUpdateTimeoutsRef = React.useRef<Map<number, number>>(new Map());
  const pendingUpdatesRef = React.useRef<Map<number, { quantity: number; price: string }>>(new Map());

  // Track items being deleted to prevent duplicate delete calls
  const deletingItemsRef = React.useRef<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>("all");
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
      params.append('search', debouncedSearchQuery);
    }

    if (filterStatus && filterStatus !== "all") {
      params.append('status', filterStatus);
    }

    if (startDate) {
      params.append('start_date', format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss"));
    }
    if (endDate) {
      params.append('end_date', format(endOfDay(endDate), "yyyy-MM-dd'T'HH:mm:ss"));
    }

    return `/api/orders/?${params.toString()}`;
  };

  // Fetch current page of orders
  const { data: currentPageResponse, isLoading } = useQuery({
    queryKey: ["/api/orders/", currentPage, itemsPerPage, debouncedSearchQuery, filterStatus, startDate, endDate],
    queryFn: async () => {
      console.log('📦 Admin OrderManagement API call:', buildOrdersEndpoint(currentPage));
      const response = await apiRequest(buildOrdersEndpoint(currentPage));

      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response;
      }

      // Fallback to array format
      return {
        count: response?.length || 0,
        next: null,
        previous: null,
        results: response || []
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Extract data from response
  const currentPageData = currentPageResponse?.results || [];
  const totalCount = currentPageResponse?.count || currentPageData.length || 0;

  // Initialize component state from React Query cache when component mounts
  React.useEffect(() => {
    if (currentPageData && currentPageData.length > 0) {
      // If we have data in the cache, initialize the component state
      setAllOrders(prev => {
        if (prev.length === 0) {
          // Only initialize if we don't already have data
          const newOrders = new Array(itemsPerPage * 10).fill(null); // Pre-allocate space
          const startIndex = (currentPage - 1) * itemsPerPage;

          // Set the current page data
          currentPageData.forEach((order: NewOrder, index: number) => {
            newOrders[startIndex + index] = order;
          });

          return newOrders;
        }
        return prev;
      });

      setFetchedPages(prev => {
        if (prev.size === 0) {
          return new Set([currentPage]);
        }
        return prev;
      });

      setHasMorePages(true);
    }
  }, [currentPageData, currentPage, itemsPerPage]);

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

  // Reset pagination when filters change
  const prevFiltersRef = React.useRef({ debouncedSearchQuery, filterStatus, startDate, endDate });
  React.useEffect(() => {
    if (
      prevFiltersRef.current.debouncedSearchQuery !== debouncedSearchQuery ||
      prevFiltersRef.current.filterStatus !== filterStatus ||
      prevFiltersRef.current.startDate !== startDate ||
      prevFiltersRef.current.endDate !== endDate
    ) {
      setAllOrders([]);
      setFetchedPages(new Set());
      setHasMorePages(true);
      setCurrentPage(1);
      prevFiltersRef.current = { debouncedSearchQuery, filterStatus, startDate, endDate };
    }
  }, [debouncedSearchQuery, filterStatus, startDate, endDate]);

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

  // Calculate total pages based on API response count (minimum 1 page)
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  // Get orders for current page
  const orders: NewOrder[] = allOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ).filter(Boolean);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/orders/${id}/update_status/`, {
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
    setEditedItems([...order.items]);
    setIsEditMode(false);
    setIsViewOpen(true);
  };

  const handleEditOrder = () => {
    if (selectedOrder) {
      setIsEditMode(true);
      setEditedItems([...selectedOrder.items]);
    }
  };

  const handleCancelEdit = () => {
    if (selectedOrder) {
      // Clear all pending timeouts
      quantityUpdateTimeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      quantityUpdateTimeoutsRef.current.clear();
      pendingUpdatesRef.current.clear();
      deletingItemsRef.current.clear();

      setIsEditMode(false);
      setEditedItems([...selectedOrder.items]);
      setIsAddingProduct(false);
      setProductSearchQuery("");
      setSearchResults([]);
    }
  };

  // Search products for adding to order
  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await apiRequest(`/api/products/?q=${encodeURIComponent(query)}&page_size=10`);
      const products = response?.results || response || [];
      setSearchResults(products);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(productSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearchQuery]);

  // Cleanup pending updates when dialog closes or component unmounts
  useEffect(() => {
    return () => {
      // Clear all quantity update timeouts
      quantityUpdateTimeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      quantityUpdateTimeoutsRef.current.clear();
      pendingUpdatesRef.current.clear();
      deletingItemsRef.current.clear();
    };
  }, [isViewOpen]);

  // Add order item mutation
  const addOrderItemMutation = useMutation({
    mutationFn: async ({ orderId, productId, variantId, quantity, price }: {
      orderId: number;
      productId: number;
      variantId: number | null;
      quantity: number;
      price: string;
    }) => {
      return await apiRequest(`/api/orders/${orderId}/items/`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: productId,
          variant: variantId,
          quantity: quantity,
          price: price
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/"] });
      // Refresh order data
      if (selectedOrder) {
        apiRequest(`/api/orders/${selectedOrder.id}`).then((order) => {
          setSelectedOrder(order);
          setEditedItems(order.items || []);
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update order item mutation
  const updateOrderItemMutation = useMutation({
    mutationFn: async ({ orderId, itemId, quantity, price }: {
      orderId: number;
      itemId: number;
      quantity: number;
      price: string;
    }) => {
      return await apiRequest(`/api/orders/${orderId}/items/${itemId}/`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: quantity,
          price: price
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/"] });
      // Refresh order data
      if (selectedOrder) {
        apiRequest(`/api/orders/${selectedOrder.id}`).then((order) => {
          setSelectedOrder(order);
          setEditedItems(order.items || []);
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete order item mutation
  const deleteOrderItemMutation = useMutation({
    mutationFn: async ({ orderId, itemId }: { orderId: number; itemId: number }) => {
      return await apiRequest(`/api/orders/${orderId}/items/${itemId}/`, {
        method: 'DELETE'
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/"] });
      // Refresh order data
      if (selectedOrder) {
        apiRequest(`/api/orders/${selectedOrder.id}`).then((order) => {
          setSelectedOrder(order);
          setEditedItems(order.items || []);
        });
      }
      // Remove from deleting set
      deletingItemsRef.current.delete(variables.itemId);
      toast({
        title: "Item Removed",
        description: "Item has been removed from the order",
      });
    },
    onError: (error: Error, variables) => {
      // Remove from deleting set even on error so user can retry
      deletingItemsRef.current.delete(variables.itemId);
      toast({
        title: "Error",
        description: `Failed to remove item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleUpdateItemQuantity = (itemId: number, newQuantity: number) => {
    if (!selectedOrder) return;

    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    // Update local state immediately for better UX
    setEditedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedPrice = parseFloat(item.price);
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: updatedPrice * newQuantity
        };
      }
      return item;
    }));

    // Find the item to get current price
    const item = editedItems.find(i => i.id === itemId);
    if (!item) return;

    // Store pending update
    pendingUpdatesRef.current.set(itemId, {
      quantity: newQuantity,
      price: item.price
    });

    // Clear existing timeout for this item
    const existingTimeout = quantityUpdateTimeoutsRef.current.get(itemId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new debounced timeout (500ms delay)
    const timeoutId = window.setTimeout(() => {
      const pendingUpdate = pendingUpdatesRef.current.get(itemId);
      if (pendingUpdate && selectedOrder) {
        // Remove from pending updates
        pendingUpdatesRef.current.delete(itemId);
        quantityUpdateTimeoutsRef.current.delete(itemId);

        // Make API call
        updateOrderItemMutation.mutate({
          orderId: selectedOrder.id,
          itemId: itemId,
          quantity: pendingUpdate.quantity,
          price: pendingUpdate.price
        });
      }
    }, 500);

    quantityUpdateTimeoutsRef.current.set(itemId, timeoutId);
  };

  const handleRemoveItem = (itemId: number) => {
    if (!selectedOrder) return;

    // Prevent duplicate delete calls
    if (deletingItemsRef.current.has(itemId)) {
      console.log('⚠️ Delete already in progress for item', itemId);
      return;
    }

    // Mark as being deleted
    deletingItemsRef.current.add(itemId);

    // Clear any pending update for this item
    const existingTimeout = quantityUpdateTimeoutsRef.current.get(itemId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      quantityUpdateTimeoutsRef.current.delete(itemId);
    }
    pendingUpdatesRef.current.delete(itemId);

    // Update local state immediately
    setEditedItems(prev => prev.filter(item => item.id !== itemId));

    // Call API to delete immediately (no debounce for delete)
    deleteOrderItemMutation.mutate(
      {
        orderId: selectedOrder.id,
        itemId: itemId
      },
      {
        onSettled: () => {
          // Remove from deleting set after API call completes (success or error)
          deletingItemsRef.current.delete(itemId);
        }
      }
    );
  };

  const handleAddProductToOrder = (product: any, variant?: any) => {
    if (!selectedOrder) return;

    const price = variant ? parseFloat(variant.offerPrice || variant.originalPrice) : parseFloat(product.price || '0');
    const quantity = 1;
    const priceString = price.toFixed(2);

    // Optimistically add to local state
    const tempId = Date.now();
    const newItem: OrderItem = {
      id: tempId, // Temporary ID until API returns real ID
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        thumbnailUrl: product.thumbnailUrl
      },
      variant: variant ? {
        id: variant.id,
        product: product.id,
        variantType: variant.variantType,
        description: variant.description,
        stock: variant.stock,
        originalPrice: variant.originalPrice,
        offerPrice: variant.offerPrice,
        savings: variant.savings || '0',
        discountPercentage: variant.discountPercentage,
        isInStock: variant.isInStock
      } : null,
      quantity: quantity,
      price: priceString,
      totalPrice: price * quantity
    };

    setEditedItems(prev => [...prev, newItem]);
    setIsAddingProduct(false);
    setProductSearchQuery("");
    setSearchResults([]);

    // Call API to add item
    addOrderItemMutation.mutate({
      orderId: selectedOrder.id,
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity: quantity,
      price: priceString
    });
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
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">Order Management</h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Status Filter</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-gray-400">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {(filterStatus !== "all" || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus("all");
                setStartDate(undefined);
                setEndDate(undefined);
              }}
              className="h-8 px-2 lg:px-3 mt-6"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
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
            totalCount: totalCount,
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
                    <div className="mt-1">
                      {isEditMode ? (
                        formatCurrency(
                          editedItems.reduce((sum, item) => sum + item.totalPrice, 0) +
                          parseFloat(selectedOrder.shippingCost)
                        )
                      ) : (
                        formatCurrency(selectedOrder.grandTotal)
                      )}
                    </div>
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Order Items ({isEditMode ? editedItems.length : selectedOrder.items.length})</CardTitle>
                  {!isEditMode && (
                    <Button variant="outline" size="sm" onClick={handleEditOrder}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Items
                    </Button>
                  )}
                  {isEditMode && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={addOrderItemMutation.isPending || updateOrderItemMutation.isPending || deleteOrderItemMutation.isPending}
                      >
                        {(addOrderItemMutation.isPending || updateOrderItemMutation.isPending || deleteOrderItemMutation.isPending) ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Done
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(isEditMode ? editedItems : selectedOrder.items).map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
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
                          {isEditMode ? (
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-20 text-center"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <span className="text-sm text-muted-foreground ml-2">
                                × {formatPrice(item.price)}
                              </span>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 ml-auto"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} × {formatPrice(item.price)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(item.totalPrice)}</div>
                        </div>
                      </div>
                    ))}

                    {isEditMode && (
                      <div className="border-t pt-4">
                        {!isAddingProduct ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsAddingProduct(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              placeholder="Search products..."
                              value={productSearchQuery}
                              onChange={(e) => setProductSearchQuery(e.target.value)}
                            />
                            {searchResults.length > 0 && (
                              <div className="border rounded-lg max-h-60 overflow-y-auto">
                                {searchResults.map((product) => (
                                  <div key={product.id} className="p-2 border-b hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">{product.name}</p>
                                        {product.variants && product.variants.length > 0 ? (
                                          <div className="mt-1">
                                            {product.variants.map((variant: any) => (
                                              <Button
                                                key={variant.id}
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => handleAddProductToOrder(product, variant)}
                                              >
                                                {variant.description || variant.variantType} - {formatPrice(variant.offerPrice || variant.originalPrice)}
                                              </Button>
                                            ))}
                                          </div>
                                        ) : (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs mt-1"
                                            onClick={() => handleAddProductToOrder(product)}
                                          >
                                            Add - {formatPrice(product.price || '0')}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsAddingProduct(false);
                                setProductSearchQuery("");
                                setSearchResults([]);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditMode && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">New Total:</span>
                        <span className="text-lg font-bold">
                          {formatCurrency(
                            editedItems.reduce((sum, item) => sum + item.totalPrice, 0) +
                            parseFloat(selectedOrder.shippingCost)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
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
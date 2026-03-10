import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Package, ClipboardList } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ProcessingSummary {
    orders: any[];
    aggregated_items: any[];
}

export default function CurrentOrders() {
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

    const { data, isLoading, error } = useQuery<ProcessingSummary>({
        queryKey: ["/api/orders/processing-summary/"],
        queryFn: async () => await apiRequest("/api/orders/processing-summary/"),
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                Error loading current orders: {(error as any).message}
            </div>
        );
    }

    const { orders = [], aggregated_items = [] } = data || {};

    const handleViewOrder = (order: any) => {
        setSelectedOrder(order);
        setIsViewOpen(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8">
            {/* Aggregated Packing List */}
            <Card className="border-primary/20 shadow-md">
                <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2 text-primary font-bold">
                        <Package className="h-5 w-5" />
                        Aggregated Packing List
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">
                        Total items needed for all {orders.length} processing orders.
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Variant</TableHead>
                                <TableHead className="text-right">Total Quantity</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aggregated_items.length > 0 ? (
                                aggregated_items.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.productName}
                                                    className="h-12 w-12 object-cover rounded-md border"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 bg-muted rounded-md border flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-semibold text-primary">{item.productName}</TableCell>
                                        <TableCell className="text-muted-foreground italic font-medium">
                                            {item.variantName || <span className="text-gray-400 not-italic">N/A</span>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="text-base px-3 py-1 font-bold">
                                                {item.totalQuantity}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 font-medium text-muted-foreground">
                                        No items to pack.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Individual Orders List */}
            <Card className="shadow-lg border-gray-200">
                <CardHeader className="bg-gray-50/50 border-b">
                    <CardTitle className="flex items-center gap-2 text-gray-800 font-bold">
                        <ClipboardList className="h-5 w-5 text-gray-600" />
                        Processing Orders ({orders.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/30">
                                <TableHead className="w-[100px]">Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-center">Items</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-bold text-primary">#{order.id}</TableCell>
                                        <TableCell>
                                            <div className="font-semibold">
                                                {order.shippingAddress?.recipientName || "N/A"}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium">
                                                {order.shippingAddress?.city}, {order.shippingAddress?.state}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-gray-600">
                                            {formatDate(order.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-700">
                                            {formatPrice(order.grandTotal)}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            <Badge variant="outline" className="font-bold">{order.items.length}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewOrder(order)}
                                                className="hover:text-primary hover:bg-primary/5 font-bold"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Full Order
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 font-medium text-muted-foreground">
                                        No processing orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Order Dialog */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Order Details #{selectedOrder?.id}</DialogTitle>
                        <DialogDescription className="font-medium">
                            Full order information and items list.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <ScrollArea className="max-h-[70vh] pr-4">
                            <div className="space-y-6 pt-4">
                                {/* Customer & Shipping */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-gray-800 border-b pb-1">Customer Info</h3>
                                        <div className="space-y-2 text-sm">
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground font-medium">Name:</span>
                                                <span className="font-bold">{selectedOrder.shippingAddress?.recipientName}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground font-medium">Phone:</span>
                                                <span className="font-bold">{selectedOrder.shippingAddress?.recipientPhone}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-muted-foreground font-medium">Date:</span>
                                                <span className="font-bold">{formatDate(selectedOrder.createdAt)}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-gray-800 border-b pb-1">Shipping Address</h3>
                                        <div className="space-y-1 text-sm font-medium">
                                            <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                                            {selectedOrder.shippingAddress?.addressLine2 && (
                                                <p>{selectedOrder.shippingAddress?.addressLine2}</p>
                                            )}
                                            <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}</p>
                                            <p>{selectedOrder.shippingAddress?.country}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-800 border-b pb-1">Order Items</h3>
                                    <div className="rounded-lg border overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-gray-50">
                                                <TableRow>
                                                    <TableHead className="font-bold">Product</TableHead>
                                                    <TableHead className="font-bold text-center">Qty</TableHead>
                                                    <TableHead className="font-bold text-right">Price</TableHead>
                                                    <TableHead className="font-bold text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedOrder.items.map((item: any) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <div className="font-bold text-primary">{item.product.name}</div>
                                                            {item.variant && (
                                                                <div className="text-xs text-muted-foreground italic font-medium">
                                                                    {item.variant.description}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className="font-bold">{item.quantity}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatPrice(item.price)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            {formatPrice(item.totalPrice)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-gray-50/50">
                                                    <TableCell colSpan={3} className="text-right font-bold text-gray-600">Subtotal</TableCell>
                                                    <TableCell className="text-right font-bold">{formatPrice(selectedOrder.totalAmount)}</TableCell>
                                                </TableRow>
                                                <TableRow className="bg-gray-50/50">
                                                    <TableCell colSpan={3} className="text-right font-bold text-gray-600">Shipping</TableCell>
                                                    <TableCell className="text-right font-bold">{formatPrice(selectedOrder.shippingCost)}</TableCell>
                                                </TableRow>
                                                <TableRow className="bg-primary/5">
                                                    <TableCell colSpan={3} className="text-right text-lg font-black text-primary">Grand Total</TableCell>
                                                    <TableCell className="text-right text-lg font-black text-emerald-700">{formatPrice(selectedOrder.grandTotal)}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

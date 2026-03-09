import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Package, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
    id: number;
    product: {
        id: number;
        name: string;
        imageUrl: string;
    };
    quantity: number;
    price: string;
    totalPrice: number;
}

interface Order {
    id: number;
    items: OrderItem[];
    status: string;
    grandTotal: number;
}

interface AggregatedSales {
    productId: number;
    name: string;
    imageUrl: string;
    quantitySold: number;
    totalRevenue: number;
}

export default function ProductSales() {
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch all orders (using a large page size to get most data for now)
    // In a real large-scale app, this should be a backend aggregation
    const { data: ordersResponse, isLoading } = useQuery({
        queryKey: ["/api/orders/", { page_size: 1000 }],
        queryFn: async () => {
            const response = await apiRequest("/api/orders/?page_size=1000");
            return response?.results || response || [];
        },
    });

    const salesData = useMemo(() => {
        if (!ordersResponse || !Array.isArray(ordersResponse)) return [];

        const aggregation: Record<number, AggregatedSales> = {};
        let totalItems = 0;
        let totalRev = 0;

        ordersResponse.forEach((order: Order) => {
            // Typically we only count sales for completed/shipped orders, 
            // but the user asked for "sold so far" which might include processing.
            // We'll exclude 'cancelled' orders.
            if (order.status.toLowerCase() === 'cancelled') return;

            order.items?.forEach((item: OrderItem) => {
                const productId = item.product.id;
                if (!aggregation[productId]) {
                    aggregation[productId] = {
                        productId,
                        name: item.product.name,
                        imageUrl: item.product.imageUrl,
                        quantitySold: 0,
                        totalRevenue: 0,
                    };
                }

                aggregation[productId].quantitySold += item.quantity;
                aggregation[productId].totalRevenue += parseFloat(item.price) * item.quantity;

                totalItems += item.quantity;
                totalRev += parseFloat(item.price) * item.quantity;
            });
        });

        return Object.values(aggregation).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [ordersResponse]);

    const totals = useMemo(() => {
        return salesData.reduce((acc, curr) => ({
            quantity: acc.quantity + curr.quantitySold,
            revenue: acc.revenue + curr.totalRevenue
        }), { quantity: 0, revenue: 0 });
    }, [salesData]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredSalesData = useMemo(() => {
        return salesData.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [salesData, searchQuery]);

    const paginatedSalesData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSalesData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSalesData, currentPage, itemsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredSalesData.length / itemsPerPage));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Products Sold</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.quantity}</div>
                        <p className="text-xs text-muted-foreground">Across all successful orders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(totals.revenue.toString())}</div>
                        <p className="text-xs text-muted-foreground">Total sales value</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Unique Products Sold</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{salesData.length}</div>
                        <p className="text-xs text-muted-foreground">Distinct items purchased</p>
                    </CardContent>
                </Card>
            </div>

            <DataTable
                data={paginatedSalesData}
                isLoading={isLoading}
                pagination={{
                    page: currentPage,
                    limit: itemsPerPage,
                    totalCount: filteredSalesData.length,
                    totalPages: totalPages
                }}
                onPageChange={setCurrentPage}
                onLimitChange={(limit) => {
                    setItemsPerPage(limit);
                    setCurrentPage(1);
                }}
                searchField={{
                    placeholder: "Search products...",
                    value: searchQuery,
                    onChange: (val) => {
                        setSearchQuery(val);
                        setCurrentPage(1);
                    }
                }}
                columns={[
                    {
                        header: "Product",
                        accessor: (row: AggregatedSales) => (
                            <div className="flex items-center gap-3">
                                <img
                                    src={row.imageUrl}
                                    alt={row.name}
                                    className="h-10 w-10 rounded-md object-cover border"
                                />
                                <span className="font-medium">{row.name}</span>
                            </div>
                        )
                    },
                    {
                        header: "Quantity Sold",
                        accessor: "quantitySold",
                        className: "text-center"
                    },
                    {
                        header: "Total Revenue",
                        accessor: (row: AggregatedSales) => formatPrice(row.totalRevenue.toString()),
                        className: "text-right font-semibold"
                    }
                ]}
                emptyMessage="No sales data available yet."
            />
        </div>
    );
}

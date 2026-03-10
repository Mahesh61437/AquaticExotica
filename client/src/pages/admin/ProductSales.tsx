import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Package, DollarSign, CalendarIcon, X } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    createdAt: string;
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
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['processing', 'shipped', 'delivered']);

    const availableStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    const toggleStatus = (status: string) => {
        setSelectedStatuses((current: string[]) =>
            current.includes(status)
                ? current.filter((s: string) => s !== status)
                : [...current, status]
        );
    };

    // Fetch aggregated sales stats from backend
    const { data: salesStats, isLoading } = useQuery({
        queryKey: ["/api/orders/sales-stats/", {
            start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
            end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
            status: selectedStatuses
        }],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append("start_date", format(startDate, "yyyy-MM-dd"));
            if (endDate) params.append("end_date", format(endDate, "yyyy-MM-dd"));
            selectedStatuses.forEach(s => params.append("status[]", s));

            const response = await apiRequest(`/api/orders/sales-stats/?${params.toString()}`);
            return response;
        },
    });

    const summary = useMemo(() => salesStats?.summary || {
        totalRevenue: 0,
        totalShipping: 0,
        netRevenue: 0,
        grandTotal: 0,
        totalQuantity: 0,
        uniqueProducts: 0
    }, [salesStats]);

    const salesData = useMemo(() => salesStats?.products || [], [salesStats]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredSalesData = useMemo(() => {
        return salesData.filter((item: AggregatedSales) =>
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
            <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
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

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Order Status</label>
                        <div className="flex flex-wrap gap-2">
                            {availableStatuses.map(status => (
                                <Badge
                                    key={status}
                                    variant={selectedStatuses.includes(status) ? "default" : "outline"}
                                    className="cursor-pointer capitalize"
                                    onClick={() => toggleStatus(status)}
                                >
                                    {status}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {(startDate || endDate || selectedStatuses.length !== 3) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setStartDate(undefined);
                                setEndDate(undefined);
                                setSelectedStatuses(['processing', 'shipped', 'delivered']);
                            }}
                            className="h-8 px-2 lg:px-3 mt-6"
                        >
                            Reset
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatPrice(summary.netRevenue.toString())}</div>
                        <p className="text-xs text-muted-foreground">Product sales total</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Shipping Collected</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatPrice(summary.totalShipping.toString())}</div>
                        <p className="text-xs text-muted-foreground">Total delivery fees</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(summary.grandTotal.toString())}</div>
                        <p className="text-xs text-muted-foreground">Total order value</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalQuantity}</div>
                        <p className="text-xs text-muted-foreground">{summary.uniqueProducts} unique items</p>
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

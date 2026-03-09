import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, LayoutDashboard, ShoppingBag, Tags, Hash, ListOrdered, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductManagement from "./ProductManagement";
import CategoryManagement from "./CategoryManagement";
import TagManagement from "./TagManagement";
import OrderManagement from "./OrderManagement";
import UserManagement from "./UserManagement";
import ProductSales from "./ProductSales";

interface AdminStats {
  products: number;
  categories: number;
  orders: number;
  users: number;
  tags: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats>({
    products: 0,
    categories: 0,
    orders: 0,
    users: 0,
    tags: 0,
  });

  // Fetch admin stats
  const { data: productsResponse } = useQuery({
    queryKey: ["/api/products/"],
    queryFn: async () => await apiRequest("/api/products/"),
    enabled: !!currentUser?.isAdmin,
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ["/api/categories/"],
    queryFn: async () => await apiRequest("/api/categories/"),
    enabled: !!currentUser?.isAdmin,
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ["/api/orders/"],
    queryFn: async () => await apiRequest("/api/orders/"),
    enabled: !!currentUser?.isAdmin,
  });

  const { data: usersResponse } = useQuery({
    queryKey: ["/api/users/"],
    queryFn: async () => await apiRequest("/api/users/"),
    enabled: !!currentUser?.isAdmin,
  });

  const { data: tagsResponse } = useQuery({
    queryKey: ["/api/tags/"],
    queryFn: async () => await apiRequest("/api/tags/"),
    enabled: !!currentUser?.isAdmin,
  });

  // Update stats when data changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const getCount = (response: any): number => {
          if (!response) return 0;

          // Handle new pagination format: { count, next, previous, results }
          if (response && typeof response === 'object' && 'count' in response) {
            return response.count || 0;
          }

          // Handle array format (fallback)
          if (Array.isArray(response)) {
            return response.length;
          }

          // Handle old format with data property
          if (response && typeof response === 'object' && 'data' in response) {
            return Array.isArray(response.data) ? response.data.length : 0;
          }

          return 0;
        };

        setStats({
          products: getCount(productsResponse),
          categories: getCount(categoriesResponse),
          orders: getCount(ordersResponse),
          users: getCount(usersResponse),
          tags: getCount(tagsResponse)
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      }
    };

    if (currentUser?.isAdmin) {
      fetchStats();
    }
  }, [currentUser, productsResponse, categoriesResponse, ordersResponse, usersResponse, tagsResponse]);

  // ProtectedRoute ensures currentUser is not null and isAdmin, but TypeScript doesn't know that
  if (!currentUser || !currentUser.isAdmin) {
    return null;
  }

  return (
    <div className="container px-4 sm:px-6 md:px-8 py-10">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage products, categories, tags, orders, sales, and users.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full justify-start md:justify-center p-1 bg-muted/50 h-auto">
              <TabsTrigger value="overview" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <LayoutDashboard className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <ShoppingBag className="h-4 w-4" />
                <span>Products</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Tags className="h-4 w-4" />
                <span>Categories</span>
              </TabsTrigger>
              <TabsTrigger value="tags" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Hash className="h-4 w-4" />
                <span>Tags</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <ListOrdered className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                <BarChart3 className="h-4 w-4" />
                <span>Sales</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.products}</div>
                  <p className="text-xs text-muted-foreground">
                    Manage your product inventory
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Categories</CardTitle>
                  <Tags className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.categories}</div>
                  <p className="text-xs text-muted-foreground">
                    Organize your products
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tags</CardTitle>
                  <Hash className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.tags}</div>
                  <p className="text-xs text-muted-foreground">
                    Label your products
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <ListOrdered className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.orders}</div>
                  <p className="text-xs text-muted-foreground">
                    Process customer orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users}</div>
                  <p className="text-xs text-muted-foreground">
                    Manage user accounts
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle>Welcome to Admin Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    This is your control center for managing all aspects of your e-commerce store.
                    Use the tabs above to navigate between different sections.
                  </p>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>
                      <strong>Products</strong>: Add, edit, or remove products from your inventory
                    </li>
                    <li>
                      <strong>Categories</strong>: Organize your products into categories
                    </li>
                    <li>
                      <strong>Tags</strong>: Create and manage product tags for better organization
                    </li>
                    <li>
                      <strong>Orders</strong>: View and manage customer orders
                    </li>
                    <li>
                      <strong>Users</strong>: Manage user accounts and permissions
                    </li>
                    <li>
                      <strong>Sales</strong>: View detailed product sales performance and revenue
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="tags">
            <TagManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="sales">
            <ProductSales />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
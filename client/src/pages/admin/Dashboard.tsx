import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";
import ProductManagement from "./ProductManagement";
import CategoryManagement from "./CategoryManagement";
import OrderManagement from "./OrderManagement";
import UserManagement from "./UserManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  ShoppingBag,
  Tags,
  ListOrdered,
  Users,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    users: 0
  });

  // Fetch stats for the overview page
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get counts for all entities
        const [productsRes, categoriesRes, ordersRes, usersRes] = await Promise.all([
          fetch('/api/admin/products'),
          fetch('/api/admin/categories'),
          fetch('/api/admin/orders'),
          fetch('/api/admin/users')
        ]);
        
        const products = await productsRes.json();
        const categories = await categoriesRes.json();
        const orders = await ordersRes.json();
        const users = await usersRes.json();
        
        setStats({
          products: Array.isArray(products) ? products.length : 0,
          categories: Array.isArray(categories) ? categories.length : 0,
          orders: Array.isArray(orders) ? orders.length : 0,
          users: Array.isArray(users) ? users.length : 0
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      }
    };
    
    if (currentUser?.isAdmin) {
      fetchStats();
    }
  }, [currentUser]);

  // Redirect non-admin users
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage products, categories, orders, and users.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-5 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden md:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              <span className="hidden md:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              <span className="hidden md:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Products</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
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
                  <Tags className="h-4 w-4 text-muted-foreground" />
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
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <ListOrdered className="h-4 w-4 text-muted-foreground" />
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
                  <Users className="h-4 w-4 text-muted-foreground" />
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
                      <strong>Orders</strong>: View and manage customer orders
                    </li>
                    <li>
                      <strong>Users</strong>: Manage user accounts and permissions
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

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
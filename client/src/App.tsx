import React from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthCartIntegration } from "@/components/auth/AuthCartIntegration";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShoppingCart } from "@/components/layout/ShoppingCart";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
// Authentication pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
// Orders
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSetup from "./pages/AdminSetup";
// Information pages
import Contact from "./pages/Contact";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
// Test pages
import SignupTest from "./pages/SignupTest";
// Debug component
import DebugLogin from "./components/DebugLogin";
// Performance optimization
import { useEffect } from "react";
import { prefetchHomepageData } from "@/lib/api-cache";
import { preloadCriticalImages } from "@/lib/image-preloader";

// Protected Route Component
function ProtectedRoute({ children, requireAuth = false, requireAdmin = false }: { 
  children: React.ReactNode; 
  requireAuth?: boolean; 
  requireAdmin?: boolean; 
}) {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only redirect after auth state has been fully loaded
    if (!loading) {
      if (requireAuth && !currentUser) {
        setLocation('/login');
        return;
      }
      
      if (requireAdmin && (!currentUser || !currentUser.isAdmin)) {
        setLocation('/login');
        return;
      }
    }
  }, [currentUser, loading, requireAuth, requireAdmin, setLocation]);

  // Show loading state while auth is being restored
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (requireAuth && !currentUser) {
    return null;
  }
  
  if (requireAdmin && (!currentUser || !currentUser.isAdmin)) {
    return null;
  }

  return <>{children}</>;
}

// Home Redirect Component
function HomeRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation('/home');
  }, [setLocation]);
  
  return null;
}

function Router() {
  const [location] = useLocation();
  
  // Preload critical images and homepage data when app starts
  useEffect(() => {
    preloadCriticalImages();
    prefetchHomepageData();
  }, []);

  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/home" component={Home} />
      <Route path="/shop/:category?" component={Shop} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      
      {/* Authentication Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/signup-test" component={SignupTest} />
      <Route path="/account" component={Account} />
      
      {/* Order Routes */}
      <Route path="/my-orders" component={MyOrders} />
      <Route path="/order/:id" component={OrderDetail} />
      
      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/setup" component={AdminSetup} />
            <Route path="/admin/products" component={() => import("./pages/admin/ProductManagement").then(m => m.default)} />
            <Route path="/admin/categories" component={() => import("./pages/admin/CategoryManagement").then(m => m.default)} />
            <Route path="/admin/tags" component={() => import("./pages/admin/TagManagement").then(m => m.default)} />
            <Route path="/admin/orders" component={() => import("./pages/admin/OrderManagement").then(m => m.default)} />
            <Route path="/admin/users" component={() => import("./pages/admin/UserManagement").then(m => m.default)} />
          </Switch>
        </ProtectedRoute>
      </Route>
      
      {/* Information Pages */}
      <Route path="/contact" component={Contact} />
      <Route path="/shipping" component={Shipping} />
      <Route path="/faq" component={FAQ} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      
      {/* Debug Routes */}
      <Route path="/debug-login" component={DebugLogin} />
      
      {/* 404 Route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Router />
                </main>
                <Footer />
                <ShoppingCart />
                <AuthCartIntegration />
                <Toaster />
              </div>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

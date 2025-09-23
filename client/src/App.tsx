import React from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthCartIntegration } from "@/components/auth/AuthCartIntegration";
// import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
// import { PerformanceMonitor } from "@/components/analytics/PerformanceMonitor";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ShoppingCart } from "@/components/layout/ShoppingCart";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import SearchResults from "@/pages/SearchResults";
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
import Notifications from "./pages/admin/Notifications";
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
  // Prefetch all homepage data as soon as the app loads
  useEffect(() => {
    // Initialize prefetching immediately
    prefetchHomepageData();
    
    // Set up homepage data prefetching when user is idle
    let idleCallbackId: number;
    
    if ('requestIdleCallback' in window) {
      idleCallbackId = window.requestIdleCallback(() => {
        prefetchHomepageData();
      }, { timeout: 2000 }); // 2-second timeout in case the browser never gets to an "idle" state
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(() => {
        prefetchHomepageData();
      }, 200);
      
      idleCallbackId = Number(timeoutId);
    }
    
    return () => {
      if ('requestIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
      } else {
        clearTimeout(idleCallbackId);
      }
    };
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* This component handles cart merging when users log in */}
        <AuthCartIntegration />
        {/* <PerformanceMonitor /> */}
        <Switch>
          <Route path="/home" component={Home} />
          <Route path="/" component={HomeRedirect} />
          <Route path="/shop" component={Shop} />
          <Route path="/shop/:category" component={Shop} />
          <Route path="/search" component={SearchResults} />
          <Route path="/product/:slug" component={ProductDetail} />
          <Route path="/checkout" component={() => (
            <ProtectedRoute requireAuth={true}>
              <Checkout />
            </ProtectedRoute>
          )} />
          <Route path="/order-confirmation/:id" component={OrderConfirmation} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/account" component={() => (
            <ProtectedRoute requireAuth={true}>
              <Account />
            </ProtectedRoute>
          )} />
          <Route path="/my-orders" component={() => (
            <ProtectedRoute requireAuth={true}>
              <MyOrders />
            </ProtectedRoute>
          )} />
          <Route path="/orders/:id" component={() => (
            <ProtectedRoute requireAuth={true}>
              <OrderDetail />
            </ProtectedRoute>
          )} />
          <Route path="/admin" component={() => (
            <ProtectedRoute requireAuth={true} requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          )} />
          <Route path="/admin/notifications" component={() => (
            <ProtectedRoute requireAuth={true} requireAdmin={true}>
              <Notifications />
            </ProtectedRoute>
          )} />
          <Route path="/admin-setup" component={AdminSetup} />
          <Route path="/contact" component={Contact} />
          <Route path="/shipping" component={Shipping} />
          <Route path="/faq" component={FAQ} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/signup-test" component={SignupTest} />
          <Route path="/debug" component={DebugLogin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <ShoppingCart />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        {/* <AnalyticsProvider> */}
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        {/* </AnalyticsProvider> */}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

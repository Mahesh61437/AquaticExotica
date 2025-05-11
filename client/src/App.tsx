import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
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
// Performance optimization
import { useEffect } from "react";
import { prefetchHomepageData } from "@/lib/api-cache";

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
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/shop/:category" component={Shop} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/order-confirmation/:id" component={OrderConfirmation} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/account" component={Account} />
          <Route path="/my-orders" component={MyOrders} />
          <Route path="/orders/:id" component={OrderDetail} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin-setup" component={AdminSetup} />
          <Route path="/contact" component={Contact} />
          <Route path="/shipping" component={Shipping} />
          <Route path="/faq" component={FAQ} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/signup-test" component={SignupTest} />
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
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

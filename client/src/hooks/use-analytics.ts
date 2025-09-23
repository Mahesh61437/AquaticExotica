import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  initializeGA4, 
  trackPageView, 
  trackEvent, 
  trackProductView,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackCategoryView,
  trackUserEngagement,
  trackCartAbandonment,
  trackCheckoutStep,
  trackError,
  isGA4Loaded,
  setUserProperties,
  GA4_CONFIG
} from '@/lib/analytics';
import { useAuth } from '@/context/AuthContext';

// Custom hook for Google Analytics 4
export function useAnalytics() {
  const [location] = useLocation();
  const { currentUser } = useAuth();

  // Initialize GA4 when component mounts
  useEffect(() => {
    if (GA4_CONFIG.MEASUREMENT_ID && !isGA4Loaded()) {
      initializeGA4(GA4_CONFIG.MEASUREMENT_ID);
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (isGA4Loaded()) {
      trackPageView(location);
    }
  }, [location]);

  // Set user properties when user changes
  useEffect(() => {
    if (isGA4Loaded() && currentUser) {
      setUserProperties({
        user_id: currentUser.id.toString(),
        user_type: currentUser.isAdmin ? 'admin' : 'customer',
        user_status: 'logged_in',
      });
    } else if (isGA4Loaded()) {
      setUserProperties({
        user_status: 'anonymous',
      });
    }
  }, [currentUser]);

  // Analytics functions
  const analytics = {
    // Page tracking
    trackPage: useCallback((pagePath: string, pageTitle?: string) => {
      trackPageView(pagePath, pageTitle);
    }, []),

    // E-commerce tracking
    trackProductView: useCallback((product: {
      item_id: string;
      item_name: string;
      item_category: string;
      item_category2?: string;
      price: number;
      currency?: string;
    }) => {
      trackProductView(product);
    }, []),

    trackAddToCart: useCallback((product: {
      item_id: string;
      item_name: string;
      item_category: string;
      item_category2?: string;
      price: number;
      quantity: number;
      currency?: string;
    }) => {
      trackAddToCart(product);
    }, []),

    trackRemoveFromCart: useCallback((product: {
      item_id: string;
      item_name: string;
      item_category: string;
      item_category2?: string;
      price: number;
      quantity: number;
      currency?: string;
    }) => {
      trackRemoveFromCart(product);
    }, []),

    trackBeginCheckout: useCallback((cartItems: Array<{
      item_id: string;
      item_name: string;
      item_category: string;
      item_category2?: string;
      price: number;
      quantity: number;
    }>, totalValue: number, currency = 'USD') => {
      trackBeginCheckout(cartItems, totalValue, currency);
    }, []),

    trackPurchase: useCallback((transaction: {
      transaction_id: string;
      value: number;
      currency?: string;
      items: Array<{
        item_id: string;
        item_name: string;
        item_category: string;
        item_category2?: string;
        price: number;
        quantity: number;
      }>;
    }) => {
      trackPurchase(transaction);
    }, []),

    // User behavior tracking
    trackSearch: useCallback((searchTerm: string, resultsCount?: number) => {
      trackSearch(searchTerm, resultsCount);
    }, []),

    trackCategoryView: useCallback((categoryName: string, categoryId?: string) => {
      trackCategoryView(categoryName, categoryId);
    }, []),

    trackUserEngagement: useCallback((action: string, details?: Record<string, any>) => {
      trackUserEngagement(action, details);
    }, []),

    // Cart and checkout tracking
    trackCartAbandonment: useCallback((cartValue: number, itemCount: number) => {
      trackCartAbandonment(cartValue, itemCount);
    }, []),

    trackCheckoutStep: useCallback((step: number, stepName: string, value?: number) => {
      trackCheckoutStep(step, stepName, value);
    }, []),

    // Error tracking
    trackError: useCallback((errorType: string, errorMessage: string, errorLocation?: string) => {
      trackError(errorType, errorMessage, errorLocation);
    }, []),

    // Generic event tracking
    trackEvent: useCallback((eventName: string, parameters?: Record<string, any>) => {
      trackEvent(eventName, parameters);
    }, []),

    // Utility functions
    isLoaded: useCallback(() => {
      return isGA4Loaded();
    }, []),
  };

  return analytics;
}

// Hook for tracking product interactions
export function useProductAnalytics() {
  const { trackProductView, trackAddToCart, trackRemoveFromCart } = useAnalytics();

  const trackProductPageView = useCallback((product: {
    id: number;
    name: string;
    categories: Array<{ name: string; id: number }>;
    price: string;
  }) => {
    const price = parseFloat(product.price.replace(/[^0-9.-]+/g, ''));
    const primaryCategory = product.categories[0]?.name || 'Uncategorized';
    const secondaryCategory = product.categories[1]?.name;

    trackProductView({
      item_id: product.id.toString(),
      item_name: product.name,
      item_category: primaryCategory,
      item_category2: secondaryCategory,
      price: price,
      currency: 'USD',
    });
  }, [trackProductView]);

  const trackProductAddToCart = useCallback((product: {
    id: number;
    name: string;
    categories: Array<{ name: string; id: number }>;
    price: string;
    quantity: number;
  }) => {
    const price = parseFloat(product.price.replace(/[^0-9.-]+/g, ''));
    const primaryCategory = product.categories[0]?.name || 'Uncategorized';
    const secondaryCategory = product.categories[1]?.name;

    trackAddToCart({
      item_id: product.id.toString(),
      item_name: product.name,
      item_category: primaryCategory,
      item_category2: secondaryCategory,
      price: price,
      quantity: product.quantity,
      currency: 'USD',
    });
  }, [trackAddToCart]);

  const trackProductRemoveFromCart = useCallback((product: {
    id: number;
    name: string;
    categories: Array<{ name: string; id: number }>;
    price: string;
    quantity: number;
  }) => {
    const price = parseFloat(product.price.replace(/[^0-9.-]+/g, ''));
    const primaryCategory = product.categories[0]?.name || 'Uncategorized';
    const secondaryCategory = product.categories[1]?.name;

    trackRemoveFromCart({
      item_id: product.id.toString(),
      item_name: product.name,
      item_category: primaryCategory,
      item_category2: secondaryCategory,
      price: price,
      quantity: product.quantity,
      currency: 'USD',
    });
  }, [trackRemoveFromCart]);

  return {
    trackProductPageView,
    trackProductAddToCart,
    trackProductRemoveFromCart,
  };
}

// Hook for tracking cart analytics
export function useCartAnalytics() {
  const { trackBeginCheckout, trackCartAbandonment, trackUserEngagement } = useAnalytics();

  const trackCartView = useCallback((cartItems: Array<{
    id: number;
    name: string;
    categories: Array<{ name: string; id: number }>;
    price: string;
    quantity: number;
  }>, totalValue: number) => {
    const items = cartItems.map(item => {
      const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
      const primaryCategory = item.categories[0]?.name || 'Uncategorized';
      const secondaryCategory = item.categories[1]?.name;

      return {
        item_id: item.id.toString(),
        item_name: item.name,
        item_category: primaryCategory,
        item_category2: secondaryCategory,
        price: price,
        quantity: item.quantity,
      };
    });

    trackBeginCheckout(items, totalValue);
  }, [trackBeginCheckout]);

  const trackCartAbandonmentEvent = useCallback((cartValue: number, itemCount: number) => {
    trackCartAbandonment(cartValue, itemCount);
  }, [trackCartAbandonment]);

  const trackCartInteraction = useCallback((action: string, details?: Record<string, any>) => {
    trackUserEngagement(`cart_${action}`, details);
  }, [trackUserEngagement]);

  return {
    trackCartView,
    trackCartAbandonmentEvent,
    trackCartInteraction,
  };
}

// Hook for tracking checkout analytics
export function useCheckoutAnalytics() {
  const { trackCheckoutStep, trackPurchase, trackUserEngagement } = useAnalytics();

  const trackCheckoutProgress = useCallback((step: number, stepName: string, value?: number) => {
    trackCheckoutStep(step, stepName, value);
  }, [trackCheckoutStep]);

  const trackOrderComplete = useCallback((order: {
    id: string;
    total: number;
    items: Array<{
      id: number;
      name: string;
      categories: Array<{ name: string; id: number }>;
      price: string;
      quantity: number;
    }>;
  }) => {
    const items = order.items.map(item => {
      const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ''));
      const primaryCategory = item.categories[0]?.name || 'Uncategorized';
      const secondaryCategory = item.categories[1]?.name;

      return {
        item_id: item.id.toString(),
        item_name: item.name,
        item_category: primaryCategory,
        item_category2: secondaryCategory,
        price: price,
        quantity: item.quantity,
      };
    });

    trackPurchase({
      transaction_id: order.id,
      value: order.total,
      currency: 'USD',
      items: items,
    });
  }, [trackPurchase]);

  const trackCheckoutInteraction = useCallback((action: string, details?: Record<string, any>) => {
    trackUserEngagement(`checkout_${action}`, details);
  }, [trackUserEngagement]);

  return {
    trackCheckoutProgress,
    trackOrderComplete,
    trackCheckoutInteraction,
  };
}

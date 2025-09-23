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
  trackApiError,
  trackApiSuccess,
  trackApiPerformance,
  trackUserBehavior,
  trackPagePerformance,
  trackFeatureUsage,
  trackFunnelStep,
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

    // API tracking
    trackApiError: useCallback((errorDetails: {
      endpoint: string;
      method: string;
      statusCode?: number;
      statusText?: string;
      errorMessage: string;
      responseTime?: number;
      requestBody?: any;
      userAgent?: string;
      userId?: string;
    }) => {
      trackApiError(errorDetails);
    }, []),

    trackApiSuccess: useCallback((successDetails: {
      endpoint: string;
      method: string;
      statusCode: number;
      responseTime: number;
      responseSize?: number;
      userId?: string;
    }) => {
      trackApiSuccess(successDetails);
    }, []),

    trackApiPerformance: useCallback((performanceDetails: {
      endpoint: string;
      method: string;
      responseTime: number;
      responseSize?: number;
      cacheHit?: boolean;
    }) => {
      trackApiPerformance(performanceDetails);
    }, []),

    // User behavior tracking
    trackUserBehavior: useCallback((behaviorDetails: {
      action: string;
      page: string;
      element?: string;
      value?: any;
      userId?: string;
      sessionId?: string;
    }) => {
      trackUserBehavior(behaviorDetails);
    }, []),

    // Page performance tracking
    trackPagePerformance: useCallback((performanceDetails: {
      page: string;
      loadTime: number;
      domContentLoaded?: number;
      firstContentfulPaint?: number;
      largestContentfulPaint?: number;
      cumulativeLayoutShift?: number;
    }) => {
      trackPagePerformance(performanceDetails);
    }, []),

    // Feature usage tracking
    trackFeatureUsage: useCallback((featureDetails: {
      feature: string;
      action: string;
      success: boolean;
      duration?: number;
      userId?: string;
    }) => {
      trackFeatureUsage(featureDetails);
    }, []),

    // Search tracking
    trackSearch: useCallback((searchDetails: {
      query: string;
      resultsCount: number;
      page: string;
      filters?: any;
      userId?: string;
    }) => {
      trackSearch(searchDetails);
    }, []),

    // Funnel tracking
    trackFunnelStep: useCallback((funnelDetails: {
      funnel: string;
      step: string;
      stepNumber: number;
      totalSteps: number;
      userId?: string;
      value?: number;
    }) => {
      trackFunnelStep(funnelDetails);
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

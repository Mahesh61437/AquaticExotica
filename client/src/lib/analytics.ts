// Google Analytics 4 Configuration and Utilities
import { ANALYTICS_CONFIG } from '@/config/analytics';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// GA4 Configuration
export const GA4_CONFIG = {
  MEASUREMENT_ID: ANALYTICS_CONFIG.GA4_MEASUREMENT_ID,
  DEBUG_MODE: ANALYTICS_CONFIG.DEBUG,
  ENABLED: ANALYTICS_CONFIG.ENABLED,
};

// Initialize Google Analytics
export const initializeGA4 = (measurementId?: string) => {
  if (typeof window === 'undefined' || !GA4_CONFIG.ENABLED) return;

  const id = measurementId || GA4_CONFIG.MEASUREMENT_ID;
  if (!id || id.trim() === '') {
    if (GA4_CONFIG.DEBUG_MODE) {
      console.warn('⚠️ GA4 Measurement ID not configured. Please set REACT_APP_GA4_MEASUREMENT_ID in your environment variables.');
    }
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  // Configure GA4
  window.gtag('js', new Date());
  window.gtag('config', id, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: false, // We'll send page views manually for better control
  });

  if (GA4_CONFIG.DEBUG_MODE) {
    console.log('🔍 GA4 initialized with measurement ID:', id);
  }
};

// Track page views
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (!GA4_CONFIG.ENABLED || !GA4_CONFIG.MEASUREMENT_ID || typeof window === 'undefined') return;

  window.gtag('config', GA4_CONFIG.MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: pageTitle || document.title,
  });

  if (GA4_CONFIG.DEBUG_MODE) {
    console.log('📄 Page view tracked:', { pagePath, pageTitle });
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!GA4_CONFIG.ENABLED || !GA4_CONFIG.MEASUREMENT_ID || typeof window === 'undefined') return;

  window.gtag('event', eventName, {
    ...parameters,
    event_category: parameters?.event_category || 'engagement',
    event_label: parameters?.event_label || '',
    value: parameters?.value || 0,
  });

  if (GA4_CONFIG.DEBUG_MODE) {
    console.log('🎯 Event tracked:', { eventName, parameters });
  }
};

// E-commerce tracking functions
export const trackProductView = (product: {
  item_id: string;
  item_name: string;
  item_category: string;
  item_category2?: string;
  price: number;
  currency?: string;
}) => {
  trackEvent('view_item', {
    currency: product.currency || 'USD',
    value: product.price,
    items: [{
      item_id: product.item_id,
      item_name: product.item_name,
      item_category: product.item_category,
      item_category2: product.item_category2,
      price: product.price,
      quantity: 1,
    }],
  });
};

export const trackAddToCart = (product: {
  item_id: string;
  item_name: string;
  item_category: string;
  item_category2?: string;
  price: number;
  quantity: number;
  currency?: string;
}) => {
  trackEvent('add_to_cart', {
    currency: product.currency || 'USD',
    value: product.price * product.quantity,
    items: [{
      item_id: product.item_id,
      item_name: product.item_name,
      item_category: product.item_category,
      item_category2: product.item_category2,
      price: product.price,
      quantity: product.quantity,
    }],
  });
};

export const trackRemoveFromCart = (product: {
  item_id: string;
  item_name: string;
  item_category: string;
  item_category2?: string;
  price: number;
  quantity: number;
  currency?: string;
}) => {
  trackEvent('remove_from_cart', {
    currency: product.currency || 'USD',
    value: product.price * product.quantity,
    items: [{
      item_id: product.item_id,
      item_name: product.item_name,
      item_category: product.item_category,
      item_category2: product.item_category2,
      price: product.price,
      quantity: product.quantity,
    }],
  });
};

export const trackBeginCheckout = (cartItems: Array<{
  item_id: string;
  item_name: string;
  item_category: string;
  item_category2?: string;
  price: number;
  quantity: number;
}>, totalValue: number, currency = 'USD') => {
  trackEvent('begin_checkout', {
    currency,
    value: totalValue,
    items: cartItems,
  });
};

export const trackPurchase = (transaction: {
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
  trackEvent('purchase', {
    transaction_id: transaction.transaction_id,
    currency: transaction.currency || 'USD',
    value: transaction.value,
    items: transaction.items,
  });
};

// User behavior tracking
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

export const trackCategoryView = (categoryName: string, categoryId?: string) => {
  trackEvent('view_item_list', {
    item_list_id: categoryId || categoryName,
    item_list_name: categoryName,
  });
};

export const trackUserEngagement = (action: string, details?: Record<string, any>) => {
  trackEvent('user_engagement', {
    engagement_action: action,
    ...details,
  });
};

// Cart abandonment tracking
export const trackCartAbandonment = (cartValue: number, itemCount: number) => {
  trackEvent('cart_abandonment', {
    cart_value: cartValue,
    item_count: itemCount,
    currency: 'USD',
  });
};

// Checkout funnel tracking
export const trackCheckoutStep = (step: number, stepName: string, value?: number) => {
  trackEvent('checkout_progress', {
    checkout_step: step,
    checkout_step_name: stepName,
    value: value || 0,
    currency: 'USD',
  });
};

// Error tracking
export const trackError = (errorType: string, errorMessage: string, errorLocation?: string) => {
  trackEvent('exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    custom_map: {
      error_location: errorLocation || 'unknown',
    },
  });
};

// Performance tracking
export const trackPerformance = (metricName: string, value: number, unit = 'ms') => {
  trackEvent('timing_complete', {
    name: metricName,
    value: value,
    event_category: 'performance',
    event_label: unit,
  });
};

// User properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (!GA4_CONFIG.MEASUREMENT_ID || typeof window === 'undefined') return;

  window.gtag('config', GA4_CONFIG.MEASUREMENT_ID, {
    user_properties: properties,
  });

  if (GA4_CONFIG.DEBUG_MODE) {
    console.log('👤 User properties set:', properties);
  }
};

// Custom dimensions (you'll need to set these up in GA4)
export const trackCustomDimension = (dimensionName: string, value: string) => {
  trackEvent('custom_dimension', {
    [dimensionName]: value,
  });
};

// Utility to check if GA4 is loaded
export const isGA4Loaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Utility to get current session info
export const getSessionInfo = () => {
  if (typeof window === 'undefined') return null;
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
  };
};

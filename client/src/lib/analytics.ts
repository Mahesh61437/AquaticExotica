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
export const trackSearch = (searchDetails: {
  query: string;
  resultsCount: number;
  page: string;
  filters?: any;
  userId?: string;
}) => {
  trackEvent('search', {
    event_category: 'search',
    event_label: searchDetails.query,
    value: searchDetails.resultsCount,
    custom_map: {
      search_term: searchDetails.query,
      results_count: searchDetails.resultsCount,
      page: searchDetails.page,
      filters: JSON.stringify(searchDetails.filters || {}),
      user_id: searchDetails.userId || 'anonymous',
      timestamp: new Date().toISOString(),
    },
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

// API Error tracking
export const trackApiError = (errorDetails: {
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
  trackEvent('api_error', {
    event_category: 'api',
    event_label: `${errorDetails.method} ${errorDetails.endpoint}`,
    custom_map: {
      endpoint: errorDetails.endpoint,
      method: errorDetails.method,
      status_code: errorDetails.statusCode || 0,
      status_text: errorDetails.statusText || 'Unknown',
      error_message: errorDetails.errorMessage,
      response_time: errorDetails.responseTime || 0,
      user_id: errorDetails.userId || 'anonymous',
      timestamp: new Date().toISOString(),
    },
  });

  // Also track as exception for error monitoring
  trackError('API_ERROR', `${errorDetails.method} ${errorDetails.endpoint}: ${errorDetails.errorMessage}`, 'api');
};

// API Success tracking
export const trackApiSuccess = (successDetails: {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  responseSize?: number;
  userId?: string;
}) => {
  trackEvent('api_success', {
    event_category: 'api',
    event_label: `${successDetails.method} ${successDetails.endpoint}`,
    value: successDetails.responseTime,
    custom_map: {
      endpoint: successDetails.endpoint,
      method: successDetails.method,
      status_code: successDetails.statusCode,
      response_time: successDetails.responseTime,
      response_size: successDetails.responseSize || 0,
      user_id: successDetails.userId || 'anonymous',
      timestamp: new Date().toISOString(),
    },
  });
};

// API Performance tracking
export const trackApiPerformance = (performanceDetails: {
  endpoint: string;
  method: string;
  responseTime: number;
  responseSize?: number;
  cacheHit?: boolean;
}) => {
  trackEvent('api_performance', {
    event_category: 'performance',
    event_label: `${performanceDetails.method} ${performanceDetails.endpoint}`,
    value: performanceDetails.responseTime,
    custom_map: {
      endpoint: performanceDetails.endpoint,
      method: performanceDetails.method,
      response_time: performanceDetails.responseTime,
      response_size: performanceDetails.responseSize || 0,
      cache_hit: performanceDetails.cacheHit || false,
      timestamp: new Date().toISOString(),
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

// User behavior tracking
export const trackUserBehavior = (behaviorDetails: {
  action: string;
  page: string;
  element?: string;
  value?: any;
  userId?: string;
  sessionId?: string;
}) => {
  trackEvent('user_behavior', {
    event_category: 'behavior',
    event_label: behaviorDetails.action,
    value: behaviorDetails.value || 0,
    custom_map: {
      action: behaviorDetails.action,
      page: behaviorDetails.page,
      element: behaviorDetails.element || 'unknown',
      user_id: behaviorDetails.userId || 'anonymous',
      session_id: behaviorDetails.sessionId || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
};

// Page performance tracking
export const trackPagePerformance = (performanceDetails: {
  page: string;
  loadTime: number;
  domContentLoaded?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
}) => {
  trackEvent('page_performance', {
    event_category: 'performance',
    event_label: performanceDetails.page,
    value: performanceDetails.loadTime,
    custom_map: {
      page: performanceDetails.page,
      load_time: performanceDetails.loadTime,
      dom_content_loaded: performanceDetails.domContentLoaded || 0,
      first_contentful_paint: performanceDetails.firstContentfulPaint || 0,
      largest_contentful_paint: performanceDetails.largestContentfulPaint || 0,
      cumulative_layout_shift: performanceDetails.cumulativeLayoutShift || 0,
      timestamp: new Date().toISOString(),
    },
  });
};

// Feature usage tracking
export const trackFeatureUsage = (featureDetails: {
  feature: string;
  action: string;
  success: boolean;
  duration?: number;
  userId?: string;
}) => {
  trackEvent('feature_usage', {
    event_category: 'feature',
    event_label: `${featureDetails.feature}_${featureDetails.action}`,
    value: featureDetails.duration || 0,
    custom_map: {
      feature: featureDetails.feature,
      action: featureDetails.action,
      success: featureDetails.success,
      duration: featureDetails.duration || 0,
      user_id: featureDetails.userId || 'anonymous',
      timestamp: new Date().toISOString(),
    },
  });
};


// Conversion funnel tracking
export const trackFunnelStep = (funnelDetails: {
  funnel: string;
  step: string;
  stepNumber: number;
  totalSteps: number;
  userId?: string;
  value?: number;
}) => {
  trackEvent('funnel_step', {
    event_category: 'conversion',
    event_label: `${funnelDetails.funnel}_${funnelDetails.step}`,
    value: funnelDetails.value || 0,
    custom_map: {
      funnel: funnelDetails.funnel,
      step: funnelDetails.step,
      step_number: funnelDetails.stepNumber,
      total_steps: funnelDetails.totalSteps,
      completion_rate: (funnelDetails.stepNumber / funnelDetails.totalSteps) * 100,
      user_id: funnelDetails.userId || 'anonymous',
      timestamp: new Date().toISOString(),
    },
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

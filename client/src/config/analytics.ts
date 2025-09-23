// Analytics Configuration
// Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID

export const ANALYTICS_CONFIG = {
  // Google Analytics 4 Measurement ID
  // Get this from your GA4 property settings
  GA4_MEASUREMENT_ID: process.env.REACT_APP_GA4_MEASUREMENT_ID || '',
  
  // Enable/disable analytics
  ENABLED: process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  
  // Debug mode
  DEBUG: process.env.NODE_ENV === 'development',
  
  // Custom dimensions (set these up in GA4)
  CUSTOM_DIMENSIONS: {
    USER_TYPE: 'user_type',
    PRODUCT_CATEGORY: 'product_category',
    CART_VALUE: 'cart_value',
    CHECKOUT_STEP: 'checkout_step',
  },
  
  // Event names
  EVENTS: {
    PRODUCT_VIEW: 'view_item',
    ADD_TO_CART: 'add_to_cart',
    REMOVE_FROM_CART: 'remove_from_cart',
    BEGIN_CHECKOUT: 'begin_checkout',
    PURCHASE: 'purchase',
    SEARCH: 'search',
    VIEW_ITEM_LIST: 'view_item_list',
    CART_ABANDONMENT: 'cart_abandonment',
    CHECKOUT_PROGRESS: 'checkout_progress',
    USER_ENGAGEMENT: 'user_engagement',
    EXCEPTION: 'exception',
    TIMING_COMPLETE: 'timing_complete',
  },
  
  // Conversion goals
  CONVERSIONS: {
    PURCHASE: 'purchase',
    ADD_TO_CART: 'add_to_cart',
    BEGIN_CHECKOUT: 'begin_checkout',
    SEARCH: 'search',
  },
};

// Instructions for setting up GA4:
/*
1. Go to Google Analytics (analytics.google.com)
2. Create a new GA4 property for your website
3. Get your Measurement ID (format: G-XXXXXXXXXX)
4. Set up Enhanced E-commerce in GA4:
   - Go to Admin > Data Streams > Web
   - Enable Enhanced measurement
   - Configure E-commerce settings
5. Set up Custom Dimensions:
   - Go to Admin > Data Display > Custom Definitions
   - Create custom dimensions for user_type, product_category, etc.
6. Set up Conversion Events:
   - Go to Admin > Data Display > Conversions
   - Mark purchase, add_to_cart, begin_checkout as conversions
7. Add REACT_APP_GA4_MEASUREMENT_ID=G-XXXXXXXXXX to your .env file
8. The Measurement ID will be automatically loaded from environment variables
*/

// PayU Checkout Plus Configuration
// Environment variables are loaded from .env file

export const PAYU_CONFIG = {
  // PayU Merchant Key (from PayU dashboard)
  MERCHANT_KEY: import.meta.env.VITE_PAYU_MERCHANT_KEY || '',
  
  // PayU Environment Mode (sandbox or production)
  MODE: import.meta.env.VITE_PAYU_MODE || 'sandbox',
  
  // PayU Success URL (redirect after successful payment)
  // Can be a full URL or just a path (e.g., "/payment/success")
  // If path, will be combined with current origin at runtime
  get SUCCESS_URL() {
    const url = import.meta.env.VITE_PAYU_SUCCESS_URL || '/payment/success';
    // If it's already a full URL, use it; otherwise combine with origin
    if (url.startsWith('http')) {
      return url;
    }
    // Combine path with current origin (works in browser)
    const path = url.startsWith('/') ? url : '/' + url;
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}${path}`;
    }
    // Fallback for SSR/build time
    return path;
  },
  
  // PayU Failure URL (redirect after failed payment)
  // Can be a full URL or just a path (e.g., "/payment/failure")
  // If path, will be combined with current origin at runtime
  get FAILURE_URL() {
    const url = import.meta.env.VITE_PAYU_FAILURE_URL || '/payment/failure';
    // If it's already a full URL, use it; otherwise combine with origin
    if (url.startsWith('http')) {
      return url;
    }
    // Combine path with current origin (works in browser)
    const path = url.startsWith('/') ? url : '/' + url;
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}${path}`;
    }
    // Fallback for SSR/build time
    return path;
  },
  
  // PayU API Base URL
  API_BASE: import.meta.env.VITE_PAYU_API_BASE || (
    import.meta.env.VITE_PAYU_MODE === 'production' 
      ? 'https://secure.payu.in' 
      : 'https://sandboxsecure.payu.in'
  ),
  
  // Check if PayU is configured
  IS_CONFIGURED: !!import.meta.env.VITE_PAYU_MERCHANT_KEY,
  
  // Service Provider (required by PayU)
  SERVICE_PROVIDER: 'payu_paisa',
};

// Validation function
export function validatePayUConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!PAYU_CONFIG.MERCHANT_KEY) {
    errors.push('VITE_PAYU_MERCHANT_KEY is required');
  }
  
  if (!PAYU_CONFIG.SUCCESS_URL) {
    errors.push('VITE_PAYU_SUCCESS_URL is required');
  }
  
  if (!PAYU_CONFIG.FAILURE_URL) {
    errors.push('VITE_PAYU_FAILURE_URL is required');
  }
  
  if (PAYU_CONFIG.MODE !== 'sandbox' && PAYU_CONFIG.MODE !== 'production') {
    errors.push('VITE_PAYU_MODE must be either "sandbox" or "production"');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Debug function (only in development)
export function logPayUConfig(): void {
  if (import.meta.env.MODE === 'development') {
    console.log('🔐 PayU Configuration:', {
      merchantKey: PAYU_CONFIG.MERCHANT_KEY ? `${PAYU_CONFIG.MERCHANT_KEY.substring(0, 8)}...` : 'NOT SET',
      mode: PAYU_CONFIG.MODE,
      successUrl: PAYU_CONFIG.SUCCESS_URL,
      failureUrl: PAYU_CONFIG.FAILURE_URL,
      apiBase: PAYU_CONFIG.API_BASE,
      isConfigured: PAYU_CONFIG.IS_CONFIGURED,
    });
    
    const validation = validatePayUConfig();
    if (!validation.valid) {
      console.warn('⚠️ PayU Configuration Errors:', validation.errors);
    }
  }
}

// Instructions for setting up PayU:
/*
1. Create a PayU merchant account at https://payu.in/signup
2. Complete KYC verification
3. Get your Merchant Key and Salt from PayU dashboard
4. Add to .env file:
   - VITE_PAYU_MERCHANT_KEY=your_merchant_key
   - VITE_PAYU_MODE=sandbox (for testing) or production (for live)
   - VITE_PAYU_SUCCESS_URL=/payment/success (or full URL)
   - VITE_PAYU_FAILURE_URL=/payment/failure (or full URL)
5. IMPORTANT: Salt should NEVER be in frontend code
   - Salt is only used on backend for hash generation
   - Hash generation must be server-side only
6. Test in sandbox mode first
7. Switch to production mode when ready to go live
*/


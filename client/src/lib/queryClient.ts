import { QueryClient, QueryFunction } from "@tanstack/react-query";
// import { trackApiError, trackApiSuccess, trackApiPerformance } from "./analytics";

// API base URL - set via environment variable VITE_API_BASE
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// Helper to build full URL for API calls
function buildUrl(path: string): string {
  // If already absolute URL, return as-is
  if (/^https?:\/\//i.test(path)) return path;
  // Otherwise prepend API_BASE
  const fullUrl = `${API_BASE}${path}`;
  console.log('🌐 Building URL:', { path, API_BASE, fullUrl });
  return fullUrl;
}

// Helper to get stored JWT token
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('aquaticexotica_access_token');
}

// Enhanced error logging function
function logApiError(error: any, context: {
  url: string;
  method?: string;
  status?: number;
  statusText?: string;
  responseText?: string;
  requestBody?: any;
}) {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    url: context.url,
    method: context.method || 'GET',
    status: context.status,
    statusText: context.statusText,
    responseText: context.responseText,
    requestBody: context.requestBody,
    errorMessage: error?.message,
    errorStack: error?.stack,
    userAgent: navigator.userAgent,
    currentUrl: window.location.href,
  };

  console.error('🚨 API Error Details:', errorDetails);
  
  // Log to browser console in a structured way
  console.group('🚨 API Error');
  console.error('URL:', context.url);
  console.error('Method:', context.method || 'GET');
  console.error('Status:', context.status);
  console.error('Status Text:', context.statusText);
  console.error('Response Text:', context.responseText);
  console.error('Request Body:', context.requestBody);
  console.error('Error Message:', error?.message);
  console.error('Timestamp:', errorDetails.timestamp);
  console.groupEnd();
}

async function throwIfResNotOk(res: Response, context: { url: string; method?: string; requestBody?: any }) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let responseText = '';
    
    try {
      // Try to parse response as JSON to extract the error message
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        responseText = JSON.stringify(errorData);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
        // Attach parsed JSON to the thrown error so callers can inspect validation details
        const parsedError = new Error(errorMessage) as any;
        parsedError.responseData = errorData;
        // Log detailed error information
        logApiError(parsedError, {
          url: context.url,
          method: context.method,
          status: res.status,
          statusText: res.statusText,
          responseText,
          requestBody: context.requestBody,
        });
        throw parsedError;
      } else {
        // If not JSON, treat as text
        responseText = await res.text();
        if (responseText) {
          errorMessage = responseText;
        }
      }
    } catch (e) {
      // If we can't parse the response, just use the status text
      console.error("Error parsing error response:", e);
    }
    
    // Create error with enhanced context (non-JSON path)
    const error = new Error(errorMessage) as any;
    error.responseText = responseText;
    // Log detailed error information
    logApiError(error, {
      url: context.url,
      method: context.method,
      status: res.status,
      statusText: res.statusText,
      responseText,
      requestBody: context.requestBody,
    });
    throw error;
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const startTime = Date.now();
  console.log('🚀 apiRequest called with:', { url, options });
  
  // Get the stored token
  const token = getStoredToken();
  console.log('🔑 Current token:', token ? 'Token exists' : 'No token');
  
  // Prepare headers
  const headers: Record<string, string> = {};
  
  // Copy existing headers if any
  if (options?.headers) {
    if (typeof options.headers === 'object' && !Array.isArray(options.headers)) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers[key] = value;
      });
    }
  }
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add Content-Type header for JSON requests
  if (options?.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  
  const fullUrl = buildUrl(url);
  console.log('🌐 Making request to:', fullUrl);
  console.log('📋 Request headers:', headers);
  
  try {
    const res = await fetch(fullUrl, {
      credentials: "include",
      ...options,
      headers
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('📡 Response status:', res.status);
    console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));
    console.log('⏱️ Request duration:', `${duration}ms`);

    // Track API performance
    const endpoint = url.replace(/^\/api\//, '').replace(/\/$/, '');
    const method = options?.method || 'GET';
    
    // Get response size
    const contentLength = res.headers.get('content-length');
    const responseSize = contentLength ? parseInt(contentLength) : 0;

    // Track API success
    // trackApiSuccess({
    //   endpoint,
    //   method,
    //   statusCode: res.status,
    //   responseTime: duration,
    //   responseSize,
    //   userId: token ? 'authenticated' : 'anonymous'
    // });

    // Track API performance
    // trackApiPerformance({
    //   endpoint,
    //   method,
    //   responseTime: duration,
    //   responseSize,
    //   cacheHit: res.headers.get('x-cache') === 'HIT'
    // });

    // Handle 204 No Content responses (common for DELETE operations)
    if (res.status === 204) {
      console.log('✅ 204 No Content - Operation successful');
      return {} as T; // Return empty object for 204 responses
    }

    await throwIfResNotOk(res, { 
      url: fullUrl, 
      method: options?.method, 
      requestBody: options?.body 
    });
    
    // Only try to parse JSON if we have content
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      console.log('📦 Response data:', data);
      return data;
    } else {
      // For non-JSON responses, return the text
      const text = await res.text();
      console.log('📦 Response text:', text);
      return text as T;
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error('❌ API Request failed:', {
      url: fullUrl,
      method: options?.method,
      duration: `${duration}ms`,
      error: error
    });

    // Track API error
    // const endpoint = url.replace(/^\/api\//, '').replace(/\/$/, '');
    // const method = options?.method || 'GET';
    
    // trackApiError({
    //   endpoint,
    //   method,
    //   statusCode: (error as any)?.status || 0,
    //   statusText: (error as any)?.statusText || 'Unknown Error',
    //   errorMessage: (error as Error)?.message || 'Unknown error occurred',
    //   responseTime: duration,
    //   requestBody: options?.body,
    //   userAgent: navigator.userAgent,
    //   userId: token ? 'authenticated' : 'anonymous'
    // });
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const startTime = Date.now();
    const url = queryKey[0] as string;
    
    console.log('🔍 Query function called for:', url);
    
    // Get the stored token
    const token = getStoredToken();
    
    // Prepare headers
    const headers: Record<string, string> = {};
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const res = await fetch(buildUrl(url), {
        credentials: "include",
        headers
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('📡 Query response status:', res.status);
      console.log('⏱️ Query duration:', `${duration}ms`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('🔒 401 Unauthorized - returning null');
        return null;
      }

      // Handle 204 No Content responses
      if (res.status === 204) {
        console.log('✅ 204 No Content - Query successful');
        return {} as any;
      }

      await throwIfResNotOk(res, { url });
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        console.log('📦 Query response data:', data);
        return data;
      } else {
        const text = await res.text();
        console.log('📦 Query response text:', text);
        return text as any;
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error('❌ Query function failed:', {
        url,
        duration: `${duration}ms`,
        error: error
      });
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
      retry: 1, // Allow 1 retry instead of false
      retryDelay: 1000, // 1 second delay between retries
    },
    mutations: {
      retry: false,
    },
  },
});

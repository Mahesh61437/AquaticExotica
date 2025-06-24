import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API base URL - set via environment variable VITE_API_BASE
const API_BASE = import.meta.env.VITE_API_BASE || 'https://web-production-b3867.up.railway.app';

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

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    
    try {
      // Try to parse response as JSON to extract the error message
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else {
        // If not JSON, treat as text
        const text = await res.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch (e) {
      // If we can't parse the response, just use the status text
      console.error("Error parsing error response:", e);
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
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
  
  const fullUrl = buildUrl(url);
  console.log('🌐 Making request to:', fullUrl);
  console.log('📋 Request headers:', headers);
  
  const res = await fetch(fullUrl, {
    credentials: "include",
    ...options,
    headers
  });

  console.log('📡 Response status:', res.status);
  console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));

  await throwIfResNotOk(res);
  const data = await res.json();
  console.log('📦 Response data:', data);
  return data;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the stored token
    const token = getStoredToken();
    
    // Prepare headers
    const headers: Record<string, string> = {};
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(buildUrl(queryKey[0] as string), {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

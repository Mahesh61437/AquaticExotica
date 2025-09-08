import * as React from "react";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

// Define our user interface - updated for Django JWT response
interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string; // Optional since Django might not send this
  isAdmin: boolean;
}

// Django JWT response interface
interface DjangoAuthResponse {
  refresh: string;
  access: string;
  isAdmin: boolean;
  username: string;
  email: string;
  id: number;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Token storage utilities
const TOKEN_KEY = 'aquaticexotica_access_token';
const REFRESH_TOKEN_KEY = 'aquaticexotica_refresh_token';

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  console.log('🔍 getStoredToken called, result:', token ? 'Token found' : 'No token');
  return token;
};

const setStoredToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  console.log('💾 setStoredToken called with token:', token ? 'Token provided' : 'No token');
  localStorage.setItem(TOKEN_KEY, token);
  console.log('💾 Token stored in localStorage');
};

const removeStoredToken = (): void => {
  if (typeof window === 'undefined') return;
  console.log('🗑️ removeStoredToken called');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('aquaticexotica_user_data');
  console.log('🗑️ Tokens and user data removed from localStorage');
};

const setStoredUserData = (user: User): void => {
  if (typeof window === 'undefined') return;
  console.log('💾 setStoredUserData called with user:', user);
  localStorage.setItem('aquaticexotica_user_data', JSON.stringify(user));
  console.log('💾 User data stored in localStorage');
};

// Helper to check if token is likely expired (basic JWT expiration check)
const isTokenLikelyExpired = (token: string): boolean => {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    
    if (!exp) return true;
    
    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    const buffer = 5 * 60; // 5 minutes in seconds
    
    return exp < (now + buffer);
  } catch (error) {
    console.log('❌ Error checking token expiration:', error);
    return true; // If we can't parse it, assume it's expired
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check for authentication on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          console.log('🔍 No token found, user not authenticated');
          setLoading(false);
          return;
        }

        // Check if token is likely expired
        if (isTokenLikelyExpired(token)) {
          console.log('⏰ Token appears to be expired, clearing auth state');
          removeStoredToken();
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // First, try to restore user from stored data for immediate UI update
        const storedUserData = localStorage.getItem('aquaticexotica_user_data');
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            console.log('🔄 Restoring user from stored data for immediate UI update:', userData);
            setCurrentUser(userData);
            setLoading(false); // Set loading to false immediately for better UX
          } catch (parseError) {
            console.log('❌ Failed to parse stored user data');
          }
        }

        // Then verify token with server in the background (only if token seems valid)
        console.log('🔍 Token appears valid, verifying with server in background...');
        
        try {
          const user = await apiRequest<User>('/api/auth/me/');
          console.log('✅ Token verification successful, user:', user);
          
          // Update with fresh user data from server
          setStoredUserData(user);
          setCurrentUser(user);
        } catch (verifyError: any) {
          console.log('❌ Token verification failed:', verifyError.message);
          
          // Check if it's a 401 (unauthorized) error
          if (verifyError.message.includes('401') || verifyError.message.includes('Unauthorized')) {
            console.log('🔒 Token expired or invalid, clearing auth state');
            removeStoredToken();
            setCurrentUser(null);
          }
          // For other errors (404, network issues), keep the user logged in with stored data
          // The user is already set from stored data above, so no need to change anything
          else {
            console.log('⚠️ Server verification failed, but keeping user logged in with stored data');
          }
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        // Only clear auth state if it's a critical error
        removeStoredToken();
        setCurrentUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<User | null> => {
    try {
      const response = await apiRequest<User & { message?: string }>('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          fullName
        })
      });
      
      // Do not set current user after signup
      // User must log in manually
      
      toast({
        title: "Account created successfully",
        description: "Please sign in with your new account",
      });
      
      return response;
    } catch (error: any) {
      console.error("Signup error", error);
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log('🔐 Starting signIn process...');
      console.log('📧 Email:', email);
      
      const response = await apiRequest<DjangoAuthResponse>('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      console.log('✅ Login API response received:', response);
      
      // Store the tokens
      console.log('💾 Storing access token:', response.access);
      setStoredToken(response.access);
      
      console.log('💾 Storing refresh token:', response.refresh);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh);
      
      // Verify tokens are stored
      const storedAccessToken = getStoredToken();
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      console.log('🔍 Verification - Stored access token:', storedAccessToken ? '✅ Found' : '❌ Not found');
      console.log('🔍 Verification - Stored refresh token:', storedRefreshToken ? '✅ Found' : '❌ Not found');
      
      // Convert Django response to our User interface
      const user: User = {
        id: response.id,
        username: response.username,
        email: response.email,
        fullName: response.username, // Use username as fullName if not provided
        isAdmin: response.isAdmin,
      };
      
      console.log('👤 Created user object:', user);
      
      // Store user data for fallback
      setStoredUserData(user);
      
      setCurrentUser(user);
      
      console.log('✅ User state updated, currentUser should now be set');
      
      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
      return user;
    } catch (error: any) {
      console.error("❌ Sign in error", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Clear tokens
      removeStoredToken();
      setCurrentUser(null);
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      console.error("Sign out error", error);
      // Even if logout API fails, clear local state
      removeStoredToken();
      setCurrentUser(null);
      toast({
        title: "Signed out",
        description: "You have been signed out",
      });
    }
  };

  const getAccessToken = (): string | null => {
    return getStoredToken();
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
    getAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { useAuthContext as useAuth };
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

// Define our user interface
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check for authentication on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await apiRequest<User>('/api/auth/me');
        setCurrentUser(user);
      } catch (error) {
        // This would be a 401 if not authenticated, which is fine
        console.log('Not authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const user = await apiRequest<User>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          fullName
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setCurrentUser(user);
      
      toast({
        title: "Account created successfully",
        description: "You have been signed up and logged in",
      });
      
      return user;
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

  const signIn = async (email: string, password: string) => {
    try {
      const user = await apiRequest<User>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setCurrentUser(user);
      
      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
      return user;
    } catch (error: any) {
      console.error("Sign in error", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST'
      });
      
      setCurrentUser(null);
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error) {
      console.error("Sign out error", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
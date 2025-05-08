import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

// Define our user interface
interface Address {
  id?: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  isDefault: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  addresses?: Address[];
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  updateAddress: (address: Address) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  getDefaultAddress: () => Address | undefined;
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
      const user = await apiRequest<User>('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
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

  const signOut = async (): Promise<void> => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST'
      });
      
      setCurrentUser(null);
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      console.error("Sign out error", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  // Address management functions
  const addAddress = async (address: Omit<Address, "id">): Promise<void> => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to manage addresses",
        variant: "destructive",
      });
      throw new Error("User not authenticated");
    }

    try {
      // Generate a unique ID for the address
      const newAddress: Address = {
        ...address,
        id: crypto.randomUUID(), // Generate a unique ID
      };
      
      // If this is the first address or set as default, reset all others
      let updatedAddresses: Address[] = [...(currentUser.addresses || [])];
      
      if (newAddress.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: false
        }));
      }
      
      // Add the new address
      updatedAddresses.push(newAddress);
      
      // If this is the first address, make it default
      if (updatedAddresses.length === 1) {
        updatedAddresses[0].isDefault = true;
      }
      
      // Update user in state
      setCurrentUser({
        ...currentUser,
        addresses: updatedAddresses
      });
      
      // Update user on server
      await apiRequest('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addresses: updatedAddresses
        })
      });
      
      toast({
        title: "Address added",
        description: "Your new address has been saved",
      });
    } catch (error: any) {
      console.error("Add address error:", error);
      toast({
        title: "Failed to add address",
        description: error.message || "An error occurred while saving your address",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const updateAddress = async (address: Address): Promise<void> => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to manage addresses",
        variant: "destructive",
      });
      throw new Error("User not authenticated");
    }
    
    try {
      // Find the address index
      const addresses = [...(currentUser.addresses || [])];
      const addressIndex = addresses.findIndex(a => a.id === address.id);
      
      if (addressIndex === -1) {
        throw new Error("Address not found");
      }
      
      // If setting as default, update all others
      if (address.isDefault) {
        for (let i = 0; i < addresses.length; i++) {
          if (i !== addressIndex) {
            addresses[i].isDefault = false;
          }
        }
      }
      
      // Update the address
      addresses[addressIndex] = address;
      
      // Update user in state
      setCurrentUser({
        ...currentUser,
        addresses
      });
      
      // Update user on server
      await apiRequest('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addresses
        })
      });
      
      toast({
        title: "Address updated",
        description: "Your address has been updated successfully",
      });
    } catch (error: any) {
      console.error("Update address error:", error);
      toast({
        title: "Failed to update address",
        description: error.message || "An error occurred while updating your address",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const deleteAddress = async (addressId: string): Promise<void> => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to manage addresses",
        variant: "destructive",
      });
      throw new Error("User not authenticated");
    }
    
    try {
      const addresses = [...(currentUser.addresses || [])];
      const addressIndex = addresses.findIndex(a => a.id === addressId);
      
      if (addressIndex === -1) {
        throw new Error("Address not found");
      }
      
      // Check if deleting the default address
      const isDefault = addresses[addressIndex].isDefault;
      
      // Remove the address
      addresses.splice(addressIndex, 1);
      
      // If we deleted the default address and there are other addresses, make the first one default
      if (isDefault && addresses.length > 0) {
        addresses[0].isDefault = true;
      }
      
      // Update user in state
      setCurrentUser({
        ...currentUser,
        addresses
      });
      
      // Update user on server
      await apiRequest('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addresses
        })
      });
      
      toast({
        title: "Address deleted",
        description: "Your address has been removed",
      });
    } catch (error: any) {
      console.error("Delete address error:", error);
      toast({
        title: "Failed to delete address",
        description: error.message || "An error occurred while deleting your address",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const getDefaultAddress = (): Address | undefined => {
    if (!currentUser || !currentUser.addresses || currentUser.addresses.length === 0) {
      return undefined;
    }
    
    // Find the default address
    const defaultAddress = currentUser.addresses.find(a => a.isDefault);
    
    // If no default is set but we have addresses, return the first one
    if (!defaultAddress && currentUser.addresses.length > 0) {
      return currentUser.addresses[0];
    }
    
    return defaultAddress;
  };

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Fix the Fast Refresh incompatibility by moving to a named constant export
const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { useAuthContext as useAuth };
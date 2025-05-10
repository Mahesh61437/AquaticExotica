import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from './use-cart';
import { useToast } from './use-toast';

/**
 * Hook to handle cart integration with authentication
 * Merges anonymous cart with user's saved cart on login
 */
export function useAuthCart() {
  const { currentUser } = useAuth();
  const { cart, clearCart } = useCart();
  const { toast } = useToast();

  // Set up localStorage key for user's last login state
  const userLoggedInKey = 'user_was_logged_in';
  
  useEffect(() => {
    // Check if this is a new login
    const userWasLoggedIn = localStorage.getItem(userLoggedInKey) === 'true';
    
    if (currentUser && !userWasLoggedIn) {
      // User just logged in
      localStorage.setItem(userLoggedInKey, 'true');
      
      // Only show notification if there are items in the cart
      if (cart.items.length > 0) {
        toast({
          title: "Cart updated",
          description: "Your shopping cart has been saved to your account",
        });
      }
      
      // Note: Right now we're just persisting the anonymous cart to the user's account
      // In a future implementation, we could fetch the user's saved cart from the server
      // and merge it with the current cart, then save the merged cart back to the server
    } else if (!currentUser && userWasLoggedIn) {
      // User just logged out - update the tracking flag
      localStorage.setItem(userLoggedInKey, 'false');
      
      // Optionally, we could clear the cart on logout
      // clearCart();
    }
  }, [currentUser]);

  return null; // This hook doesn't return anything, just provides side effects
}
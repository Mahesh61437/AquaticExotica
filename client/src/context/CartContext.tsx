import * as React from "react";
import { createContext, useEffect, useState, useRef, ReactNode } from "react";
import { CartItem, Cart } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { saveCart, updateCartItem, deleteCartItem } from "@/lib/shop-api";
// import { useCartAnalytics } from "@/hooks/use-analytics";

// Queue item for individual cart updates
interface PendingUpdate {
  type: 'update' | 'delete';
  productId: number;
  variantId: number | null;
  quantity?: number;
  timestamp: number;
}

interface CartContextType {
  cart: Cart;
  addItem: (product: CartItem, quantity?: number, openCart?: boolean) => void;
  removeItem: (id: number, variantId?: number) => void;
  updateQuantity: (id: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const defaultCart: Cart = {
  items: [],
  count: 0,
  total: 0
};

export const CartContext = createContext<CartContextType>({
  cart: defaultCart,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isCartOpen: false,
  setIsCartOpen: () => {}
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(() => {
    // Load cart from localStorage if available
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : defaultCart;
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { currentUser } = useAuth();
  
  // Queue for pending updates
  const updateQueueRef = useRef<PendingUpdate[]>([]);
  const isProcessingRef = useRef(false);
  const updateTimeoutRef = useRef<number | undefined>();

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Process update queue one at a time with delays
  const processUpdateQueue = React.useCallback(async () => {
    if (isProcessingRef.current || !currentUser) return;
    
    if (updateQueueRef.current.length === 0) {
      isProcessingRef.current = false;
      return;
    }

    isProcessingRef.current = true;
    const update = updateQueueRef.current.shift();
    
    if (!update) {
      isProcessingRef.current = false;
      return;
    }

    try {
      if (update.type === 'delete') {
        // Delete immediately (no delay)
        console.log('🗑️ Deleting cart item', { productId: update.productId, variantId: update.variantId });
        await deleteCartItem(update.productId, update.variantId);
        console.log('✅ Cart item deleted');
      } else {
        // Update with delay
        console.log('🔁 Updating cart item', { productId: update.productId, variantId: update.variantId, quantity: update.quantity });
        await updateCartItem(update.productId, update.variantId, update.quantity || 0);
        console.log('✅ Cart item updated');
      }
    } catch (error) {
      console.error('❌ Failed to update cart item', error);
    }

    // Process next item after delay (500ms for updates, immediate for deletes)
    if (updateQueueRef.current.length > 0) {
      const delay = updateQueueRef.current[0]?.type === 'delete' ? 0 : 500;
      updateTimeoutRef.current = window.setTimeout(() => {
        processUpdateQueue();
      }, delay);
    } else {
      isProcessingRef.current = false;
    }
  }, [currentUser]);

  // Queue an update for backend sync
  const queueUpdate = React.useCallback((update: PendingUpdate) => {
    if (!currentUser) return;

    // Remove any pending updates for the same item (keep only latest)
    updateQueueRef.current = updateQueueRef.current.filter(
      u => !(u.productId === update.productId && u.variantId === update.variantId)
    );

    // Add new update
    updateQueueRef.current.push({
      ...update,
      timestamp: Date.now()
    });

    // Start processing if not already processing
    if (!isProcessingRef.current) {
      const delay = update.type === 'delete' ? 0 : 500;
      updateTimeoutRef.current = window.setTimeout(() => {
        processUpdateQueue();
      }, delay);
    }
  }, [currentUser, processUpdateQueue]);

  // Initial cart sync on sign-in
  useEffect(() => {
    if (currentUser && cart.items.length > 0) {
      // Use full cart sync for initial sync only
      const timer = window.setTimeout(async () => {
        try {
          console.log('⤴️ Initial cart sync after sign-in', {
            userId: currentUser.id,
            items: cart.items,
          });
          await saveCart(cart);
          console.log('✅ Initial cart synced to backend');
        } catch (e) {
          console.error('❌ Failed to sync cart to backend', e);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentUser?.id]); // Only on user change, not cart change

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Update cart totals
  const updateTotals = (items: CartItem[]) => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { count, total };
  };

  // Add item to cart
  const addItem = (product: CartItem, quantity = 1, openCart = false) => {
    setCart(prevCart => {
      // Find item by id and variant if provided (treat variant-specific items separately)
      const existingItemIndex = prevCart.items.findIndex(item => {
        if (product.variantId !== undefined) {
          return item.id === product.id && item.variantId === product.variantId;
        }
        return item.id === product.id && item.variantId === undefined;
      });

      const maxAvailable = product.maxStock ?? Infinity;
      let newItems;
      let finalQuantity: number;

      if (existingItemIndex >= 0) {
        // Update existing item quantity but cap to maxStock if provided
        newItems = [...prevCart.items];
        const existing = newItems[existingItemIndex];
        const desired = existing.quantity + quantity;
        finalQuantity = Math.min(desired, existing.maxStock ?? maxAvailable);
        newItems[existingItemIndex] = {
          ...existing,
          quantity: finalQuantity
        };
      } else {
        // Add new item, cap initial quantity to maxStock
        finalQuantity = Math.min(quantity, maxAvailable === Infinity ? quantity : Math.max(0, maxAvailable));
        newItems = [...prevCart.items, { ...product, quantity: finalQuantity }];
      }

      const { count, total } = updateTotals(newItems);
      
      // Queue backend update
      queueUpdate({
        type: 'update',
        productId: product.id,
        variantId: product.variantId ?? null,
        quantity: finalQuantity
      });

      return { items: newItems, count, total };
    });

    // Track cart interaction
    // trackCartInteraction('add_to_cart', {
    //   product_id: product.id,
    //   product_name: product.name,
    //   quantity: quantity,
    //   price: product.price,
    // });

    // Only open cart if explicitly requested
    if (openCart) {
      setIsCartOpen(true);
    }
  };

  // Remove item from cart
  const removeItem = (id: number, variantId?: number) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(item => {
        if (variantId !== undefined) {
          return !(item.id === id && item.variantId === variantId);
        }
        return item.id !== id;
      });
      const { count, total } = updateTotals(newItems);
      
      // Queue delete immediately (no delay)
      queueUpdate({
        type: 'delete',
        productId: id,
        variantId: variantId ?? null
      });

      return { items: newItems, count, total };
    });
  };

  // Update item quantity
  const updateQuantity = (id: number, quantity: number, variantId?: number) => {
    if (quantity <= 0) {
      removeItem(id, variantId);
      return;
    }

    setCart(prevCart => {
      const newItems = prevCart.items.map(item => {
        if (item.id !== id) return item;
        if (variantId !== undefined && item.variantId !== variantId) return item;
        // Enforce maxStock if present on the item
        const capped = item.maxStock !== undefined ? Math.min(quantity, item.maxStock) : quantity;
        return { ...item, quantity: capped };
      });
      const { count, total } = updateTotals(newItems);
      
      // Queue backend update
      const updatedItem = newItems.find(item => 
        item.id === id && (variantId === undefined ? item.variantId === undefined : item.variantId === variantId)
      );
      
      if (updatedItem) {
        queueUpdate({
          type: 'update',
          productId: id,
          variantId: variantId ?? null,
          quantity: updatedItem.quantity
        });
      }

      return { items: newItems, count, total };
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart(defaultCart);
  };

  return React.createElement(
    CartContext.Provider,
    { 
      value: { 
        cart, 
        addItem, 
        removeItem, 
        updateQuantity, 
        clearCart,
        isCartOpen,
        setIsCartOpen
      }
    },
    children
  );
}

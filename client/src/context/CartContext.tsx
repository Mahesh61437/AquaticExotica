import * as React from "react";
import { createContext, useEffect, useState, ReactNode } from "react";
import { CartItem, Cart } from "@/types";
// import { useCartAnalytics } from "@/hooks/use-analytics";

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
  // const { trackCartInteraction, trackCartAbandonmentEvent } = useCartAnalytics();

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

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

      if (existingItemIndex >= 0) {
        // Update existing item quantity but cap to maxStock if provided
        newItems = [...prevCart.items];
        const existing = newItems[existingItemIndex];
        const desired = existing.quantity + quantity;
        const capped = Math.min(desired, existing.maxStock ?? maxAvailable);
        newItems[existingItemIndex] = {
          ...existing,
          quantity: capped
        };
      } else {
        // Add new item, cap initial quantity to maxStock
        const cappedQty = Math.min(quantity, maxAvailable === Infinity ? quantity : Math.max(0, maxAvailable));
        newItems = [...prevCart.items, { ...product, quantity: cappedQty }];
      }

      const { count, total } = updateTotals(newItems);
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

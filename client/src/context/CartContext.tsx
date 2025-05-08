import { createContext, useEffect, useState, ReactNode } from "react";
import { CartItem, Cart } from "@shared/schema";

interface CartContextType {
  cart: Cart;
  addItem: (product: CartItem, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
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
  const addItem = (product: CartItem, quantity = 1) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(item => item.id === product.id);
      let newItems;

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = [...prevCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
      } else {
        // Add new item
        newItems = [...prevCart.items, { ...product, quantity }];
      }

      const { count, total } = updateTotals(newItems);
      return { items: newItems, count, total };
    });

    // Open cart when adding an item
    setIsCartOpen(true);
  };

  // Remove item from cart
  const removeItem = (id: number) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(item => item.id !== id);
      const { count, total } = updateTotals(newItems);
      return { items: newItems, count, total };
    });
  };

  // Update item quantity
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setCart(prevCart => {
      const newItems = prevCart.items.map(item => 
        item.id === id ? { ...item, quantity } : item
      );
      const { count, total } = updateTotals(newItems);
      return { items: newItems, count, total };
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart(defaultCart);
  };

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        addItem, 
        removeItem, 
        updateQuantity, 
        clearCart,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

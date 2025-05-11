import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Link } from "wouter";
import { ShoppingBag, X, Plus, Minus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ImageWithFallback } from "@/components/ui/image";

export function ShoppingCart() {
  const { cart, removeItem, updateQuantity, clearCart, isCartOpen, setIsCartOpen } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="sm:max-w-md w-full">
        <SheetHeader className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-heading font-bold">Shopping Cart</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
              <SheetClose asChild>
                <Button 
                  variant="default" 
                  className="mt-4" 
                  onClick={() => setIsCartOpen(false)}
                >
                  Continue Shopping
                </Button>
              </SheetClose>
            </div>
          ) : (
            <div>
              <ul className="divide-y">
                {cart.items.map((item) => (
                  <li key={item.id} className="py-4 flex items-center">
                    <ImageWithFallback 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="h-20 w-20 object-cover rounded"
                    />
                    
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 py-1 border-x">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <span className="font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-4 text-gray-400 hover:text-red-500"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </li>
                ))}
              </ul>
              
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Subtotal:</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Shipping and taxes calculated at checkout
                </p>
                
                <div className="mt-6 space-y-3">
                  <SheetClose asChild>
                    <Button asChild className="w-full">
                      <Link href="/checkout">Checkout Now</Link>
                    </Button>
                  </SheetClose>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

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

export function ShoppingCart() {
  const { cart, removeItem, updateQuantity, clearCart, isCartOpen, setIsCartOpen } = useCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="w-[85vw] sm:max-w-md">
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
              <ul className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <li key={item.id} className="py-6 sm:py-4">
                    <div className="flex items-start gap-4">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="h-24 w-24 sm:h-20 sm:w-20 object-cover rounded-lg shadow-sm"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-sm leading-tight mb-2">
                          {item.name}
                        </h3>
                        
                        <div className="space-y-3">
                          {/* Price per unit */}
                          <div className="text-sm text-gray-600">
                            {formatPrice(item.price)} each
                          </div>
                          
                          {/* Quantity controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border-2 border-gray-200 rounded-lg shadow-sm">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 p-0 hover:bg-gray-100 active:bg-gray-200"
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variantId)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="px-4 py-2 border-x border-gray-200 min-w-[50px] text-center font-semibold text-gray-900">
                                {item.quantity}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 p-0 hover:bg-gray-100 active:bg-gray-200"
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                                disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                                title={item.maxStock !== undefined && item.quantity >= item.maxStock ? 'Max available stock reached' : undefined}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Total price */}
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {formatPrice(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Remove button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                        onClick={() => removeItem(item.id, item.variantId)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                    <span>Subtotal:</span>
                    <span>{formatPrice(cart.total)}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2 text-center">
                    Shipping and taxes calculated at checkout
                  </p>
                </div>
                
                <div className="space-y-3">
                  <SheetClose asChild>
                    <Button asChild className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90">
                      <Link href="/checkout">Checkout Now</Link>
                    </Button>
                  </SheetClose>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base font-semibold border-2 hover:bg-gray-50"
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

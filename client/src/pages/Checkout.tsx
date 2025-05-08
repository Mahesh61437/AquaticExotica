import { Helmet } from "react-helmet";
import { useCart } from "@/hooks/use-cart";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingBag } from "lucide-react";

export default function Checkout() {
  const { cart } = useCart();

  // If cart is empty, show a message
  if (cart.items.length === 0) {
    return (
      <>
        <Helmet>
          <title>Checkout - ModernShop</title>
          <meta name="description" content="Complete your purchase at ModernShop with our secure checkout process." />
          <meta property="og:title" content="Checkout - ModernShop" />
          <meta property="og:description" content="Complete your purchase at ModernShop with our secure checkout process." />
        </Helmet>

        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-3xl font-heading font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some products to your cart before proceeding to checkout.</p>
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - ModernShop</title>
        <meta name="description" content="Complete your purchase at ModernShop with our secure checkout process." />
        <meta property="og:title" content="Checkout - ModernShop" />
        <meta property="og:description" content="Complete your purchase at ModernShop with our secure checkout process." />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-heading font-bold mb-2">Checkout</h1>
        <div className="flex items-center text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-primary">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 font-medium">Checkout</span>
        </div>

        <CheckoutForm />
      </div>
    </>
  );
}

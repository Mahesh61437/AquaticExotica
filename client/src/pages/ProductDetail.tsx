import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ShoppingCart, Package, ChevronRight, Truck, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Product } from "@shared/schema";
import { formatPrice, generateStarRating, getStockStatus } from "@/lib/utils";
import { ProductCard } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { StockNotificationForm } from "@/components/product/StockNotificationForm";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const { toast } = useToast();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  const productId = params?.id ? parseInt(params.id) : 0;
  
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });
  
  // Also fetch related products based on category
  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !!product,
    select: (data) => {
      return data
        .filter(p => p.id !== productId && p.category === product?.category)
        .slice(0, 4);
    }
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    // Do not add to cart if the product is out of stock
    if (product.stock <= 0) {
      toast({
        title: "Cannot add to cart",
        description: "This product is currently out of stock.",
        variant: "destructive"
      });
      return;
    }
    
    // Make sure the quantity doesn't exceed available stock
    const finalQuantity = Math.min(quantity, product.stock);
    
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.toString()),
      imageUrl: product.imageUrl,
      quantity: finalQuantity,
    }, finalQuantity, true); // Open cart when adding from product detail
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleQuantityChange = (value: number) => {
    setQuantity(Math.max(1, value));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
            <div className="space-y-4 mt-6">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Button asChild>
          <a href="/shop">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - ModernShop</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={`${product.name} - ModernShop`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.imageUrl} />
        <meta property="og:type" content="product" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 mb-8">
          <a href="/home" className="hover:text-primary">Home</a>
          <ChevronRight className="h-4 w-4 mx-2" />
          <a href="/shop" className="hover:text-primary">Shop</a>
          <ChevronRight className="h-4 w-4 mx-2" />
          <a href={`/shop/${product.category.toLowerCase()}`} className="hover:text-primary">{product.category}</a>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-700 font-medium">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Product Image */}
          <div className="aspect-[3/4] overflow-hidden rounded-lg">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-heading font-bold">{product.name}</h1>
            
            <div className="flex items-center mt-4">
              <div className="flex text-yellow-400 text-sm mr-2"
                dangerouslySetInnerHTML={{ __html: generateStarRating(product.rating) }}>
              </div>
              <span className="text-sm text-gray-500">({product.rating} rating)</span>
            </div>
            
            <div className="mt-4">
              {product.compareAtPrice ? (
                <div className="flex items-center">
                  <span className="text-2xl font-semibold text-accent mr-2">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-gray-400 line-through text-lg">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="ml-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                    SALE
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-semibold">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            <p className="mt-6 text-gray-700">{product.description}</p>
            
            <div className="mt-8 border-t border-b py-4">
              <div className="flex items-center mb-4">
                <span className="text-gray-700 mr-4">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <span className="text-lg">-</span>
                  </Button>
                  <span className="px-4 py-1 border-x min-w-[40px] text-center">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleQuantityChange(quantity + 1)}
                  >
                    <span className="text-lg">+</span>
                  </Button>
                </div>
                {(() => {
                  const stockInfo = getStockStatus(product.stock);
                  return (
                    <div className="ml-4">
                      <Badge className={`${stockInfo.color}`} variant="outline">
                        <Package className="h-3 w-3 mr-1" />
                        {stockInfo.text} ({product.stock} available)
                      </Badge>
                      {stockInfo.message && (
                        <p className="text-xs mt-1 text-gray-600">{stockInfo.message}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {product.stock > 0 ? (
                  <Button 
                    className="flex-1"
                    size="lg"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                  </Button>
                ) : (
                  <div className="w-full">
                    <StockNotificationForm 
                      product={product}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm">Free shipping on orders above ₹2000</span>
              </div>
              <div className="flex items-center">
                <RotateCcw className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm">No returns, refund only for dead-on-arrival plants</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm">3-5 working days for delivery</span>
              </div>
            </div>
            
            <Accordion type="single" collapsible className="mt-8">
              <AccordionItem value="details" className="border-b">
                <AccordionTrigger className="text-base font-medium py-4">Product Details</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>{product.description}</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Category: {product.category}</li>
                      <li>Tags: {product.tags.join(", ")}</li>
                      {product.isNew && <li>New arrival</li>}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping" className="border-b">
                <AccordionTrigger className="text-base font-medium py-4">Shipping & Returns</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Shipping</h4>
                      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-2 mt-2">
                        <li>Free shipping on orders more than ₹2000</li>
                        <li>It will take at least 3-5 working days to ship</li>
                        <li>Delivery charges:
                          <ul className="list-disc pl-5 space-y-1 mt-1">
                            <li>₹100 per kg for Karnataka</li>
                            <li>₹120 per kg for Andhra Pradesh, Kerala, Tamil Nadu</li>
                            <li>₹150 per kg for other places</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium">Returns & Refunds</h4>
                      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-2 mt-2">
                        <li>No returns</li>
                        <li>Refund is only eligible when you receive the plants dead on arrival</li>
                        <li>Unboxing video is mandatory for refund</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="contact" className="border-b">
                <AccordionTrigger className="text-base font-medium py-4">Contact Us</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Get in Touch</h4>
                      <ul className="text-sm text-gray-600 space-y-2 mt-2">
                        <li><span className="font-medium">Email:</span> mahesh@aquaticexotica.com</li>
                        <li><span className="font-medium">Phone:</span> 8074751370</li>
                        <li><span className="font-medium">Address:</span> Hagadur, Whitefield, Bangalore</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
        
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-heading font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

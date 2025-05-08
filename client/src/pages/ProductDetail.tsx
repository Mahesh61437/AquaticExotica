import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ShoppingCart, Heart, Star, ChevronRight, Truck, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Product } from "@shared/schema";
import { formatPrice, generateStarRating } from "@/lib/utils";
import { ProductCard } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

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
    
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.toString()),
      imageUrl: product.imageUrl,
      quantity,
    });
    
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
          <a href="/" className="hover:text-primary">Home</a>
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
                <span className="ml-4 text-sm text-gray-500">
                  {product.stock} items available
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="flex-1"
                  size="lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2"
                >
                  <Heart className="mr-2 h-5 w-5" /> Add to Wishlist
                </Button>
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm">Free shipping for orders over $100</span>
              </div>
              <div className="flex items-center">
                <RotateCcw className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm">30-day return policy</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm">Secure payments</span>
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
                      <p className="text-sm text-gray-600">
                        Free standard shipping on orders over $100. Expected delivery within 3-5 business days.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Returns</h4>
                      <p className="text-sm text-gray-600">
                        We offer a 30-day return policy. You can return your product for a full refund or exchange it for another item.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="size-guide" className="border-b">
                <AccordionTrigger className="text-base font-medium py-4">Size Guide</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Please refer to the size guide below to find your perfect fit.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 border">Size</th>
                            <th className="px-4 py-2 border">Chest (in)</th>
                            <th className="px-4 py-2 border">Waist (in)</th>
                            <th className="px-4 py-2 border">Hips (in)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-2 border">S</td>
                            <td className="px-4 py-2 border">36-38</td>
                            <td className="px-4 py-2 border">28-30</td>
                            <td className="px-4 py-2 border">38-40</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border">M</td>
                            <td className="px-4 py-2 border">38-40</td>
                            <td className="px-4 py-2 border">30-32</td>
                            <td className="px-4 py-2 border">40-42</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border">L</td>
                            <td className="px-4 py-2 border">40-42</td>
                            <td className="px-4 py-2 border">32-34</td>
                            <td className="px-4 py-2 border">42-44</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 border">XL</td>
                            <td className="px-4 py-2 border">42-44</td>
                            <td className="px-4 py-2 border">34-36</td>
                            <td className="px-4 py-2 border">44-46</td>
                          </tr>
                        </tbody>
                      </table>
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

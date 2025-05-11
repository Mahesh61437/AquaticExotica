import { useState, useRef, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Check, Package, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { formatPrice, generateStarRating, getStockStatus } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Use Intersection Observer to load images only when they enter viewport
  useEffect(() => {
    if (!imageRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            // Remove data-src to avoid setting the src again
            img.removeAttribute('data-src');
          }
          // Unobserve after setting src to avoid unnecessary calls
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px 0px', // Load images 200px before they enter viewport
      threshold: 0.01
    });
    
    observer.observe(imageRef.current);
    
    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Do not add to cart if the product is out of stock
    if (product.stock <= 0) return;
    
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.toString()),
      imageUrl: product.imageUrl,
      quantity: 1
    });
    
    // Show added state for 1.5 seconds
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <Link 
      href={`/product/${product.id}`}
      className="product-card group"
    >
      <div className="product-image relative overflow-hidden">
        {/* Show placeholder until image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        )}
        
        <img 
          ref={imageRef}
          data-src={product.imageUrl} 
          alt={product.name} 
          className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="  // Tiny transparent placeholder
        />
        
        {/* Sale or New Badge */}
        {product.isSale && (
          <div className="badge-sale">SALE</div>
        )}
        {product.isNew && (
          <div className="badge-new">NEW</div>
        )}
        
        {/* Quick Actions */}
        <div className="quick-actions">
          <Button 
            className={`flex-1 text-xs py-1 ${isAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            title={product.stock <= 0 ? "Out of stock" : ""}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" /> Added
              </>
            ) : product.stock <= 0 ? (
              <>
                <Package className="h-4 w-4 mr-1" /> Out of Stock
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" /> Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{product.name}</h3>
            <div className="flex items-center mt-1">
              {product.compareAtPrice ? (
                <>
                  <span className="text-accent font-semibold">
                    {formatPrice(product.price)}
                  </span>
                  <span className="ml-2 text-gray-400 line-through text-sm">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                </>
              ) : (
                <span className="text-dark font-semibold">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            {/* Stock Indicator */}
            {(() => {
              const stockInfo = getStockStatus(product.stock);
              return (
                <div className="mt-2">
                  <Badge className={`${stockInfo.color}`} variant="outline">
                    <Package className="h-3 w-3 mr-1" />
                    {stockInfo.text}
                  </Badge>
                  {product.stock <= 5 && product.stock > 0 && (
                    <p className="text-xs mt-1 text-amber-600 font-medium">Only {product.stock} left!</p>
                  )}
                </div>
              );
            })()}
            
          </div>
          <div className="flex text-yellow-400 text-sm" 
            dangerouslySetInnerHTML={{ __html: generateStarRating(product.rating) }}>
          </div>
        </div>
      </div>
    </Link>
  );
}

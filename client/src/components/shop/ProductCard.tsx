import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Check, Package, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Product } from "@/types";
import { formatPrice, generateStarRating, getStockStatus, generateProductUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CachedImage } from "@/components/ui/cached-image";
import React from "react";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = React.memo(({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // Use thumbnail if available, otherwise fall back to main image
  const displayImage = product.thumbnailUrl || product.imageUrl;

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
      href={generateProductUrl(product)}
      className="product-card group"
    >
      <div className="product-image relative overflow-hidden">
        {/* Using CachedImage component for better performance */}
        <CachedImage 
          src={displayImage}
          alt={product.name}
          className="w-full h-full aspect-[3/4]"
          size="medium"
          quality={85}
          objectFit="cover"
          fallbackSrc={product.imageUrl}
        />
        
        {/* Priority Badge - Show only one with priority: Featured > Trending > New > Sale */}
        {(() => {
          if (product.isFeatured) {
            return (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                  FEATURED
                </Badge>
              </div>
            );
          } else if (product.isTrending) {
            return (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                  TRENDING
                </Badge>
              </div>
            );
          } else if (product.isNew) {
            return (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                  NEW
                </Badge>
              </div>
            );
          } else if (product.isSale) {
            return (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                  SALE
                </Badge>
              </div>
            );
          }
          return null;
        })()}
        
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
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if product data actually changed
  const prev = prevProps.product;
  const next = nextProps.product;
  
  return (
    prev.id === next.id &&
    prev.name === next.name &&
    prev.price === next.price &&
    prev.stock === next.stock &&
    prev.imageUrl === next.imageUrl &&
    prev.thumbnailUrl === next.thumbnailUrl &&
    prev.isNew === next.isNew &&
    prev.isSale === next.isSale &&
    prev.isFeatured === next.isFeatured &&
    prev.isTrending === next.isTrending
  );
});

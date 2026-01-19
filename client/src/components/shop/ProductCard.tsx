import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Check, Package, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Product } from "@/types";
import { formatPrice, generateStarRating, getStockStatus, generateProductUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
// removed unused imports: Skeleton, OptimizedImage
import React from "react";

// Custom interface for display purposes that allows string[] tags
interface DisplayProduct extends Omit<Product, 'tags'> {
  tags: string[];
  thumbnailUrl?: string;
}

interface ProductCardProps {
  product: DisplayProduct;
}

export const ProductCard = React.memo(({ product }: ProductCardProps) => {
  const { addItem } = useCart();
    const [isAdded, setIsAdded] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

  // Use thumbnail if available, otherwise fall back to main image
  const displayImage = product.thumbnailUrl || product.imageUrl;
  
    // Find the lowest priced variant (prefer in-stock variants)
    const getLowestPricedVariant = () => {
      if (!product.variants || product.variants.length === 0) return null;
      
      // Filter in-stock variants first
      const inStockVariants = product.variants.filter(v => v.isInStock);
      const variantsToCheck = inStockVariants.length > 0 ? inStockVariants : product.variants;
      
      // Find variant with lowest price (use offerPrice if available, otherwise originalPrice)
      return variantsToCheck.reduce((lowest, current) => {
        const lowestPrice = parseFloat(lowest.offerPrice || lowest.originalPrice || '0');
        const currentPrice = parseFloat(current.offerPrice || current.originalPrice || '0');
        return currentPrice < lowestPrice ? current : lowest;
      });
    };

    const lowestVariant = getLowestPricedVariant();
    const stock = lowestVariant?.stock ?? 0;
    const maxStock = (product.variants ?? []).reduce(
      (max, v) => Math.max(max, v.stock), 0);

    const handleAddToCart = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // If product has variants, use the lowest priced variant
      if (product.variants && product.variants.length > 0) {
        if (!lowestVariant || !lowestVariant.isInStock) {
          return; // Can't add if no in-stock variant
        }
        
        const variantPrice = parseFloat(lowestVariant.offerPrice || lowestVariant.originalPrice || '0');
        const variantName = lowestVariant.description || lowestVariant.variantType || '';
        
        addItem({
          id: product.id,
          name: product.name,
          price: variantPrice,
          imageUrl: product.imageUrl,
          quantity: 1,
          variantId: lowestVariant.id,
          variantName: variantName,
          maxStock: lowestVariant.stock,
        });
      } else {
        // No variants - can't add (shouldn't happen with new structure, but handle gracefully)
        return;
      }
      
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
        {/* Using regular img tag for debugging */}
        <img 
          src={displayImage}
          alt={product.name}
          className="w-full h-full aspect-[3/4] object-cover"
          onLoad={() => setImageLoaded(true)}
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
        
        {/* Quick Actions - Shows on hover */}
        <div className="quick-actions">
          <Button 
            className={`flex-1 text-xs py-1 ${isAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
            onClick={handleAddToCart}
            disabled={!lowestVariant || !lowestVariant.isInStock || stock <= 0}
            title={!lowestVariant || !lowestVariant.isInStock || stock <= 0 ? "Out of stock" : "Add to cart"}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" /> Added
              </>
            ) : !lowestVariant || !lowestVariant.isInStock || stock <= 0 ? (
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
              {product.priceRange ? (
                <>
                  <span className="text-accent font-semibold">
                    {formatPrice(product.priceRange)}
                  </span>
                </>
              ) : (
                <span className="text-dark font-semibold">
                  {formatPrice(product.priceRange)}
                </span>
              )}
            </div>
            
            {/* Stock Indicator */}
            {(() => {
              const stockInfo = getStockStatus(maxStock);
              return (
                <div className="mt-2">
                  <Badge className={`${stockInfo.color}`} variant="outline">
                    <Package className="h-3 w-3 mr-1" />
                    {stockInfo.text}
                  </Badge>
                  {stock <= 5 && stock > 0 && (
                    <p className="text-xs mt-1 text-amber-600 font-medium">Only {stock} left!</p>
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
    // prev.price === next.price &&
    // prev.stock === next.stock &&
    prev.imageUrl === next.imageUrl &&
    prev.thumbnailUrl === next.thumbnailUrl &&
    prev.isNew === next.isNew &&
    prev.isSale === next.isSale &&
    prev.isFeatured === next.isFeatured &&
    prev.isTrending === next.isTrending
  );
});

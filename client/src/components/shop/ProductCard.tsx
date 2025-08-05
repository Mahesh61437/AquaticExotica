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
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <Link href={generateProductUrl(product)} className="block">
        <div className="relative aspect-[3/4] overflow-hidden">
          <CachedImage 
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            size="medium"
            quality={85}
            objectFit="cover"
            fallbackSrc={product.imageUrl}
          />
          
          {/* Priority Badge */}
          {(() => {
            if (product.isFeatured) {
              return (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-purple-600 text-white text-xs font-semibold">
                    FEATURED
                  </Badge>
                </div>
              );
            } else if (product.isTrending) {
              return (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-orange-600 text-white text-xs font-semibold">
                    TRENDING
                  </Badge>
                </div>
              );
            } else if (product.isNew) {
              return (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-green-600 text-white text-xs font-semibold">
                    NEW
                  </Badge>
                </div>
              );
            } else if (product.isSale) {
              return (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-red-600 text-white text-xs font-semibold">
                    SALE
                  </Badge>
                </div>
              );
            }
            return null;
          })()}
          
          {/* Quick Actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-end justify-center pb-4">
            <div className="transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <Button 
                className={`bg-white text-gray-900 hover:bg-gray-100 ${isAdded ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                title={product.stock <= 0 ? "Out of stock" : ""}
                size="sm"
              >
                {isAdded ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Added
                  </>
                ) : product.stock <= 0 ? (
                  <>
                    <Package className="h-4 w-4 mr-2" /> Out of Stock
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {product.compareAtPrice ? (
                <>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            <div className="flex text-yellow-400 text-sm" 
              dangerouslySetInnerHTML={{ __html: generateStarRating(product.rating) }}>
            </div>
          </div>
          
          {/* Stock Status */}
          {(() => {
            const stockInfo = getStockStatus(product.stock);
            return (
              <div className="flex items-center justify-between">
                <Badge className={`${stockInfo.color} text-xs`} variant="outline">
                  <Package className="h-3 w-3 mr-1" />
                  {stockInfo.text}
                </Badge>
                {product.stock <= 5 && product.stock > 0 && (
                  <span className="text-xs text-amber-600 font-medium">
                    Only {product.stock} left!
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </Link>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id;
});
 
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Check, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { formatPrice, generateStarRating } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
      <div className="product-image">
        <img src={product.imageUrl} alt={product.name} />
        
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
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" /> Added
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
          </div>
          <div className="flex text-yellow-400 text-sm" 
            dangerouslySetInnerHTML={{ __html: generateStarRating(product.rating) }}>
          </div>
        </div>
      </div>
    </Link>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Product } from "@/types";
import { Link } from "wouter";
import { formatPrice, generateStarRating } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { apiCache } from "@/lib/api-cache";
import { CachedImage } from "@/components/ui/cached-image";
import React from "react";

export const TrendingProducts = React.memo(() => {
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [isClientLoading, setIsClientLoading] = useState(true);
  
  // Use React Query for cache invalidation
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/"],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fast client-side data loading with apiCache
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsClientLoading(true);
        const productsData = await apiCache.get<Product[]>('/api/products/');
        
        // Filter trending products
        const trendingData = productsData.filter(product => product.isTrending);
        setLocalProducts(trendingData);
      } catch (error) {
        console.error('Failed to load trending products:', error);
      } finally {
        setIsClientLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Update local state when React Query data changes
  useEffect(() => {
    if (allProducts.length > 0) {
      // Filter trending products
      const trendingData = allProducts.filter(product => product.isTrending);
      setLocalProducts(trendingData);
    }
  }, [allProducts]);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold text-center mb-8">Trending Now</h2>
        
        {isClientLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-20 mb-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {localProducts.slice(0, 4).map((product) => (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`}
                className="bg-gray-50 p-4 rounded-lg flex items-center gap-4 hover:shadow-md transition"
              >
                <div className="relative w-24 h-24">
                  <CachedImage 
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-24 h-24 rounded-md"
                    size="small"
                    objectFit="cover"
                  />
                </div>
                
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <div className="flex text-yellow-400 text-sm mt-1"
                    dangerouslySetInnerHTML={{ __html: generateStarRating(product.rating) }}>
                  </div>
                  <div className="mt-2">
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}, (prevProps, nextProps) => {
  // No props to compare, so always return true to prevent re-renders
  return true;
});

TrendingProducts.displayName = 'TrendingProducts';

import { useQuery } from "@tanstack/react-query";
import { Product } from "@/types";
import { Link } from "wouter";
import { formatPrice, generateStarRating } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { apiCache } from "@/lib/api-cache";
import { apiRequest } from "@/lib/queryClient";

export function TrendingProducts() {
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const imageRefs = useRef<Record<number, HTMLImageElement | null>>({});
  
  // Use React Query for trending products
  const { data: trendingProductsResponse } = useQuery({
    queryKey: ["/api/products/trending"],
    staleTime: 60 * 1000, // 1 minute
    queryFn: async () => {
      const response = await apiRequest("/api/products/trending");
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return response || [];
    },
  });
  
  // Update local state when React Query data changes
  useEffect(() => {
    if (trendingProductsResponse) {
      setLocalProducts(trendingProductsResponse);
      setIsClientLoading(false);
      
      // Initialize image loading states
      const initialLoadedState: Record<number, boolean> = {};
      trendingProductsResponse.forEach(product => {
        initialLoadedState[product.id] = false;
      });
      setLoadedImages(initialLoadedState);
    }
  }, [trendingProductsResponse]);
  
  // Intersection Observer for lazy loading images
  useEffect(() => {
    if (localProducts.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const productId = Number(img.dataset.productId);
            
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.onload = () => {
                setLoadedImages(prev => ({
                  ...prev,
                  [productId]: true
                }));
              };
              img.removeAttribute('data-src');
            }
            
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '100px 0px',
        threshold: 0.01
      }
    );
    
    Object.entries(imageRefs.current).forEach(([productId, imgRef]) => {
      if (imgRef) {
        observer.observe(imgRef);
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, [localProducts]);

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
                  <div className={`absolute inset-0 bg-gray-200 rounded-md transition-opacity duration-300 ${
                    loadedImages[product.id] ? 'opacity-0' : 'opacity-100'
                  }`}></div>
                  
                  <img 
                    ref={(el) => imageRefs.current[product.id] = el}
                    data-src={product.imageUrl}
                    data-product-id={product.id}
                    alt={product.name} 
                    className={`w-24 h-24 object-cover rounded-md transition-opacity duration-300 ${
                      loadedImages[product.id] ? 'opacity-100' : 'opacity-0'
                    }`}
                    src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                  />
                </div>
                
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <div className="flex text-yellow-400 text-sm mt-1"
                    dangerouslySetInnerHTML={{ __html: generateStarRating(product.rating) }}>
                  </div>
                  <div className="mt-2">
                    {product.priceRange ? (
                      <>
                        <span className="text-accent font-semibold">
                          {product.priceRange}
                        </span>
                      </>
                    ) : (
                      <span className="text-dark font-semibold">
                        {product.priceRange}
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
}

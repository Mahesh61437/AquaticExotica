import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Link } from "wouter";
import { formatPrice, generateStarRating } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/ui/image";

export function TrendingProducts() {
  const { data: trendingProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/trending"],
  });

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold text-center mb-8">Trending Now</h2>
        
        {isLoading ? (
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
            {trendingProducts.slice(0, 4).map((product) => (
              <Link 
                key={product.id} 
                href={`/product/${product.id}`}
                className="bg-gray-50 p-4 rounded-lg flex items-center gap-4 hover:shadow-md transition"
              >
                <ImageWithFallback 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-24 h-24 object-cover rounded-md"
                />
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
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { Product } from "@/types";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function FeaturedProducts() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [localProducts, setLocalProducts] = useState<{
    featured: Product[];
    new: Product[];
    sale: Product[];
    best: Product[];
  }>({
    featured: [],
    new: [],
    sale: [],
    best: []
  });
  
  // Use specific endpoints for each product type
  const { data: featuredResponse } = useQuery({
    queryKey: ["/api/products/featured"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const response = await apiRequest("/api/products/featured");
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      return response || [];
    },
  });

  const { data: newResponse } = useQuery({
    queryKey: ["/api/products/new"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const response = await apiRequest("/api/products/new");
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      return response || [];
    },
  });

  const { data: saleResponse } = useQuery({
    queryKey: ["/api/products/sale"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const response = await apiRequest("/api/products/sale");
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      return response || [];
    },
  });

  // Update local state when React Query data changes
  useEffect(() => {
    const featuredData = featuredResponse || [];
    const newData = newResponse || [];
    const saleData = saleResponse || [];
    
    // For best sellers, we'll use featured products sorted by rating
    const bestData = [...featuredData].sort((a, b) => {
      const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : a.rating;
      const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : b.rating;
      return ratingB - ratingA;
    });
    
    setLocalProducts({
      featured: featuredData,
      new: newData,
      sale: saleData,
      best: bestData
    });
    
    // Set loading to false once we have any data
    if (featuredResponse !== undefined || newResponse !== undefined || saleResponse !== undefined) {
      setIsClientLoading(false);
    }
  }, [featuredResponse, newResponse, saleResponse]);

  // Determine which products to show based on active category
  let displayProducts: Product[] = [];
  switch (activeCategory) {
    case "new":
      displayProducts = localProducts.new;
      break;
    case "sale":
      displayProducts = localProducts.sale;
      break;
    case "best":
      displayProducts = localProducts.best;
      break;
    default:
      displayProducts = localProducts.featured;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h2 className="text-3xl font-heading font-bold">Featured Products</h2>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Button 
              variant={activeCategory === "all" ? "default" : "outline"}
              onClick={() => setActiveCategory("all")}
              className="px-4 py-2 h-auto"
            >
              All
            </Button>
            <Button 
              variant={activeCategory === "new" ? "default" : "outline"}
              onClick={() => setActiveCategory("new")}
              className="px-4 py-2 h-auto"
            >
              New Arrivals
            </Button>
            <Button 
              variant={activeCategory === "best" ? "default" : "outline"}
              onClick={() => setActiveCategory("best")}
              className="px-4 py-2 h-auto"
            >
              Best Sellers
            </Button>
            <Button 
              variant={activeCategory === "sale" ? "default" : "outline"}
              onClick={() => setActiveCategory("sale")}
              className="px-4 py-2 h-auto"
            >
              On Sale
            </Button>
          </div>
        </div>
        
        {isClientLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-[3/4] bg-gray-200 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <Button asChild variant="outline" className="border-2">
                <Link href="/shop">View All Products</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// For backwards compatibility
export { FeaturedProducts }

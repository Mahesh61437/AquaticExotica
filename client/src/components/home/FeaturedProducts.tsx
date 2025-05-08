import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { Product } from "@shared/schema";
import { Link } from "wouter";

export function FeaturedProducts() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  const { data: featuredProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });
  
  const { data: newProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/new"],
    enabled: activeCategory === "new",
  });
  
  const { data: saleProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/sale"],
    enabled: activeCategory === "sale",
  });

  // Determine which products to show based on active category
  let displayProducts: Product[] = [];
  switch (activeCategory) {
    case "new":
      displayProducts = newProducts;
      break;
    case "sale":
      displayProducts = saleProducts;
      break;
    case "best":
      // For demo purposes, we'll sort featured products by rating to get "best sellers"
      displayProducts = [...featuredProducts].sort((a, b) => {
        const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : a.rating;
        const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : b.rating;
        return ratingB - ratingA;
      });
      break;
    default:
      displayProducts = featuredProducts;
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
        
        {isLoading ? (
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

import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "./ProductCard";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  category?: string;
  filter?: string;
  searchQuery?: string;
  sortOption?: string;
}

export function ProductGrid({ category, filter, searchQuery, sortOption = "default" }: ProductGridProps) {
  // Determine the correct endpoint based on props
  let endpoint = "/api/products";
  if (category) {
    endpoint = `/api/products/category/${category}`;
  } else if (filter === "new") {
    endpoint = "/api/products/new";
  } else if (filter === "sale") {
    endpoint = "/api/products/sale";
  } else if (searchQuery) {
    endpoint = `/api/search?q=${encodeURIComponent(searchQuery)}`;
  }

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: [endpoint],
  });

  // Apply sorting
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortOption) {
      case "price-low-high":
        return parseFloat(a.price.toString()) - parseFloat(b.price.toString());
      case "price-high-low":
        return parseFloat(b.price.toString()) - parseFloat(a.price.toString());
      case "popular":
        return parseFloat(b.rating.toString()) - parseFloat(a.rating.toString());
      case "newest":
        return a.isNew ? -1 : b.isNew ? 1 : 0;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="p-4">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedProducts.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">No products found</h3>
        <p className="text-gray-500">
          {searchQuery 
            ? `No results for "${searchQuery}". Try different keywords.` 
            : "Try adjusting your filters or check back later for new arrivals."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {sortedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

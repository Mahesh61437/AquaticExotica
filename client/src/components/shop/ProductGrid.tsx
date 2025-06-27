import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "./ProductCard";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

// Define new product type based on API response
interface ApiProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  discountPercentage: number;
  stock: number;
  category: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string;
  };
  tags: number[]; // Tag IDs for API operations
  tagDetails: ApiTag[]; // Tag objects for display
  rating: string;
  isActive: boolean;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isInStock: boolean;
  imageUrl: string;
}

// Define tag type
interface ApiTag {
  id: number;
  name: string;
  createdAt: string;
}

// Define paginated response type
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductGridProps {
  category?: string;
  filter?: string;
  searchQuery?: string;
  activeCategories?: string[];
}

export function ProductGrid({ category, filter, searchQuery, activeCategories = [] }: ProductGridProps) {
  // Determine the correct endpoint based on props
  let endpoint = "/api/products/";
  // Only use category-specific endpoint if we have a category URL param
  // and no active category filters (which means filtering is handled client-side)
  if (category && activeCategories.length <= 1) {
    endpoint = `/api/products/category/${category}`;
  } else if (filter === "new") {
    endpoint = "/api/products/new";
  } else if (filter === "sale") {
    endpoint = "/api/products/sale";
  } else if (searchQuery) {
    endpoint = `/api/products/search?q=${encodeURIComponent(searchQuery)}`;
  }

  const { data: response, isLoading, error } = useQuery<ApiProduct[] | PaginatedResponse<ApiProduct>>({
    queryKey: [endpoint, category, filter, searchQuery, activeCategories],
    queryFn: async () => {
      return await apiRequest(endpoint);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Fetch tags for conversion
  const { data: tagsResponse } = useQuery<ApiTag[] | PaginatedResponse<ApiTag>>({
    queryKey: ["/api/tags/"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract tags array from response
  const tags: ApiTag[] = React.useMemo(() => {
    if (!tagsResponse) return [];
    
    // Check if response is paginated
    if (tagsResponse && typeof tagsResponse === 'object' && 'data' in tagsResponse) {
      return (tagsResponse as PaginatedResponse<ApiTag>).data || [];
    }
    
    // Check if response is a direct array
    if (Array.isArray(tagsResponse)) {
      return tagsResponse;
    }
    
    return [];
  }, [tagsResponse]);

  // Helper function to convert tag objects to tag names
  const convertTagsToNames = (tags: ApiTag[]): string[] => {
    return tags.map(tag => tag.name).filter(name => name !== '');
  };

  // Handle different response formats
  const products: ApiProduct[] = React.useMemo(() => {
    if (!response) return [];
    
    // Check if response is paginated
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as PaginatedResponse<ApiProduct>).data || [];
    }
    
    // Check if response is a direct array
    if (Array.isArray(response)) {
      return response;
    }
    
    return [];
  }, [response]);

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

  if (error) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">Error loading products</h3>
        <p className="text-gray-500">
          Failed to load products. Please try again later.
        </p>
      </div>
    );
  }

  if (products.length === 0) {
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

  // Always apply category filtering if there are active categories
  // This ensures filters work even when on a category page
  const displayProducts = activeCategories.length > 0
    ? products.filter(product => activeCategories.includes(product.category?.name || ''))
    : products;

  if (displayProducts.length === 0 && activeCategories.length > 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">No products found</h3>
        <p className="text-gray-500">
          No products match the selected categories. Try different filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {displayProducts.map((product) => (
        <ProductCard key={product.id} product={{
          ...product,
          category: product.category?.name || '',
          tags: convertTagsToNames(product.tagDetails)
        }} />
      ))}
    </div>
  );
}

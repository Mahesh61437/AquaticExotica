import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types";
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
  } | null;
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
  activeCategoryIds?: number[];
  activePriceRange?: [number, number];
  activeInStock?: boolean;
}

export function ProductGrid({ 
  category, 
  filter, 
  searchQuery, 
  activeCategoryIds = [], 
  activePriceRange = [0, 10000],
  activeInStock = false
}: ProductGridProps) {
  // Build the API endpoint with query parameters
  let endpoint = "/api/products/";
  const queryParams = new URLSearchParams();
  
  // Add category IDs if any are selected
  if (activeCategoryIds.length > 0) {
    queryParams.append('category_id', activeCategoryIds.join(','));
  }
  
  // Add price range if it's not the default
  if (activePriceRange[0] > 0 || activePriceRange[1] < 10000) {
    queryParams.append('price_min', activePriceRange[0].toString());
    queryParams.append('price_max', activePriceRange[1].toString());
  }
  
  // Add in stock filter if active
  if (activeInStock) {
    queryParams.append('in_stock', 'true');
  }
  
  // Add search query if present
  if (searchQuery) {
    queryParams.append('q', searchQuery);
  }
  
  // Use category-specific endpoint if we have a category URL param and no active filters
  if (category && activeCategoryIds.length === 0 && activePriceRange[0] === 0 && activePriceRange[1] === 10000 && !activeInStock && !searchQuery) {
    endpoint = `/api/products/category/${category}`;
  } else if (queryParams.toString()) {
    endpoint = `/api/products/?${queryParams.toString()}`;
  }

  const { data: response, isLoading, error } = useQuery<ApiProduct[] | PaginatedResponse<ApiProduct>>({
    queryKey: [endpoint, category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock],
    queryFn: async () => {
      console.log('🛍️ ProductGrid API call:', endpoint);
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

  // Apply client-side filtering based on filter parameter
  const filteredProducts = React.useMemo(() => {
    if (!filter) return products;
    
    switch (filter) {
      case "new":
        return products.filter(product => product.isNew);
      case "sale":
        return products.filter(product => product.isSale);
      case "trending":
        return products.filter(product => product.isTrending);
      default:
        return products;
    }
  }, [products, filter]);

  // No need for additional client-side category filtering since we're using API filtering
  const displayProducts = filteredProducts;

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
    // Instead of showing an error, show empty products to allow filtering to work
    console.warn('API Error loading products:', error);
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">No products available</h3>
        <p className="text-gray-500">
          {searchQuery 
            ? `No results for "${searchQuery}". Try different keywords.` 
            : filter 
            ? `No ${filter} products available at the moment.` 
            : "No products available at the moment. Please check back later."}
        </p>
      </div>
    );
  }

  if (displayProducts.length === 0) {
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
      {displayProducts.map((product) => (
        <ProductCard key={product.id} product={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          discountPercentage: product.discountPercentage,
          stock: product.stock,
          category: product.category ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
            description: product.category.description,
            imageUrl: product.category.imageUrl,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } : {
            id: 0,
            name: 'Uncategorized',
            slug: 'uncategorized',
            description: null,
            imageUrl: '',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          tags: convertTagsToNames(product.tagDetails),
          rating: product.rating,
          isActive: product.isActive,
          isNew: product.isNew,
          isSale: product.isSale,
          isFeatured: product.isFeatured,
          isTrending: product.isTrending,
          isInStock: product.isInStock,
          imageUrl: product.imageUrl,
          createdAt: '',
          updatedAt: ''
        }} />
      ))}
    </div>
  );
}

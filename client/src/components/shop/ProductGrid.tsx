import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

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
  initialPage?: number;
  initialLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function ProductGrid({ 
  category, 
  filter, 
  searchQuery, 
  activeCategoryIds = [], 
  activePriceRange = [0, 10000],
  activeInStock = false,
  initialPage = 1,
  initialLimit = 12,
  onPageChange,
  onLimitChange
}: ProductGridProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialLimit);
  const [paginationMode, setPaginationMode] = React.useState<'pagination' | 'load-more'>('pagination');
  // Build the API endpoint with query parameters
  let endpoint = "/api/products/";
  const queryParams = new URLSearchParams();
  
  // Add pagination parameters
  queryParams.append('page', currentPage.toString());
  queryParams.append('limit', itemsPerPage.toString());
  
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
    endpoint = `/api/products/category/${category}?${queryParams.toString()}`;
  } else {
    endpoint = `/api/products/?${queryParams.toString()}`;
  }

  const { data: response, isLoading, error } = useQuery<ApiProduct[] | PaginatedResponse<ApiProduct>>({
    queryKey: [endpoint, category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock, currentPage, itemsPerPage],
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

  // Handle different response formats and extract pagination info
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

  // Extract pagination info
  const paginationInfo = React.useMemo(() => {
    if (!response) return null;
    
    // Check if response is paginated
    if (response && typeof response === 'object' && 'data' in response) {
      const paginatedResponse = response as PaginatedResponse<ApiProduct>;
      return {
        total: paginatedResponse.total,
        page: paginatedResponse.page,
        limit: paginatedResponse.limit,
        totalPages: paginatedResponse.totalPages
      };
    }
    
    // If not paginated, calculate basic info
    if (Array.isArray(response)) {
      return {
        total: response.length,
        page: 1,
        limit: response.length,
        totalPages: 1
      };
    }
    
    return null;
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

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
    onPageChange?.(1);
  }, [category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock, onPageChange]);

  // Update URL when page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
    onLimitChange?.(limit);
    onPageChange?.(1);
  };

  // No need for additional client-side category filtering since we're using API filtering
  const displayProducts = filteredProducts;

  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <Skeleton className="aspect-[3/4] w-full" />
              <div className="p-4">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
        {paginationInfo && paginationInfo.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-8" />
              ))}
            </div>
          </div>
        )}
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

  // Pagination controls component
  const PaginationControls = () => {
    if (!paginationInfo || paginationInfo.totalPages <= 1) return null;

    const { page, totalPages, total } = paginationInfo;
    const startItem = (page - 1) * itemsPerPage + 1;
    const endItem = Math.min(page * itemsPerPage, total);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {total} products
          </div>
          
          {/* Pagination mode toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={paginationMode === 'pagination' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaginationMode('pagination')}
            >
              Pages
            </Button>
            <Button
              variant={paginationMode === 'load-more' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaginationMode('load-more')}
            >
              Load More
            </Button>
          </div>
        </div>
        
        {paginationMode === 'pagination' && (
          <div className="flex items-center gap-2">
                      <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={page <= 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {paginationMode === 'load-more' && page < totalPages && (
          <Button
            onClick={() => setCurrentPage(page + 1)}
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? 'Loading...' : 'Load More Products'}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
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
      
      <PaginationControls />
    </div>
  );
}

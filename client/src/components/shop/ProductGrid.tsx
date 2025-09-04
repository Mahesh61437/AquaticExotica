import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { Category, Tag } from '@/types';

// Define new product type based on API response
interface ApiProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  discountPercentage: number;
  stock: number;
  categories: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string;
  }[];
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
  createdAt: string;
  updatedAt: string;
}

// Define tag type
interface ApiTag {
  id: number;
  name: string;
  createdAt: string;
}

// Define pagination response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface ProductGridProps {
  category?: string;
  filter?: string;
  searchQuery?: string;
  activeCategoryIds?: number[];
  activePriceRange?: [number, number];
  activeInStock?: boolean;
  initialPage?: number;
  currentPage?: number;
  initialLimit?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const ProductGrid = React.memo(({ 
  category, 
  filter, 
  searchQuery, 
  activeCategoryIds = [], 
  activePriceRange = [0, 10000],
  activeInStock = false,
  initialPage = 1,
  currentPage: controlledPage,
  initialLimit = 12,
  onPageChange,
  onLimitChange
}: ProductGridProps) => {
  const [uncontrolledPage, setUncontrolledPage] = React.useState(initialPage);
  const currentPage = controlledPage !== undefined ? controlledPage : uncontrolledPage;
  const [itemsPerPage, setItemsPerPage] = React.useState(initialLimit);
  
  // Track previous filter values to detect actual changes
  const prevFiltersRef = React.useRef({
    category,
    activeCategoryIds: JSON.stringify(activeCategoryIds),
    activePriceRange: JSON.stringify(activePriceRange),
    activeInStock,
    searchQuery
  });

  // Build the API endpoint with query parameters
  const buildEndpoint = React.useCallback((page: number) => {
    let endpoint = "/api/products/";
    const queryParams = new URLSearchParams();
    
    // Add pagination parameters
    queryParams.append('page', page.toString());
    queryParams.append('page_size', itemsPerPage.toString());
    
    // Add category IDs if any are selected (this takes priority over URL category)
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
    
    // Use category-specific endpoint ONLY if we have a category URL param AND no active filters
    // This ensures that when filters are applied, we use the main products endpoint with filter params
    if (category && activeCategoryIds.length === 0 && activePriceRange[0] === 0 && activePriceRange[1] === 10000 && !activeInStock && !searchQuery) {
      endpoint = `/api/products/category/${category}?${queryParams.toString()}`;
    } else {
      endpoint = `/api/products/?${queryParams.toString()}`;
    }
    
    console.log('🔗 ProductGrid endpoint:', endpoint);
    return endpoint;
  }, [category, activeCategoryIds, activePriceRange, activeInStock, searchQuery, itemsPerPage]);

  // Fetch products with new pagination format
  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: ['products', currentPage, itemsPerPage, category, activeCategoryIds, activePriceRange, activeInStock, searchQuery],
    queryFn: async () => {
      const endpoint = buildEndpoint(currentPage);
      console.log('🔍 ProductGrid: Fetching from endpoint:', endpoint);
      const response = await apiRequest(endpoint);
      console.log('🔍 ProductGrid: Raw API response:', response);
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        console.log('🔍 ProductGrid: Using new pagination format');
        return response as PaginatedResponse<ApiProduct>;
      }
      
      // Fallback to array format
      if (Array.isArray(response)) {
        console.log('🔍 ProductGrid: Using array format fallback');
        return {
          count: response.length,
          next: null,
          previous: null,
          results: response
        } as PaginatedResponse<ApiProduct>;
      }
      
      console.error('🔍 ProductGrid: Invalid API response format:', response);
      throw new Error('Invalid API response format');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract data from response
  const products = productsResponse?.results || [];
  const totalCount = productsResponse?.count || 0;
  const hasNext = !!productsResponse?.next;
  const hasPrevious = !!productsResponse?.previous;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  console.log('🔍 ProductGrid: Extracted data:', {
    productsCount: products.length,
    totalCount,
    totalPages,
    hasNext,
    hasPrevious,
    isLoading,
    error: error?.message
  });

  // Helper to change page and sync with parent if needed
  const handlePageChange = (newPage: number) => {
    console.log('🔄 handlePageChange called with newPage:', newPage, 'currentPage:', currentPage);
    if (onPageChange) {
      console.log('🔄 Calling onPageChange with:', newPage);
      onPageChange(newPage);
    } else {
      console.log('🔄 Setting uncontrolled page to:', newPage);
      setUncontrolledPage(newPage);
    }
  };

  // Reset to page 1 when filters actually change
  React.useEffect(() => {
    const currentFilters = {
      category,
      activeCategoryIds: JSON.stringify(activeCategoryIds),
      activePriceRange: JSON.stringify(activePriceRange),
      activeInStock,
      searchQuery
    };
    
    const prevFilters = prevFiltersRef.current;
    
    // Check if any filter actually changed
    const filtersChanged = 
      prevFilters.category !== currentFilters.category ||
      prevFilters.activeCategoryIds !== currentFilters.activeCategoryIds ||
      prevFilters.activePriceRange !== currentFilters.activePriceRange ||
      prevFilters.activeInStock !== currentFilters.activeInStock ||
      prevFilters.searchQuery !== currentFilters.searchQuery;
    
    if (filtersChanged) {
      console.log('🔄 Filters actually changed, resetting to page 1');
      console.log('🔄 Previous filters:', prevFilters);
      console.log('🔄 Current filters:', currentFilters);
      
      if (onPageChange) {
        onPageChange(1);
      } else {
        setUncontrolledPage(1);
      }
      
      // Update the ref with current filters
      prevFiltersRef.current = currentFilters;
    }
  }, [category, activeCategoryIds, activePriceRange, activeInStock, searchQuery, onPageChange]);

  // Convert ApiProduct to Product for ProductCard
  const productCards = React.useMemo(() => {
    return products.map((apiProduct: ApiProduct) => {
      const product: Product = {
        id: apiProduct.id,
        name: apiProduct.name,
        description: apiProduct.description,
        price: apiProduct.price,
        compareAtPrice: apiProduct.compareAtPrice,
        discountPercentage: apiProduct.discountPercentage,
        stock: apiProduct.stock,
        category: apiProduct.categories && apiProduct.categories.length > 0 ? {
          id: apiProduct.categories[0].id,
          name: apiProduct.categories[0].name,
          slug: apiProduct.categories[0].slug,
          description: apiProduct.categories[0].description,
          imageUrl: apiProduct.categories[0].imageUrl,
          isActive: true,
          createdAt: '',
          updatedAt: ''
        } : {
          id: 0,
          name: 'Uncategorized',
          slug: 'uncategorized',
          description: null,
          imageUrl: '',
          isActive: true,
          createdAt: '',
          updatedAt: ''
        },
        tags: apiProduct.tagDetails?.map(tag => tag.name) || [],
        tagDetails: apiProduct.tagDetails?.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.name.toLowerCase().replace(/\s+/g, '-'),
          isActive: true,
          createdAt: tag.createdAt,
          updatedAt: tag.createdAt
        })) || [],
        rating: apiProduct.rating,
        isActive: apiProduct.isActive,
        isNew: apiProduct.isNew,
        isSale: apiProduct.isSale,
        isFeatured: apiProduct.isFeatured,
        isTrending: apiProduct.isTrending,
        isInStock: apiProduct.isInStock,
        imageUrl: apiProduct.imageUrl,
        createdAt: apiProduct.createdAt,
        updatedAt: apiProduct.updatedAt
      };
      return <ProductCard key={product.id} product={product} />;
    });
  }, [products]);

  // Debug pagination state
  console.log('🔢 Pagination Debug:', {
    currentPage,
    totalPages,
    totalCount,
    productsToShow: products.length,
    itemsPerPage,
    hasNext,
    hasPrevious,
    isLoading,
    error: error?.message
  });

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="aspect-[3/4] bg-gray-200 animate-pulse"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">Error loading products</h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // No products state
  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">No products found</h3>
        <p className="text-gray-600">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productCards}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} products
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - return true if props are the same (no re-render), false if different (re-render)
  const propsAreSame = (
    prevProps.category === nextProps.category &&
    prevProps.filter === nextProps.filter &&
    prevProps.searchQuery === nextProps.searchQuery &&
    JSON.stringify(prevProps.activeCategoryIds) === JSON.stringify(nextProps.activeCategoryIds) &&
    JSON.stringify(prevProps.activePriceRange) === JSON.stringify(nextProps.activePriceRange) &&
    prevProps.activeInStock === nextProps.activeInStock &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.initialLimit === nextProps.initialLimit
  );
  console.log('🔄 ProductGrid memo comparison:', { propsAreSame, prevProps: { category: prevProps.category, currentPage: prevProps.currentPage }, nextProps: { category: nextProps.category, currentPage: nextProps.currentPage } });
  return propsAreSame;
});

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialLimit);
  const [allProducts, setAllProducts] = React.useState<ApiProduct[]>([]);
  const [fetchedPages, setFetchedPages] = React.useState<Set<number>>(new Set());
  const [hasMorePages, setHasMorePages] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // DEBUG: Log on mount and prop changes
  React.useEffect(() => {
    console.log('ProductGrid MOUNT/UPDATE', {
      currentPage,
      itemsPerPage,
      activeCategoryIds,
      activePriceRange,
      activeInStock,
      filter,
      searchQuery
    });
  }, [currentPage, itemsPerPage, activeCategoryIds, activePriceRange, activeInStock, filter, searchQuery]);

  // Build the API endpoint with query parameters
  const buildEndpoint = (page: number) => {
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
  };

  // Fetch current page
  const { data: currentPageData, isLoading, error } = useQuery<ApiProduct[]>({
    queryKey: ['products', currentPage, itemsPerPage, category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock],
    queryFn: async () => {
      const endpoint = buildEndpoint(currentPage);
      console.log('ProductGrid API CALL', endpoint);
      const response = await apiRequest(endpoint);
      console.log('ProductGrid API RESPONSE', response);
      if (Array.isArray(response)) return response;
      if (response && typeof response === 'object' && 'data' in response) return response.data;
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Fetch tags for conversion
  const { data: tagsResponse } = useQuery<ApiTag[]>({
    queryKey: ["/api/tags/"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper function to convert tag objects to tag names
  const convertTagsToNames = (tags: ApiTag[]): string[] => {
    return tags.map(tag => tag.name).filter(name => name !== '');
  };

  // Update all products when current page data changes
  React.useEffect(() => {
    setAllProducts(currentPageData || []);
  }, [currentPageData]);

  // Debug logging for pagination state
  React.useEffect(() => {
    console.log('🔍 ProductGrid Pagination State:', {
      currentPage,
      itemsPerPage,
      allProductsLength: allProducts.length,
      fetchedPages: Array.from(fetchedPages),
      hasMorePages,
      currentPageProducts: allProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).filter(Boolean).length,
      filters: {
        category,
        filter,
        searchQuery,
        activeCategoryIds,
        activePriceRange,
        activeInStock
      }
    });
  }, [currentPage, itemsPerPage, allProducts.length, fetchedPages, hasMorePages, category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock]);

  // Reset pagination when filters change
  React.useEffect(() => {
    console.log('ProductGrid RESET EFFECT', {
      currentPage,
      itemsPerPage,
      activeCategoryIds,
      activePriceRange,
      activeInStock,
      filter,
      searchQuery
    });
    
    // Clear all cached data when filters change
    setAllProducts([]);
    setFetchedPages(new Set());
    setHasMorePages(true);
    setCurrentPage(1);
    onPageChange?.(1);
    
    // Invalidate the query to force a fresh fetch
    queryClient.invalidateQueries({ 
      queryKey: ['products', currentPage, itemsPerPage, category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock] 
    });
  }, [category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock, onPageChange, queryClient]);

  // Function to fetch a specific page
  const fetchPage = async (page: number) => {
    if (fetchedPages.has(page)) return;
    
    setIsLoadingMore(true);
    try {
      const response = await apiRequest(buildEndpoint(page));
      const pageData = response || [];
      
      setAllProducts(prev => {
        const newProducts = [...prev];
        const startIndex = (page - 1) * itemsPerPage;
        
        // Replace products for this page
        pageData.forEach((product: ApiProduct, index: number) => {
          newProducts[startIndex + index] = product;
        });
        
        return newProducts;
      });
      
      setFetchedPages(prev => new Set(Array.from(prev).concat([page])));
      
      // Check if we have more pages
      if (pageData.length < itemsPerPage) {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Error fetching page:', page, error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Function to fetch next page
  const fetchNextPage = async () => {
    const nextPage = currentPage + 1;
    if (!fetchedPages.has(nextPage) && hasMorePages) {
      await fetchPage(nextPage);
    }
  };

  // Calculate total pages based on fetched data
  const totalPages = Math.max(
    Math.ceil(allProducts.length / itemsPerPage),
    Math.max(...Array.from(fetchedPages), 0)
  );

  // Get products for current page
  const currentPageProducts = allProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ).filter(Boolean);

  // Apply client-side filtering based on filter parameter
  const filteredProducts = React.useMemo(() => {
    if (!filter) return currentPageProducts;
    
    switch (filter) {
      case "new":
        return currentPageProducts.filter(product => product.isNew);
      case "sale":
        return currentPageProducts.filter(product => product.isSale);
      case "trending":
        return currentPageProducts.filter(product => product.isTrending);
      default:
        return currentPageProducts;
    }
  }, [currentPageProducts, filter]);

  // Update URL when page changes
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
    
    // Fetch the page if not already fetched
    if (!fetchedPages.has(page)) {
      await fetchPage(page);
    }
    
    // Pre-fetch next page if available
    if (hasMorePages && !fetchedPages.has(page + 1)) {
      fetchNextPage();
    }
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setAllProducts([]);
    setFetchedPages(new Set());
    setHasMorePages(true);
    setCurrentPage(1);
    onLimitChange?.(limit);
    onPageChange?.(1);
  };

  // Pre-fetch next page when current page changes
  React.useEffect(() => {
    if (hasMorePages && !fetchedPages.has(currentPage + 1)) {
      fetchNextPage();
    }
  }, [currentPage, hasMorePages, fetchedPages]);

  if (isLoading && currentPage === 1) {
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
      </div>
    );
  }

  if (error && currentPage === 1) {
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

  if (filteredProducts.length === 0 && !isLoading) {
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
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, allProducts.length);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {allProducts.length} products
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
            {Array.from({ length: totalPages }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8 p-0"
                  disabled={isLoadingMore && !fetchedPages.has(pageNum)}
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
            disabled={currentPage >= totalPages || !hasMorePages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage >= totalPages || !hasMorePages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
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

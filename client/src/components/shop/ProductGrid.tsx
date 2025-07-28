import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  createdAt: string;
  updatedAt: string;
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
  currentPage?: number; // <-- add this
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
  currentPage: controlledPage, // <-- destructure
  initialLimit = 12,
  onPageChange,
  onLimitChange
}: ProductGridProps) {
  const queryClient = useQueryClient();
  const [uncontrolledPage, setUncontrolledPage] = React.useState(initialPage);
  const currentPage = controlledPage !== undefined ? controlledPage : uncontrolledPage;
  const [itemsPerPage, setItemsPerPage] = React.useState(initialLimit);
  const [pages, setPages] = React.useState<{ [page: number]: ApiProduct[] }>({});
  const [lastPage, setLastPage] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

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

  // Fetch a specific page and store it
  const fetchPage = async (page: number) => {
    console.log('📥 fetchPage called for page:', page, 'pages state:', Object.keys(pages));
    if (pages[page]) {
      console.log('📥 Page', page, 'already fetched, skipping');
      return; // Already fetched
    }
    console.log('📥 Fetching page', page);
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = buildEndpoint(page);
      const response = await apiRequest(endpoint);
      let data: ApiProduct[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      console.log('📥 Page', page, 'fetched', data.length, 'products');
      setPages(prev => ({ ...prev, [page]: data }));
      // If this page returns less than itemsPerPage, it's the last page (including page 1)
      if (data.length < itemsPerPage) {
        setLastPage(page);
      }
    } catch (err) {
      console.log('📥 Error fetching page', page, ':', err);
      // If we get an error fetching a page, it likely means the page doesn't exist
      // Set this as the last page to stop further prefetching
      setLastPage(page - 1);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

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

  // On mount and when currentPage or filters change, fetch current and next page
  React.useEffect(() => {
    fetchPage(currentPage);
    
    // Only prefetch next page if we haven't determined the last page yet
    // This prevents trying to fetch non-existent pages
    if (!lastPage) {
      fetchPage(currentPage + 1);
    }
  }, [currentPage, itemsPerPage, category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock]);

  // When filters change, reset all pagination state
  React.useEffect(() => {
    setPages({});
    setLastPage(null);
    if (onPageChange) {
      onPageChange(1);
    } else {
      setUncontrolledPage(1);
    }
  }, [category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock]);

  // Products to show for current page
  const productsToShow = pages[currentPage] || [];
  
  console.log('📦 Products to show for page', currentPage, ':', {
    productsCount: productsToShow.length,
    pagesState: Object.keys(pages),
    currentPageData: pages[currentPage] ? pages[currentPage].length : 'not found'
  });
  
  // Debug component re-renders
  console.log('🔄 ProductGrid re-render - currentPage:', currentPage, 'controlledPage:', controlledPage);

  // Calculate total pages based on loaded pages and lastPage
  const loadedPages = Object.keys(pages).map(Number).sort((a, b) => a - b);
  const totalPages = lastPage ? lastPage : loadedPages.length > 0 ? Math.max(...loadedPages) : 1;

  // Debug pagination state
  console.log('🔢 Pagination Debug:', {
    currentPage,
    totalPages,
    lastPage,
    loadedPages,
    productsToShow: productsToShow.length,
    itemsPerPage,
    pages: Object.keys(pages),
    hasMoreData: productsToShow.length === itemsPerPage
  });

  // Pagination controls
  const PaginationControls = () => {
    // Always show pagination controls, even if only one page
    console.log('🎛️ PaginationControls:', {
      totalPages,
      currentPage,
      productsToShowLength: productsToShow.length,
      itemsPerPage,
      lastPage,
      shouldShowPagination: true
    });
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          Showing page {currentPage} of {totalPages}
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
            disabled={lastPage !== null && currentPage >= lastPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={lastPage !== null && currentPage >= lastPage}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

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

  if (productsToShow.length === 0 && !isLoading) {
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
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productsToShow.map(product => {
          const cat = product.category as Partial<Category>;
          const safeCategory: Category = cat ? {
            id: cat.id ?? 0,
            name: cat.name ?? 'Uncategorized',
            slug: cat.slug ?? 'uncategorized',
            description: cat.description ?? null,
            imageUrl: cat.imageUrl ?? '',
            isActive: cat.isActive ?? true,
            createdAt: cat.createdAt ?? '',
            updatedAt: cat.updatedAt ?? ''
          } : {
            id: 0,
            name: 'Uncategorized',
            slug: 'uncategorized',
            description: null,
            imageUrl: '',
            isActive: true,
            createdAt: '',
            updatedAt: ''
          };
          const safeTagDetails: Tag[] = Array.isArray(product.tagDetails)
            ? product.tagDetails.map(tag => ({
                id: tag.id,
                name: tag.name,
                slug: (tag as any).slug ?? (tag.name ? tag.name.toLowerCase().replace(/\s+/g, '-') : ''),
                isActive: (tag as any).isActive ?? true,
                createdAt: tag.createdAt ?? '',
                updatedAt: (tag as any).updatedAt ?? ''
              }))
            : [];
          return (
            <ProductCard key={product.id} product={{
              ...product,
              tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
              tagDetails: safeTagDetails,
              category: safeCategory,
              createdAt: product.createdAt || '',
              updatedAt: product.updatedAt || ''
            }} />
          );
        })}
      </div>
      <PaginationControls />
    </div>
  );
}

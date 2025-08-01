import React from 'react';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Product, Category, Tag } from '@/types';

// Define API response types
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
  thumbnailUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
  currentPage: controlledPage, // <-- destructure
  initialLimit = 12,
  onPageChange,
  onLimitChange
}: ProductGridProps) => {
  const [itemsPerPage, setItemsPerPage] = React.useState(initialLimit);
  const [pages, setPages] = React.useState<Record<number, ApiProduct[]>>({});
  const [lastPage, setLastPage] = React.useState<number | null>(null);
  const [uncontrolledPage, setUncontrolledPage] = React.useState(initialPage);
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
    try {
      console.log('📦 Fetching page:', page);
      const response = await apiRequest(buildEndpoint(page));
      
      if (response && typeof response === 'object' && 'results' in response) {
        // Paginated response with {count, next, previous, results}
        const { results, count, next, previous } = response;
        setPages(prev => ({ ...prev, [page]: results }));
        
        // Calculate total pages based on count and page size
        if (count && itemsPerPage) {
          const totalPages = Math.ceil(count / itemsPerPage);
          setLastPage(totalPages);
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        setPages(prev => ({ ...prev, [page]: response }));
        setLastPage(1); // Single page
      }
    } catch (err) {
      console.error('❌ Error fetching page:', page, err);
      setError(err as Error);
    }
  };

  // Determine current page
  const currentPage = controlledPage !== undefined ? controlledPage : uncontrolledPage;

  const handlePageChange = (newPage: number) => {
    console.log('🔄 Page change requested:', newPage, 'current:', currentPage);
    
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setUncontrolledPage(newPage);
    }
  };

  // On mount and when currentPage or filters change, fetch current and next page
  React.useEffect(() => {
    // When filters change, reset all pagination state first
    const filterKey = `${category}-${filter}-${searchQuery}-${activeCategoryIds.join(',')}-${activePriceRange.join(',')}-${activeInStock}`;
    
    console.log('🔄 Filter change detected:', {
      filterKey,
      category,
      filter,
      searchQuery,
      activeCategoryIds,
      activePriceRange,
      activeInStock
    });
    
    // Reset pagination state when filters change
    setPages({});
    setLastPage(null);
    
    // Reset to page 1 when filters change
    if (onPageChange) {
      console.log('🔄 Resetting to page 1 via onPageChange');
      onPageChange(1);
    } else {
      console.log('🔄 Resetting to page 1 via setUncontrolledPage');
      setUncontrolledPage(1);
    }
    
    // Fetch the first page after reset
    console.log('🔄 Fetching page 1 after filter change');
    fetchPage(1);
    
    // Prefetch the second page
    console.log('🔄 Prefetching page 2 after filter change');
    fetchPage(2);
  }, [category, filter, searchQuery, activeCategoryIds, activePriceRange, activeInStock]);

  // Handle page changes (when user clicks pagination)
  React.useEffect(() => {
    // Only fetch if we're not already on page 1 (which is handled by the filter effect above)
    if (currentPage > 1) {
      fetchPage(currentPage);
      
      // Only prefetch next page if we haven't determined the last page yet
      if (!lastPage) {
        fetchPage(currentPage + 1);
      }
    }
  }, [currentPage, itemsPerPage]);

  // Products to show for current page
  const productsToShow = pages[currentPage] || [];
  
  console.log('📦 Products to show for page', currentPage, ':', {
    productsCount: productsToShow.length,
    pagesState: Object.keys(pages),
    currentPageData: pages[currentPage] ? pages[currentPage].length : 'not found'
  });
  
  // Debug component re-renders
  console.log('🔄 ProductGrid render:', {
    currentPage,
    productsToShow: productsToShow.length,
    filterKey: `${category}-${filter}-${searchQuery}-${activeCategoryIds.join(',')}-${activePriceRange.join(',')}-${activeInStock}`
  });

  // Convert API products to Product type for ProductCard
  const productCards = React.useMemo(() => {
    return productsToShow.map((apiProduct: ApiProduct) => {
      // Convert category
      const safeCategory: Category = apiProduct.category ? {
        id: apiProduct.category.id,
        name: apiProduct.category.name,
        slug: apiProduct.category.slug,
        description: apiProduct.category.description,
        imageUrl: apiProduct.category.imageUrl,
        isActive: true,
        createdAt: apiProduct.createdAt || new Date().toISOString(),
        updatedAt: apiProduct.updatedAt || new Date().toISOString()
      } : {
        id: 0,
        name: 'Uncategorized',
        slug: 'uncategorized',
        description: null,
        imageUrl: '',
        isActive: true,
        createdAt: apiProduct.createdAt || new Date().toISOString(),
        updatedAt: apiProduct.updatedAt || new Date().toISOString()
      };

      // Convert tagDetails to Tag type
      const safeTagDetails: Tag[] = Array.isArray(apiProduct.tagDetails)
        ? apiProduct.tagDetails.map(tag => ({
            id: tag.id,
            name: tag.name,
            slug: tag.name.toLowerCase().replace(/\s+/g, '-'),
            isActive: true,
            createdAt: tag.createdAt,
            updatedAt: new Date().toISOString()
          }))
        : [];

      // Convert tags to string array (tag names)
      const tagNames: string[] = safeTagDetails.map(tag => tag.name);

      // Create Product object for ProductCard
      const product: Product = {
        id: apiProduct.id,
        name: apiProduct.name,
        description: apiProduct.description,
        price: apiProduct.price,
        compareAtPrice: apiProduct.compareAtPrice,
        discountPercentage: apiProduct.discountPercentage,
        stock: apiProduct.stock,
        category: safeCategory,
        tags: tagNames, // Convert to string array
        tagDetails: safeTagDetails,
        rating: apiProduct.rating,
        isActive: apiProduct.isActive,
        isNew: apiProduct.isNew,
        isSale: apiProduct.isSale,
        isFeatured: apiProduct.isFeatured,
        isTrending: apiProduct.isTrending,
        isInStock: apiProduct.isInStock,
        imageUrl: apiProduct.imageUrl,
        thumbnailUrl: apiProduct.thumbnailUrl,
        createdAt: apiProduct.createdAt || new Date().toISOString(),
        updatedAt: apiProduct.updatedAt || new Date().toISOString()
      };

      return (
        <ProductCard key={apiProduct.id} product={product} />
      );
    });
  }, [productsToShow]);

  // Pagination controls
  const PaginationControls = () => {
    if (lastPage === null || lastPage <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm">
          Page {currentPage} of {lastPage}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(lastPage)}
          disabled={currentPage === lastPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productCards}
      </div>
      <PaginationControls />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if relevant props changed
  return (
    prevProps.category === nextProps.category &&
    prevProps.filter === nextProps.filter &&
    prevProps.searchQuery === nextProps.searchQuery &&
    JSON.stringify(prevProps.activeCategoryIds) === JSON.stringify(nextProps.activeCategoryIds) &&
    JSON.stringify(prevProps.activePriceRange) === JSON.stringify(nextProps.activePriceRange) &&
    prevProps.activeInStock === nextProps.activeInStock &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.initialLimit === nextProps.initialLimit
  );
});

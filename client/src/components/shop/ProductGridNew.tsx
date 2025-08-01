import React from 'react';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useShop } from '@/hooks/use-shop';
import { ProductFilters } from '@/lib/shop-api';
import type { Category, Tag } from '@/types';

interface ProductGridNewProps {
  products: any[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  setPage: (page: number) => void;
  isFiltered: boolean;
  activeFilterCount: number;
  pageSize?: number;
  showPagination?: boolean;
  showResultsCount?: boolean;
}

export const ProductGridNew: React.FC<ProductGridNewProps> = ({
  products,
  currentPage,
  totalPages,
  totalCount,
  hasNext,
  hasPrevious,
  isLoading,
  isError,
  error,
  setPage,
  isFiltered,
  activeFilterCount,
  pageSize = 12,
  showPagination = true,
  showResultsCount = true
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log('🛍️ ProductGridNew: Products updated', {
      productsCount: products.length,
      currentPage,
      totalPages,
      totalCount,
      isFiltered,
      activeFilterCount,
      isLoading
    });
  }, [products, currentPage, totalPages, totalCount, isFiltered, activeFilterCount, isLoading]);

  // Convert API products to display format - MOVED TO TOP
  const displayProducts = React.useMemo(() => {
    console.log('🛍️ ProductGridNew: Converting products to display format', {
      productsCount: products.length,
      products: products.slice(0, 2) // Log first 2 products for debugging
    });
    
    return products.map(product => {
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

      return {
        ...product,
        tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
        tagDetails: safeTagDetails,
        category: safeCategory,
        createdAt: product.createdAt || '',
        updatedAt: product.updatedAt || ''
      };
    });
  }, [products]);

  // Loading skeleton
  if (isLoading && currentPage === 1) {
    return (
      <div className="space-y-6">
        {showResultsCount && (
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: pageSize }).map((_, index) => (
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

  // Error state
  if (isError && currentPage === 1) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">Unable to load products</h3>
        <p className="text-gray-500 mb-4">
          {error?.message || 'Something went wrong. Please try again.'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // No products found
  if (products.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">No products found</h3>
        <p className="text-gray-500">
          {isFiltered 
            ? "Try adjusting your filters or search terms."
            : "No products are available at the moment. Please check back later."
          }
        </p>
      </div>
    );
  }

  // Pagination component
  const Pagination = () => {
    // Always show pagination if there are multiple pages, regardless of filters
    if (!showPagination || totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} products
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={!hasPrevious}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(page as number)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={!hasNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={!hasNext}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Results count */}
      {showResultsCount && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {totalCount > 0 ? (
              <>
                {totalCount} product{totalCount !== 1 ? 's' : ''} found
                {isFiltered && (
                  <span className="ml-2">
                    ({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied)
                  </span>
                )}
              </>
            ) : (
              'No products found'
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
      )}

      {/* Products grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {displayProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Loading more indicator */}
      {isLoading && currentPage > 1 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading more products...</span>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination />
    </div>
  );
}; 
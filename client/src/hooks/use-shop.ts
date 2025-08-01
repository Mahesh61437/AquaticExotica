import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShopAPI, ProductFilters, ProductsResponse, createProductFilters, areFiltersEqual } from '@/lib/shop-api';

interface UseShopOptions {
  initialFilters?: Partial<ProductFilters>;
  pageSize?: number;
  enableAutoFetch?: boolean;
}

interface UseShopReturn {
  // Data
  products: any[];
  categories: any[];
  tags: any[];
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  pageSize: number;
  
  // Filters
  filters: ProductFilters;
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Actions
  setPage: (page: number) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearFilters: () => void;
  refresh: () => void;
  
  // Computed
  isFiltered: boolean;
  activeFilterCount: number;
}

export function useShop(options: UseShopOptions = {}): UseShopReturn {
  const {
    initialFilters = {},
    pageSize = 12,
    enableAutoFetch = true
  } = options;

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFiltersState] = useState<ProductFilters>(() => 
    createProductFilters(initialFilters)
  );

  // Memoized filter key for React Query - this ensures API calls when filters change
  const filterKey = useMemo(() => {
    return JSON.stringify({ 
      filters, 
      page: currentPage, 
      pageSize 
    });
  }, [filters, currentPage, pageSize]);

  // Fetch products - this will be called whenever filterKey changes
  const {
    data: productsResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['shop-products', filterKey],
    queryFn: () => ShopAPI.getProducts(filters, currentPage, pageSize),
    enabled: enableAutoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['shop-categories'],
    queryFn: ShopAPI.getCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['shop-tags'],
    queryFn: ShopAPI.getTags,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Extract data from Django REST Framework response
  const products = productsResponse?.results || [];
  const totalCount = productsResponse?.count || 0;
  const hasNext = !!productsResponse?.next;
  const hasPrevious = !!productsResponse?.previous;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Actions
  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const setFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const updatedFilters = createProductFilters({ ...filters, ...newFilters });
    
    console.log('🛍️ useShop: Setting filters', {
      current: filters,
      new: newFilters,
      updated: updatedFilters,
      changed: !areFiltersEqual(filters, updatedFilters)
    });
    
    // Always update filters and reset to first page when filters change
    setFiltersState(updatedFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters]);

  const clearFilters = useCallback(() => {
    const defaultFilters = createProductFilters({});
    console.log('🛍️ useShop: Clearing filters');
    setFiltersState(defaultFilters);
    setCurrentPage(1);
  }, []);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Computed values
  const isFiltered = useMemo(() => {
    return (
      (filters.category_ids && filters.category_ids.length > 0) ||
      filters.price_min !== 0 ||
      filters.price_max !== 10000 ||
      filters.in_stock_only ||
      !!filters.search_query ||
      !!filters.filter_type
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category_ids && filters.category_ids.length > 0) {
      // Count each category individually
      count += filters.category_ids.length;
    }
    if (filters.price_min !== 0 || filters.price_max !== 10000) count++;
    if (filters.in_stock_only) count++;
    if (filters.search_query) count++;
    if (filters.filter_type) count++;
    return count;
  }, [filters]);

  // Debug logging
  useEffect(() => {
    console.log('🛍️ useShop: State updated', {
      currentPage,
      totalPages,
      totalCount,
      hasNext,
      hasPrevious,
      filters,
      isFiltered,
      activeFilterCount,
      productsCount: products.length,
      filterKey
    });
  }, [currentPage, totalPages, totalCount, hasNext, hasPrevious, filters, isFiltered, activeFilterCount, products.length, filterKey]);

  return {
    // Data
    products,
    categories,
    tags,
    
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    hasNext,
    hasPrevious,
    pageSize,
    
    // Filters
    filters,
    
    // Loading states
    isLoading,
    isError,
    error,
    
    // Actions
    setPage,
    setFilters,
    clearFilters,
    refresh,
    
    // Computed
    isFiltered,
    activeFilterCount
  };
} 
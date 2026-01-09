import { apiRequest } from './queryClient';
import { Cart } from '@/types';

// API Response Types for Django REST Framework pagination
export interface PaginationMeta {
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ApiProduct {
  id: number;
  name: string;
  description: string;
  // price: string;
  // compareAtPrice: string;
  // discountPercentage: number;
  // stock: number;
  categories: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string;
  }[];
  tags: number[];
  tagDetails: ApiTag[];
  rating: string;
  isActive: boolean;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  // isInStock: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  variants: ApiVariants[];
}

export interface ApiTag {
  id: number;
  name: string;
  createdAt: string;
}

// Django REST Framework pagination response
export interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiProduct[];
}

// Filter Types
export interface ProductFilters {
  category_ids?: number[];
  price_min?: number;
  price_max?: number;
  in_stock_only?: boolean;
  search_query?: string;
  filter_type?: 'new' | 'sale' | 'trending' | 'featured';
  sort_by?: 'name' | 'price' | 'rating' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface ApiVariants {
  id: number;
  product: number;
  variantType: string;
  description: string;
  stock: number;
  originalPrice: string;
  offerPrice: string;
  discountPercentage: number;
  isInStock: boolean;
}

// Shop API Functions
export class ShopAPI {
  private static buildQueryParams(filters: ProductFilters, page: number = 1, pageSize: number = 12): URLSearchParams {
    const params = new URLSearchParams();
    
    // Pagination
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    // Filters - using correct API parameter names
    if (filters.category_ids && filters.category_ids.length > 0) {
      const categoryParam = filters.category_ids.join(',');
      params.append('category_id', categoryParam);
      console.log('🏷️ ShopAPI: Multiple categories selected:', {
        categoryIds: filters.category_ids,
        categoryParam: categoryParam
      });
    }
    
    if (filters.price_min !== undefined && filters.price_min > 0) {
      params.append('min_price', filters.price_min.toString());
    }
    
    if (filters.price_max !== undefined && filters.price_max < 10000) {
      params.append('max_price', filters.price_max.toString());
    }
    
    if (filters.in_stock_only) {
      params.append('in_stock', 'true');
    }
    
    if (filters.search_query) {
      params.append('search', filters.search_query);
    }
    
    if (filters.filter_type) {
      params.append('filter', filters.filter_type);
    }
    
    if (filters.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    
    if (filters.sort_order) {
      params.append('sort_order', filters.sort_order);
    }
    
    console.log('🛍️ ShopAPI: Built query params:', {
      filters,
      page,
      pageSize,
      params: params.toString()
    });
    
    return params;
  }

  static async getProducts(
    filters: ProductFilters = {},
    page: number = 1,
    pageSize: number = 12
  ): Promise<ProductsResponse> {
    try {
      const params = this.buildQueryParams(filters, page, pageSize);
      const endpoint = `/api/products/?${params.toString()}`;
      
      console.log('🛍️ ShopAPI: Fetching products with endpoint:', endpoint);
      
      const response = await apiRequest(endpoint);
      
      console.log('🛍️ ShopAPI: Raw response:', response);
      
      // Handle Django REST Framework pagination format
      if (response && typeof response === 'object' && 'count' in response && 'results' in response) {
        // Expected Django REST Framework format
        console.log('🛍️ ShopAPI: Using Django REST Framework format');
        return response as ProductsResponse;
      } else if (Array.isArray(response)) {
        // Fallback: array response without pagination metadata
        console.warn('🛍️ ShopAPI: API returned array format, using fallback pagination');
        const totalCount = response.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        
        return {
          count: totalCount,
          next: page < totalPages ? `?page=${page + 1}` : null,
          previous: page > 1 ? `?page=${page - 1}` : null,
          results: response
        };
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('🛍️ ShopAPI: Error fetching products:', error);
      throw error;
    }
  }

  static async getCategories() {
    try {
      const response = await apiRequest('/api/categories/');
      
      // Handle Django REST Framework pagination format
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      } else if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    } catch (error) {
      console.error('🛍️ ShopAPI: Error fetching categories:', error);
      return [];
    }
  }

  static async getTags() {
    try {
      const response = await apiRequest('/api/tags/');
      
      // Handle Django REST Framework pagination format
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      } else if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    } catch (error) {
      console.error('🛍️ ShopAPI: Error fetching tags:', error);
      return [];
    }
  }
}

// Save cart to backend
export async function saveCart(cart: Cart) {
  try {
    const payload = {
      items: cart.items.map(item => ({
        product: item.id,
        variant: item.variantId ?? null,
        quantity: item.quantity
      }))
    };

    console.log('🔁 saveCart payload', payload);

    // Use PUT to update (viewset expected at /api/cart/)
    const res = await apiRequest('/api/cart/', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    return res;
  } catch (error) {
    console.error('saveCart error', error);
    throw error;
  }
}

// Utility functions
export const createProductFilters = (options: Partial<ProductFilters>): ProductFilters => {
  return {
    category_ids: options.category_ids || [],
    price_min: options.price_min || 0,
    price_max: options.price_max || 10000,
    in_stock_only: options.in_stock_only || false,
    search_query: options.search_query || '',
    filter_type: options.filter_type,
    sort_by: options.sort_by || 'name',
    sort_order: options.sort_order || 'asc'
  };
};

export const areFiltersEqual = (filters1: ProductFilters, filters2: ProductFilters): boolean => {
  return JSON.stringify(filters1) === JSON.stringify(filters2);
}; 
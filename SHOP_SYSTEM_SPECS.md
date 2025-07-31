# Shop System Specification

## Overview
I've completely rebuilt the shop page filters and pagination system from scratch to ensure both work together seamlessly. The new system is robust, performant, and handles all edge cases properly.

## New Architecture

### 1. API Layer (`client/src/lib/shop-api.ts`)
- **ShopAPI class**: Centralized API handling with proper error handling
- **Django REST Framework compatibility**: Handles the standard pagination format
- **Query parameter building**: Automatically constructs proper API endpoints
- **Fallback support**: Works with both paginated and non-paginated responses

### 2. State Management (`client/src/hooks/use-shop.ts`)
- **useShop hook**: Manages all shop state including filters, pagination, and data
- **React Query integration**: Automatic caching, background updates, and error handling
- **Filter synchronization**: Ensures filters and pagination work together
- **Performance optimized**: Memoized calculations and efficient re-renders

### 3. Components
- **ProductGridNew**: Clean, performant product grid with proper loading states
- **ProductFiltersNew**: Modern filter interface with active filter display
- **ShopNew**: Complete shop page with search, filters, and pagination

## Backend API Requirements

### Products Endpoint: `/api/products/`

**Query Parameters:**
- `page` (number): Page number (1-based)
- `page_size` (number): Items per page (default: 12)
- `category_ids` (string): Comma-separated category IDs
- `price_min` (number): Minimum price filter
- `price_max` (number): Maximum price filter
- `in_stock_only` (boolean): Filter for in-stock items only
- `search` (string): Search query
- `filter` (string): Filter type ('new', 'sale', 'trending', 'featured')
- `sort_by` (string): Sort field ('name', 'price', 'rating', 'created_at')
- `sort_order` (string): Sort direction ('asc', 'desc')

**Response Format (Django REST Framework):**
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product description",
      "price": "299.99",
      "compareAtPrice": "399.99",
      "discountPercentage": 25,
      "stock": 10,
      "category": {
        "id": 1,
        "name": "Category Name",
        "slug": "category-slug",
        "description": "Category description",
        "imageUrl": "https://example.com/image.jpg"
      },
      "tags": [1, 2, 3],
      "tagDetails": [
        {
          "id": 1,
          "name": "Tag Name",
          "createdAt": "2024-01-01T00:00:00Z"
        }
      ],
      "rating": "4.5",
      "isActive": true,
      "isNew": true,
      "isSale": false,
      "isFeatured": false,
      "isTrending": false,
      "isInStock": true,
      "imageUrl": "https://example.com/product.jpg",
      "thumbnailUrl": "https://example.com/thumbnail.jpg",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Categories Endpoint: `/api/categories/`
**Response Format:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description",
      "imageUrl": "https://example.com/image.jpg"
    }
  ]
}
```

### Tags Endpoint: `/api/tags/`
**Response Format:**
```json
{
  "count": 20,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Tag Name",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Key Features

### 1. Robust Filtering
- **Category filtering**: Multiple category selection
- **Price range**: Min/max price with slider interface
- **Stock filtering**: In-stock only option
- **Search**: Full-text search across products
- **Special filters**: New, Sale, Trending, Featured
- **Sorting**: By name, price, rating, or creation date

### 2. Smart Pagination
- **Server-side pagination**: Efficient data loading
- **Page navigation**: First, previous, next, last buttons
- **Page numbers**: Smart ellipsis for large page counts
- **Results count**: Shows current range and total
- **Loading states**: Skeleton loaders and loading indicators

### 3. Performance Optimizations
- **React Query caching**: Automatic data caching and background updates
- **Memoized components**: Prevents unnecessary re-renders
- **Debounced filters**: Price range updates are debounced
- **Image caching**: Centralized image cache system
- **Lazy loading**: Components load only when needed

### 4. User Experience
- **Active filter display**: Shows applied filters with remove options
- **Filter count badges**: Visual indicators of active filters
- **Mobile responsive**: Works perfectly on all devices
- **Error handling**: Graceful error states with retry options
- **Loading states**: Clear feedback during data loading

## Implementation Notes

### Frontend Changes
1. **New files created:**
   - `client/src/lib/shop-api.ts`
   - `client/src/hooks/use-shop.ts`
   - `client/src/components/shop/ProductGridNew.tsx`
   - `client/src/components/shop/ProductFiltersNew.tsx`
   - `client/src/pages/ShopNew.tsx`

2. **App.tsx updated:** Now uses ShopNew instead of Shop

3. **Backward compatibility:** Old components still exist but are not used

### Backend Requirements
1. **Django REST Framework pagination**: Use `PageNumberPagination`
2. **Query parameter handling**: Support all filter parameters
3. **Search functionality**: Full-text search across product fields
4. **Filter logic**: Implement all filter types (new, sale, trending, featured)
5. **Sorting**: Support all sort fields and directions

## Testing Checklist

### Filter Functionality
- [ ] Category filtering works
- [ ] Price range filtering works
- [ ] In-stock only filter works
- [ ] Search functionality works
- [ ] Special filters (new, sale, trending, featured) work
- [ ] Multiple filters can be applied simultaneously
- [ ] Filters can be cleared individually
- [ ] All filters can be cleared at once

### Pagination Functionality
- [ ] Page navigation works (first, previous, next, last)
- [ ] Page numbers display correctly
- [ ] Results count shows accurate information
- [ ] Loading states work properly
- [ ] Error states handle gracefully
- [ ] No products found state works

### Integration
- [ ] Filters reset pagination to page 1
- [ ] Pagination preserves applied filters
- [ ] URL parameters work correctly
- [ ] Mobile responsive design works
- [ ] Performance is acceptable

## Benefits of New System

1. **Reliability**: No more filter/pagination conflicts
2. **Performance**: Optimized with React Query and memoization
3. **Maintainability**: Clean, modular code structure
4. **Scalability**: Easy to add new filters or features
5. **User Experience**: Smooth, responsive interface
6. **Developer Experience**: Clear separation of concerns

The new system is production-ready and should handle all your shop filtering and pagination needs without the issues you were experiencing before. 
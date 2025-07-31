import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Filter, RefreshCw } from 'lucide-react';
import { useShop } from '@/hooks/use-shop';
import { ProductFilters } from '@/lib/shop-api';
import { formatPrice } from '@/lib/utils';

interface ProductFiltersNewProps {
  className?: string;
  showTitle?: boolean;
  showClearButton?: boolean;
}

export const ProductFiltersNew: React.FC<ProductFiltersNewProps> = ({
  className = '',
  showTitle = true,
  showClearButton = true
}) => {
  const {
    categories,
    filters,
    setFilters,
    clearFilters,
    isFiltered,
    activeFilterCount
  } = useShop();

  // Price range state
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    filters.price_min || 0,
    filters.price_max || 10000
  ]);

  // Debounced price range update
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (priceRange[0] !== filters.price_min || priceRange[1] !== filters.price_max) {
        setFilters({
          price_min: priceRange[0],
          price_max: priceRange[1]
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [priceRange, filters.price_min, filters.price_max, setFilters]);

  // Category filter handlers
  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const currentCategories = filters.category_ids || [];
    
    if (checked) {
      setFilters({
        category_ids: [...currentCategories, categoryId]
      });
    } else {
      setFilters({
        category_ids: currentCategories.filter(id => id !== categoryId)
      });
    }
  };

  // In-stock filter handler
  const handleInStockChange = (checked: boolean) => {
    setFilters({
      in_stock_only: checked
    });
  };

  // Clear specific filter
  const clearFilter = (filterType: keyof ProductFilters) => {
    switch (filterType) {
      case 'category_ids':
        setFilters({ category_ids: [] });
        break;
      case 'price_min':
      case 'price_max':
        setPriceRange([0, 10000]);
        break;
      case 'in_stock_only':
        setFilters({ in_stock_only: false });
        break;
      case 'search_query':
        setFilters({ search_query: '' });
        break;
      case 'filter_type':
        setFilters({ filter_type: undefined });
        break;
    }
  };

  // Get active filter display
  const getActiveFilters = () => {
    const active: Array<{ key: keyof ProductFilters; label: string; value: string }> = [];

    if (filters.category_ids && filters.category_ids.length > 0) {
      const categoryNames = filters.category_ids
        .map(id => categories.find(cat => cat.id === id)?.name)
        .filter(Boolean);
      if (categoryNames.length > 0) {
        active.push({
          key: 'category_ids',
          label: 'Categories',
          value: categoryNames.join(', ')
        });
      }
    }

    if (filters.price_min !== 0 || filters.price_max !== 10000) {
      active.push({
        key: 'price_min',
        label: 'Price',
        value: `${formatPrice(filters.price_min || 0)} - ${formatPrice(filters.price_max || 10000)}`
      });
    }

    if (filters.in_stock_only) {
      active.push({
        key: 'in_stock_only',
        label: 'In Stock Only',
        value: 'Yes'
      });
    }

    if (filters.search_query) {
      active.push({
        key: 'search_query',
        label: 'Search',
        value: filters.search_query
      });
    }

    if (filters.filter_type) {
      active.push({
        key: 'filter_type',
        label: 'Filter',
        value: filters.filter_type.charAt(0).toUpperCase() + filters.filter_type.slice(1)
      });
    }

    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </h3>
          
          {showClearButton && isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span className="text-xs">{filter.label}: {filter.value}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => clearFilter(filter.key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="font-medium">Categories</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={filters.category_ids?.includes(category.id) || false}
                onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-4">
        <h4 className="font-medium">Price Range</h4>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={10000}
            min={0}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* In Stock Only */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock-only"
            checked={filters.in_stock_only || false}
            onCheckedChange={handleInStockChange}
          />
          <Label htmlFor="in-stock-only" className="text-sm font-normal cursor-pointer">
            In Stock Only
          </Label>
        </div>
      </div>

      {/* Filter Summary */}
      {isFiltered && (
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
          </div>
        </div>
      )}
    </div>
  );
}; 
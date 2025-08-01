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

// Custom Price Range Component
const PriceRangeSlider: React.FC<{
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
}> = ({ value, onValueChange, min = 0, max = 10000, step = 500 }) => {
  console.log('🎚️ PriceRangeSlider: value:', value, 'min:', min, 'max:', max);
  
  return (
    <div className="space-y-4">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          Debug: Min={value[0]}, Max={value[1]}, Array length={value.length}
        </div>
      )}
      
      <Slider
        value={value}
        onValueChange={onValueChange}
        max={max}
        min={min}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatPrice(value[0])}</span>
        <span>{formatPrice(value[1])}</span>
      </div>
    </div>
  );
};

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

  // Price range state - initialize from filters
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    filters.price_min || 0,
    filters.price_max || 10000
  ]);

  // Update price range when filters change
  React.useEffect(() => {
    const newPriceRange: [number, number] = [
      filters.price_min || 0,
      filters.price_max || 10000
    ];
    console.log('🎚️ ProductFiltersNew: Updating price range from filters:', newPriceRange);
    setPriceRange(newPriceRange);
  }, [filters.price_min, filters.price_max]);

  // Debounced price range update
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (priceRange[0] !== filters.price_min || priceRange[1] !== filters.price_max) {
        console.log('🎚️ ProductFiltersNew: Applying price range to filters:', priceRange);
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
  const clearFilter = (filterType: keyof ProductFilters, value?: any) => {
    switch (filterType) {
      case 'category_ids':
        if (value !== undefined) {
          // Remove specific category
          const updatedCategories = filters.category_ids?.filter(id => id !== value) || [];
          setFilters({ category_ids: updatedCategories });
        } else {
          // Remove all categories
          setFilters({ category_ids: [] });
        }
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

  // Get active filter display - now with separate bubbles for each category
  const getActiveFilters = () => {
    const active: Array<{ key: keyof ProductFilters; label: string; value: string; filterValue?: any }> = [];

    // Separate bubble for each category
    if (filters.category_ids && filters.category_ids.length > 0) {
      filters.category_ids.forEach(categoryId => {
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
          active.push({
            key: 'category_ids',
            label: 'Category',
            value: category.name,
            filterValue: categoryId
          });
        }
      });
    }

    // Price range as single bubble
    if (filters.price_min !== 0 || filters.price_max !== 10000) {
      active.push({
        key: 'price_min',
        label: 'Price',
        value: `${formatPrice(filters.price_min || 0)} - ${formatPrice(filters.price_max || 10000)}`
      });
    }

    // In stock filter
    if (filters.in_stock_only) {
      active.push({
        key: 'in_stock_only',
        label: 'In Stock Only',
        value: 'Yes'
      });
    }

    // Search query
    if (filters.search_query) {
      active.push({
        key: 'search_query',
        label: 'Search',
        value: filters.search_query
      });
    }

    // Filter type
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
            {activeFilters.map((filter, index) => (
              <Badge
                key={`${filter.key}-${filter.filterValue || index}`}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span className="text-xs">{filter.label}: {filter.value}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => clearFilter(filter.key, filter.filterValue)}
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
        <PriceRangeSlider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={10000}
          step={500}
        />
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
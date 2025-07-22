import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Category } from "@/types";
import { useState, useEffect } from "react";
import React from "react";

interface ProductFiltersProps {
  onCategoryChange: (categoryIds: number[]) => void;
  activeCategoryIds: number[];
  onPriceChange?: (priceRange: [number, number]) => void;
  activePriceRange?: [number, number];
  onInStockChange?: (inStock: boolean) => void;
  activeInStock?: boolean;
}

export function ProductFilters({
  onCategoryChange,
  activeCategoryIds,
  onPriceChange,
  activePriceRange = [0, 10000],
  onInStockChange,
  activeInStock = false
}: ProductFiltersProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [priceMin, setPriceMin] = useState<string>(activePriceRange[0].toString());
  const [priceMax, setPriceMax] = useState<string>(activePriceRange[1].toString());
  
  // Fetch categories from API
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories/"],
  });

  // Extract categories array from response
  const categories: Category[] = React.useMemo(() => {
    if (!categoriesResponse) return [];
    
    // Check if response is paginated
    if (categoriesResponse && typeof categoriesResponse === 'object' && 'data' in categoriesResponse) {
      return (categoriesResponse as any).data || [];
    }
    
    // Check if response is a direct array
    if (Array.isArray(categoriesResponse)) {
      return categoriesResponse;
    }
    
    return [];
  }, [categoriesResponse]);

  const handleCategoryToggle = (categoryId: number, checked: boolean) => {
    if (checked) {
      // Add the category ID
      onCategoryChange([...activeCategoryIds, categoryId]);
      
      // Update the URL to reflect filtering rather than a single category page
      if (window.location.pathname.startsWith("/shop/") && window.location.pathname !== "/shop") {
        setLocation("/shop");
      }
    } else {
      onCategoryChange(activeCategoryIds.filter(id => id !== categoryId));
    }
  };

  const handlePriceChange = () => {
    const min = parseInt(priceMin) || 0;
    const max = parseInt(priceMax) || 10000;
    
    if (onPriceChange) {
      onPriceChange([min, max]);
    }
  };

  const handleInStockChange = (checked: boolean) => {
    if (onInStockChange) {
      onInStockChange(checked);
    }
  };

  const handleClearAll = () => {
    console.log('🧹 Clearing all filters');
    onCategoryChange([]);
    setPriceMin("0");
    setPriceMax("10000");
    if (onPriceChange) {
      onPriceChange([0, 10000]);
    }
    if (onInStockChange) {
      onInStockChange(false);
    }
    // Always redirect to /shop to clear any category URL
    setLocation("/shop");
  };

  // Update price inputs when activePriceRange changes
  useEffect(() => {
    setPriceMin(activePriceRange[0].toString());
    setPriceMax(activePriceRange[1].toString());
  }, [activePriceRange]);

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full border-b">
        <AccordionItem value="category" className="border-t">
          <AccordionTrigger className="text-base font-medium">Category</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Loading categories...</span>
                </div>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category.id}`} 
                      checked={activeCategoryIds.includes(category.id)}
                      onCheckedChange={(checked) => 
                        handleCategoryToggle(category.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category.name}
                    </label>
                  </div>
                ))
              ) : (
                <div className="py-2 text-sm text-gray-500">No categories found</div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="single" collapsible className="w-full border-b">
        <AccordionItem value="price" className="border-t">
          <AccordionTrigger className="text-base font-medium">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="price-min" className="text-sm">Min Price (₹)</Label>
                  <Input
                    id="price-min"
                    type="number"
                    placeholder="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    onBlur={handlePriceChange}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-max" className="text-sm">Max Price (₹)</Label>
                  <Input
                    id="price-max"
                    type="number"
                    placeholder="10000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    onBlur={handlePriceChange}
                    min="0"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePriceChange}
                className="w-full"
              >
                Apply Price Filter
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="single" collapsible className="w-full border-b">
        <AccordionItem value="availability" className="border-t">
          <AccordionTrigger className="text-base font-medium">Availability</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="in-stock" 
                  checked={activeInStock}
                  onCheckedChange={(checked) => handleInStockChange(checked as boolean)}
                />
                <label
                  htmlFor="in-stock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  In Stock Only
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleClearAll}
      >
        Clear Filters
      </Button>
    </div>
  );
}

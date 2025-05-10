import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Category } from "@shared/schema";

interface ProductFiltersProps {
  onCategoryChange: (category: string[]) => void;
  activeCategories: string[];
  onSortChange?: (sort: string) => void;
  onPriceChange?: (price: [number, number]) => void;
  activeSort?: string;
  activePrice?: [number, number];
}

export function ProductFilters({
  onCategoryChange,
  activeCategories
}: ProductFiltersProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Fetch categories from API
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleCategoryToggle = (category: string, checked: boolean) => {
    if (checked) {
      onCategoryChange([...activeCategories, category]);
    } else {
      onCategoryChange(activeCategories.filter(c => c !== category));
    }
  };

  const handleClearAll = () => {
    onCategoryChange([]);
    setLocation("/shop");
  };

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
                      checked={activeCategories.includes(category.name)}
                      onCheckedChange={(checked) => 
                        handleCategoryToggle(category.name, checked as boolean)
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

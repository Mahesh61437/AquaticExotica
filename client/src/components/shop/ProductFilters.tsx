import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

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
              {["Women", "Men", "Accessories", "Footwear"].map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category}`} 
                    checked={activeCategories.includes(category)}
                    onCheckedChange={(checked) => 
                      handleCategoryToggle(category, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category}
                  </label>
                </div>
              ))}
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

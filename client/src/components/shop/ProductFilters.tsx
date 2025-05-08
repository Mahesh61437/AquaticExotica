import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductFiltersProps {
  onSortChange: (sort: string) => void;
  onPriceChange: (price: [number, number]) => void;
  onCategoryChange: (category: string[]) => void;
  activeSort: string;
  activePrice: [number, number];
  activeCategories: string[];
}

export function ProductFilters({
  onSortChange, 
  onPriceChange, 
  onCategoryChange,
  activeSort,
  activePrice,
  activeCategories
}: ProductFiltersProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [priceRange, setPriceRange] = useState<[number, number]>(activePrice);

  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };

  const handleApplyPrice = () => {
    onPriceChange(priceRange);
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    if (checked) {
      onCategoryChange([...activeCategories, category]);
    } else {
      onCategoryChange(activeCategories.filter(c => c !== category));
    }
  };

  const handleClearAll = () => {
    onSortChange("default");
    onPriceChange([0, 500]);
    onCategoryChange([]);
    setPriceRange([0, 500]);
    setLocation("/shop");
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="sort">Sort By</Label>
        <Select 
          value={activeSort} 
          onValueChange={onSortChange}
        >
          <SelectTrigger id="sort" className="w-full">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="popular">Popularity</SelectItem>
            <SelectItem value="price-low-high">Price: Low to High</SelectItem>
            <SelectItem value="price-high-low">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Accordion type="single" collapsible className="w-full border-b">
        <AccordionItem value="price" className="border-t">
          <AccordionTrigger className="text-base font-medium">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                defaultValue={[priceRange[0], priceRange[1]]}
                value={[priceRange[0], priceRange[1]]}
                max={500}
                step={10}
                onValueChange={handlePriceChange}
                className="py-4"
              />
              <div className="flex justify-between items-center">
                <div className="flex-1 mr-2">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    min={0}
                    max={priceRange[1]}
                  />
                </div>
                <span className="mx-2">to</span>
                <div className="flex-1 ml-2">
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                    min={priceRange[0]}
                    max={500}
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleApplyPrice}
              >
                Apply
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

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

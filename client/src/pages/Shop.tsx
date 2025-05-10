import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Filter } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ProductFilters } from "@/components/shop/ProductFilters";

export default function Shop() {
  const [, params] = useRoute("/shop/:category?");
  const [location] = useLocation();
  
  // Extract URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("search") || "";
  const filterParam = urlParams.get("filter") || "";

  // State for filters
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Determine page title
  let pageTitle = "All Products";
  let categorySlug = "";
  
  if (params?.category) {
    categorySlug = params.category;
    // Capitalize first letter
    pageTitle = params.category.charAt(0).toUpperCase() + params.category.slice(1);
  } else if (searchQuery) {
    pageTitle = `Search: ${searchQuery}`;
  } else if (filterParam === "new") {
    pageTitle = "New Arrivals";
  } else if (filterParam === "sale") {
    pageTitle = "On Sale";
  }

  // Set active category if coming from category route
  useEffect(() => {
    if (params?.category) {
      // Convert slug to proper category name
      const category = params.category.charAt(0).toUpperCase() + params.category.slice(1);
      setActiveCategories([category]);
    }
  }, [params?.category]);

  return (
    <>
      <Helmet>
        <title>{pageTitle} - ModernShop</title>
        <meta name="description" content={`Browse our collection of ${pageTitle.toLowerCase()} at ModernShop. Find the perfect style for any occasion with free shipping on orders over $50.`} />
        <meta property="og:title" content={`${pageTitle} - ModernShop`} />
        <meta property="og:description" content={`Browse our collection of ${pageTitle.toLowerCase()} at ModernShop. Find the perfect style for any occasion with free shipping on orders over $50.`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold">{pageTitle}</h1>
            {searchQuery && (
              <p className="text-gray-500 mt-2">Showing results for "{searchQuery}"</p>
            )}
          </div>
          
          {/* Mobile Filters Button */}
          <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="mt-4 md:mt-0 md:hidden"
              >
                <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90vw] sm:max-w-md">
              <div className="p-4">
                <h2 className="text-xl font-heading font-bold mb-6">Filters</h2>
                <ProductFilters
                  onCategoryChange={setActiveCategories}
                  activeCategories={activeCategories}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Desktop Filters */}
          <div className="hidden md:block">
            <ProductFilters
              onCategoryChange={setActiveCategories}
              activeCategories={activeCategories}
            />
          </div>
          
          {/* Products */}
          <div className="md:col-span-3">
            <ProductGrid 
              category={params?.category} 
              filter={filterParam} 
              searchQuery={searchQuery}
              activeCategories={activeCategories}
            />
          </div>
        </div>
      </div>
    </>
  );
}

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
  
  // Extract URL parameters using window.location.search
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("search") || "";
  const filterParam = urlParams.get("filter") || "";
  const categoryParam = urlParams.get("category") || "";

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
  } else if (categoryParam) {
    // Handle category from query parameter
    pageTitle = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
  } else if (searchQuery) {
    pageTitle = `Search: ${searchQuery}`;
  } else if (filterParam === "new") {
    pageTitle = "New Arrivals";
  } else if (filterParam === "sale") {
    pageTitle = "On Sale";
  } else if (filterParam === "trending") {
    pageTitle = "Bestsellers";
  }
  
  // Clear filters when leaving the shop page
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts (user leaves the page)
      setActiveCategories([]); // Reset filters
    };
  }, []);

  // Set active category if coming from category route or query parameter, but only on initial render
  // This prevents resetting activeCategories when user manually changes filters
  useEffect(() => {
    if (params?.category && activeCategories.length === 0) {
      // Convert slug to proper category name
      const category = params.category.charAt(0).toUpperCase() + params.category.slice(1);
      setActiveCategories([category]);
    } else if (categoryParam && activeCategories.length === 0) {
      // Handle category from query parameter
      const category = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);
      setActiveCategories([category]);
    }
  }, [params?.category, categoryParam, activeCategories.length]);

  return (
    <>
      <Helmet>
        <title>{pageTitle} - Aquatic Exotica</title>
        <meta name="description" content={`Browse our collection of ${pageTitle.toLowerCase()} at Aquatic Exotica. Find the perfect plants or aquascaping supplies with fast delivery across India.`} />
        <meta property="og:title" content={`${pageTitle} - Aquatic Exotica`} />
        <meta property="og:description" content={`Browse our collection of ${pageTitle.toLowerCase()} at Aquatic Exotica. Find the perfect plants or aquascaping supplies with fast delivery across India.`} />
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

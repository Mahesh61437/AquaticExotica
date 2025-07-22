import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Filter } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ProductFilters } from "@/components/shop/ProductFilters";
import { generateMetaDescription } from "@/lib/utils";

export default function Shop() {
  const [, params] = useRoute("/shop/:category?");
  const [location] = useLocation();
  
  // Extract URL parameters using window.location.search
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("search") || "";
  const filterParam = urlParams.get("filter") || "";
  const categoryParam = urlParams.get("category") || "";
  const pageParam = parseInt(urlParams.get("page") || "1");
  const limitParam = parseInt(urlParams.get("limit") || "12");

  // State for filters
  const [activeCategoryIds, setActiveCategoryIds] = useState<number[]>([]);
  const [activePriceRange, setActivePriceRange] = useState<[number, number]>([0, 10000]);
  const [activeInStock, setActiveInStock] = useState<boolean>(false);
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
      setActiveCategoryIds([]); // Reset filters
      setActivePriceRange([0, 10000]);
      setActiveInStock(false);
    };
  }, []);

  // Handle category URL parameter - this should only set the category for the ProductGrid
  // but not interfere with the filter state
  useEffect(() => {
    console.log('🏪 Shop page - Category params:', {
      urlCategory: params?.category,
      queryCategory: categoryParam,
      activeCategoryIds
    });
  }, [params?.category, categoryParam, activeCategoryIds]);

  return (
    <>
      <Helmet>
        <title>{pageTitle} - Aquatic Exotica</title>
        <meta name="description" content={generateMetaDescription(`Browse our collection of ${pageTitle.toLowerCase()} at Aquatic Exotica. Find the perfect plants or aquascaping supplies with fast delivery across India.`)} />
        <meta name="keywords" content={`aquatic plants, aquascaping, aquarium supplies, ${pageTitle.toLowerCase()}, aquatic exotica, india`} />
        <meta property="og:title" content={`${pageTitle} - Aquatic Exotica`} />
        <meta property="og:description" content={generateMetaDescription(`Browse our collection of ${pageTitle.toLowerCase()} at Aquatic Exotica. Find the perfect plants or aquascaping supplies with fast delivery across India.`)} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${pageTitle} - Aquatic Exotica`} />
        <meta name="twitter:description" content={generateMetaDescription(`Browse our collection of ${pageTitle.toLowerCase()} at Aquatic Exotica. Find the perfect plants or aquascaping supplies with fast delivery across India.`)} />
        <link rel="canonical" href={window.location.href} />
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
                <Filter className="h-4 w-4 mr-2" /> 
                Filters
                {(activeCategoryIds.length > 0 || activePriceRange[0] > 0 || activePriceRange[1] < 10000 || activeInStock) && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {[
                      activeCategoryIds.length,
                      (activePriceRange[0] > 0 || activePriceRange[1] < 10000) ? 1 : 0,
                      activeInStock ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90vw] sm:max-w-md">
              <div className="p-4">
                <h2 className="text-xl font-heading font-bold mb-6">Filters</h2>
                <ProductFilters
                  onCategoryChange={setActiveCategoryIds}
                  activeCategoryIds={activeCategoryIds}
                  onPriceChange={setActivePriceRange}
                  activePriceRange={activePriceRange}
                  onInStockChange={setActiveInStock}
                  activeInStock={activeInStock}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Desktop Filters */}
          <div className="hidden md:block">
            <ProductFilters
              onCategoryChange={setActiveCategoryIds}
              activeCategoryIds={activeCategoryIds}
              onPriceChange={setActivePriceRange}
              activePriceRange={activePriceRange}
              onInStockChange={setActiveInStock}
              activeInStock={activeInStock}
            />
          </div>
          
          {/* Products */}
          <div className="md:col-span-3">
            <ProductGrid 
              category={params?.category} 
              filter={filterParam} 
              searchQuery={searchQuery}
              activeCategoryIds={activeCategoryIds}
              activePriceRange={activePriceRange}
              activeInStock={activeInStock}
            />
          </div>
        </div>
      </div>
    </>
  );
}

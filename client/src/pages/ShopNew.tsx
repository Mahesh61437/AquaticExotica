import React, { useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Filter, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductGridNew } from '@/components/shop/ProductGridNew';
import { ProductFiltersNew } from '@/components/shop/ProductFiltersNew';
import { generateMetaDescription } from '@/lib/utils';
import { useShop } from '@/hooks/use-shop';
import { ProductFilters } from '@/lib/shop-api';
import { Badge } from '@/components/ui/badge';

export default function ShopNew() {
  const [, params] = useRoute("/shop/:category?");
  const [location] = useLocation();
  
  // Extract URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("search") || "";
  const filterParam = urlParams.get("filter") || "";
  const categoryParam = urlParams.get("category") || "";
  const pageParam = parseInt(urlParams.get("page") || "1");

  // Shop state
  const {
    categories,
    filters,
    setFilters,
    clearFilters,
    setPage,
    isFiltered,
    activeFilterCount
  } = useShop();

  // Mobile filters state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(searchQuery);

  // Initialize filters from URL parameters
  useEffect(() => {
    const initialFilters: Partial<ProductFilters> = {};

    // Handle search query
    if (searchQuery) {
      initialFilters.search_query = searchQuery;
    }

    // Handle filter type
    if (filterParam) {
      initialFilters.filter_type = filterParam as any;
    }

    // Handle category from URL
    if (params?.category) {
      const category = categories.find(cat => cat.slug === params.category);
      if (category) {
        initialFilters.category_ids = [category.id];
      }
    } else if (categoryParam) {
      const category = categories.find(cat => cat.slug === categoryParam);
      if (category) {
        initialFilters.category_ids = [category.id];
      }
    }

    // Apply initial filters
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
    }

    // Set initial page
    if (pageParam > 1) {
      setPage(pageParam);
    }
  }, [params?.category, categoryParam, searchQuery, filterParam, categories, setFilters, setPage, pageParam]);

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search_query: searchInput });
  };

  // Determine page title
  const getPageTitle = () => {
    if (params?.category) {
      const category = categories.find(cat => cat.slug === params.category);
      return category ? category.name : params.category;
    }
    
    if (categoryParam) {
      const category = categories.find(cat => cat.slug === categoryParam);
      return category ? category.name : categoryParam;
    }
    
    if (searchQuery) {
      return `Search: ${searchQuery}`;
    }
    
    if (filterParam === "new") return "New Arrivals";
    if (filterParam === "sale") return "On Sale";
    if (filterParam === "trending") return "Trending";
    if (filterParam === "featured") return "Featured";
    
    return "All Products";
  };

  const pageTitle = getPageTitle();

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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-heading font-bold">{pageTitle}</h1>
            {searchQuery && (
              <p className="text-gray-500 mt-2">Showing results for "{searchQuery}"</p>
            )}
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
        </div>

        {/* Active Filters Summary */}
        {isFiltered && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Active Filters:</span>
                <Badge variant="secondary">{activeFilterCount}</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8"
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Desktop Filters */}
          <div className="hidden md:block">
            <ProductFiltersNew />
          </div>
          
          {/* Mobile Filters Button */}
          <div className="md:hidden">
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[90vw] sm:max-w-md">
                <div className="p-4">
                  <ProductFiltersNew showTitle={false} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Products Grid */}
          <div className="md:col-span-3">
            <ProductGridNew
              initialFilters={filters}
              pageSize={12}
              showPagination={true}
              showResultsCount={true}
            />
          </div>
        </div>
      </div>
    </>
  );
} 
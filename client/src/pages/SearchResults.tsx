import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Search, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/shop/ProductCard";
import { Product } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { generateMetaDescription } from "@/lib/utils";

export default function SearchResults() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");

  // Extract search query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q") || "";
    setSearchQuery(query);
    setSearchInput(query);
  }, []);

  // Fetch search results with pagination
  const { data: searchResponse, isLoading, error } = useQuery({
    queryKey: ["/api/products/search/", searchQuery, currentPage],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        return { results: [], count: 0, next: null, previous: null };
      }
      
      const response = await apiRequest(
        `/api/products/search/?q=${encodeURIComponent(searchQuery)}&page=${currentPage}&page_size=12`
      );
      
      // Handle pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return {
          results: response.results || [],
          count: response.count || 0,
          next: response.next,
          previous: response.previous
        };
      }
      
      // Fallback to array format
      return {
        results: response || [],
        count: response?.length || 0,
        next: null,
        previous: null
      };
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  const results = searchResponse?.results || [];
  const totalCount = searchResponse?.count || 0;
  const hasNext = !!searchResponse?.next;
  const hasPrevious = !!searchResponse?.previous;
  const totalPages = Math.ceil(totalCount / 12);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      setCurrentPage(1);
      // Update URL
      const newUrl = `/search?q=${encodeURIComponent(searchInput.trim())}`;
      window.history.pushState({}, "", newUrl);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Update URL
    const newUrl = `/search?q=${encodeURIComponent(searchQuery)}&page=${page}`;
    window.history.pushState({}, "", newUrl);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToShop = () => {
    setLocation("/shop");
  };

  if (!searchQuery.trim()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Search Products - AquaticExotica</title>
          <meta name="description" content="Search for aquatic plants and aquarium supplies" />
        </Helmet>
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-heading font-bold mb-4">Search Products</h1>
            <p className="text-gray-600 mb-8">Enter a search term to find products</p>
            
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search for products..."
                className="flex-1"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Search Results for "{searchQuery}" - AquaticExotica</title>
        <meta 
          name="description" 
          content={generateMetaDescription(`Search results for ${searchQuery}. Found ${totalCount} products.`)}
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={handleBackToShop}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">
                Search Results
              </h1>
              <p className="text-gray-600">
                {totalCount > 0 ? (
                  <>
                    Found <span className="font-semibold">{totalCount}</span> results for{" "}
                    <span className="font-semibold">"{searchQuery}"</span>
                  </>
                ) : (
                  <>No results found for <span className="font-semibold">"{searchQuery}"</span></>
                )}
              </p>
            </div>
            
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search for products..."
                className="w-64"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-[3/4] bg-gray-200 animate-pulse"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <Search className="h-12 w-12 mx-auto mb-2" />
              <p>Error loading search results</p>
            </div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-bold mb-2">No Results Found</h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or browse our categories
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleBackToShop}>
                Browse All Products
              </Button>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                New Search
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {results.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevious}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

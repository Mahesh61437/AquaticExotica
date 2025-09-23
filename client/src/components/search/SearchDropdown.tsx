import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, X, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
// import { useAnalytics } from "@/hooks/use-analytics";

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDropdown({ isOpen, onClose }: SearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // const { trackSearch, trackUserBehavior } = useAnalytics();

  // Fetch search results with debouncing
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/products/search/", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { results: [], count: 0 };
      
      const response = await apiRequest(`/api/products/search/?q=${encodeURIComponent(searchQuery)}&page=1&page_size=5`);
      
      // Handle pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return {
          results: response.results || [],
          count: response.count || 0
        };
      }
      
      // Fallback to array format
      return {
        results: response || [],
        count: response?.length || 0
      };
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsSearching(value.trim().length > 0);
  };

  const handleViewAllResults = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleProductClick = () => {
    onClose();
  };

  const results = searchResults?.results || [];
  const totalCount = searchResults?.count || 0;

  // Track search when results are available
  // useEffect(() => {
  //   if (searchQuery.trim().length > 0 && searchResults) {
  //     trackSearch({
  //       query: searchQuery,
  //       resultsCount: totalCount,
  //       page: 'header_search',
  //       userId: 'anonymous' // You can get this from auth context if needed
  //     });

  //     trackUserBehavior({
  //       action: 'search_performed',
  //       page: 'header_search',
  //       element: 'search_dropdown',
  //       value: totalCount,
  //       sessionId: sessionStorage.getItem('sessionId') || 'unknown'
  //     });
  //   }
  // }, [searchResults, searchQuery, totalCount, trackSearch, trackUserBehavior]);

  return (
    <div 
      ref={dropdownRef}
      className={`absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-2 ${
        isOpen ? "block" : "hidden"
      }`}
    >
      {/* Search Input */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for products..."
              className="pl-10 pr-4"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <div className="max-h-96 overflow-y-auto">
        {!searchQuery.trim() ? (
          <div className="p-6 text-center text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Start typing to search for products</p>
          </div>
        ) : isLoading ? (
          <div className="p-6 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Searching...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No products found for "{searchQuery}"</p>
          </div>
        ) : (
          <>
            {/* Search Results List */}
            <div className="divide-y divide-gray-100">
              {results.map((product: Product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={handleProductClick}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {product.description?.replace(/<[^>]*>/g, '').substring(0, 60)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Results Button */}
            {totalCount > 5 && (
              <div className="p-4 border-t border-gray-100">
                <Button
                  onClick={handleViewAllResults}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View All {totalCount} Results
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

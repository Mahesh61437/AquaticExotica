import { useState, useEffect } from "react";
import { DataTable, PaginationProps } from "@/components/admin/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, InsertProduct } from "@/types";
import { Loader2, Plus, Edit, Trash2, Tag, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getStockStatus } from "@/lib/utils";
import { StockNotifier } from "@/components/admin/StockNotifier";
import { FirebaseImageSelector } from "@/components/admin/FirebaseImageSelector";
import { ProductImageCarousel } from "@/components/product/ProductImageCarousel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React from "react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

// Define new product type based on API response
interface ApiProduct {
  id: number;
  name: string;
  description: string;
  // price: string;
  // compareAtPrice: string;
  // discountPercentage: number;
  // stock: number;
  categories: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string;
  }[];
  tags: number[]; // Tag IDs for API operations
  tagDetails: TagItem[]; // Tag objects for display
  rating: string;
  isActive: boolean;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  // isInStock: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  variants: Variant[];
}

// Define tag interface
interface TagItem {
  id: number;
  name: string;
  createdAt?: string;
}

// Custom interface for API calls with tag IDs
interface ProductWithTagIds {
  name: string;
  description: string;
  category_ids: number[];
  tags: number[];
  rating: string;
  isActive?: boolean;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  variants: Variant[];
}

interface Variant {
  id: number;
  product: number;
  variantType: string;
  description: string;
  stock: number;
  originalPrice: string;
  offerPrice: string;
  discountPercentage: number;
  isInStock: boolean;
}

interface ProductImage {
  id: number;
  imageUrl: string;
  order: number;
  createdAt?: string;
}

export default function ProductManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [formData, setFormData] = useState<Partial<ProductWithTagIds>>({
    name: "",
    description: "",
    imageUrl: "",
    thumbnailUrl: "",
    category_ids: [],
    tags: [],
    rating: "0",
    variants: [],
    isNew: false,
    isSale: false,
    isFeatured: false,
    isTrending: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([]);
  const [fetchedPages, setFetchedPages] = useState<Set<number>>(new Set());
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requiredFields = [
    'name',
    'description',
    'category_ids',
    'category_ids',
    'imageUrl',
  ];
  // Simplified validation for debugging
  const isFormValid = requiredFields.every(
    (field) => {
      const value = formData[field as keyof typeof formData];
      console.log(`Validating ${field}:`, { value, type: typeof value });
      
      if (field === 'category_ids') {
        const isValid = Array.isArray(value) && value.length > 0;
        console.log(`  category_ids validation:`, { value, isValid });
        return isValid;
      }
      if (field === 'tags') {
        const isValid = Array.isArray(value);
        console.log(`  tags validation:`, { value, isValid });
        return isValid;
      }
      if (field === 'stock') {
        const isValid = typeof value === 'number' && value >= 0;
        console.log(`  stock validation:`, { value, type: typeof value, isValid });
        return isValid;
      }
      const isValid = value && value !== '';
      console.log(`  ${field} validation:`, { value, length: typeof value === 'string' ? value.length : 'N/A', isValid });
      return isValid;
    }
  );
  
  // Debug logging for form validation
  console.log('🔍 Form validation debug:', {
    formData,
    isFormValid,
    fieldChecks: requiredFields.map(field => {
      const value = formData[field as keyof typeof formData];
      let isValid = false;
      if (field === 'category_ids') {
        isValid = Array.isArray(value) && value.length > 0;
      } else if (field === 'tags') {
        isValid = Array.isArray(value);
      } else if (field === 'stock') {
        isValid = typeof value === 'number' && value >= 0;
      } else {
        isValid = Boolean(value && value !== '');
      }
      return { field, value, isValid, type: typeof value };
    })
  });
  
  // More detailed debugging
  console.log('🔍 Detailed field analysis:');
  requiredFields.forEach(field => {
    const value = formData[field as keyof typeof formData];
    console.log(`  ${field}:`, {
      value,
      type: typeof value,
      length: typeof value === 'string' ? value.length : 'N/A',
      isTruthy: Boolean(value),
      isNotZero: typeof value === 'number' ? value !== 0 : false,
      isNumber: typeof value === 'number',
      isGTEZero: typeof value === 'number' && value >= 0,
      isValid: (() => {
        if (field === 'category_ids') {
          return Array.isArray(value) && value.length > 0;
        } else if (field === 'tags') {
          return Array.isArray(value);
        } else if (field === 'stock') {
          return typeof value === 'number' && value >= 0;
        } else {
          return Boolean(value && value !== '');
        }
      })()
    });
  });
  
  // Debug form data changes
  useEffect(() => {
    console.log('📝 Form data changed:', formData);
  }, [formData]);

  // Synchronize formData.category_ids with selectedCategoryIds
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      category_ids: selectedCategoryIds
    }));
  }, [selectedCategoryIds]);

  // Synchronize formData.tags with selectedTagIds
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      tags: selectedTagIds
    }));
  }, [selectedTagIds]);

  // Synchronize formData.variants with local variants state
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      variants
    }));
  }, [variants]);

  // Sync images into formData
  useEffect(() => {
    setFormData(prev => ({ ...prev, images }));
  }, [images]);
  

  const [formError, setFormError] = useState<string | null>(null);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Build API endpoint for products
  const buildProductsEndpoint = (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(itemsPerPage)
    });
    
    if (debouncedSearchQuery) {
      params.append('query', debouncedSearchQuery);
    }
    
    return `/api/products/?${params.toString()}`;
  };

  // Fetch current page of products
  const { data: currentPageResponse, isLoading } = useQuery({
    queryKey: ["/api/products/", currentPage, itemsPerPage, debouncedSearchQuery],
    queryFn: async () => {
      console.log('🛍️ Admin ProductManagement API call:', buildProductsEndpoint(currentPage));
      const response = await apiRequest(buildProductsEndpoint(currentPage));
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response;
      }
      
      // Fallback to array format
      return {
        count: response?.length || 0,
        next: null,
        previous: null,
        results: response || []
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Extract data from response
  const currentPageData = currentPageResponse?.results || [];
  const totalCount = currentPageResponse?.count || currentPageData.length || 0;
  
  // Fetch categories for dropdown
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories/"],
    queryFn: async () => {
      const response = await apiRequest("/api/categories/");
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return response || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
  
  // Fetch tags for dropdown and suggestions
  const { data: tagsResponse, isLoading: tagsLoading, error: tagsError } = useQuery({
    queryKey: ["/api/tags/"],
    queryFn: async () => {
      const response = await apiRequest("/api/tags/");
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return response || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
  
  // Initialize component state from React Query cache when component mounts
  React.useEffect(() => {
    if (currentPageData && currentPageData.length > 0) {
      // If we have data in the cache, initialize the component state
      setAllProducts(prev => {
        if (prev.length === 0) {
          // Only initialize if we don't already have data
          const newProducts = new Array(itemsPerPage * 10).fill(null); // Pre-allocate space
          const startIndex = (currentPage - 1) * itemsPerPage;
          
          // Set the current page data
          currentPageData.forEach((product: ApiProduct, index: number) => {
            newProducts[startIndex + index] = product;
          });
          
          return newProducts;
        }
        return prev;
      });
      
      setFetchedPages(prev => {
        if (prev.size === 0) {
          return new Set([currentPage]);
        }
        return prev;
      });
      
      setHasMorePages(true);
    }
  }, [currentPageData, currentPage, itemsPerPage]);

  // Update all products when current page data changes
  React.useEffect(() => {
    if (currentPageData && currentPageData.length > 0) {
      setAllProducts(prev => {
        const newProducts = [...prev];
        const startIndex = (currentPage - 1) * itemsPerPage;
        
        // Replace products for this page
        currentPageData.forEach((product: ApiProduct, index: number) => {
          newProducts[startIndex + index] = product;
        });
        
        return newProducts;
      });
      
      setFetchedPages(prev => new Set(Array.from(prev).concat([currentPage])));
      
      // Check if we have more pages based on totalCount
      const totalPages = Math.ceil(totalCount / itemsPerPage);
      setHasMorePages(currentPage < totalPages);
    } else if (currentPageData && currentPageData.length === 0) {
      // No more data
      setHasMorePages(false);
    }
  }, [currentPageData, currentPage, itemsPerPage, totalCount]);

  // Reset pagination when search changes
  const prevSearchQueryRef = React.useRef(debouncedSearchQuery);
  React.useEffect(() => {
    // Only reset if the search query actually changed to a different value
    if (prevSearchQueryRef.current !== debouncedSearchQuery) {
      setAllProducts([]);
      setFetchedPages(new Set());
      setHasMorePages(true);
      setCurrentPage(1);
      prevSearchQueryRef.current = debouncedSearchQuery;
    }
  }, [debouncedSearchQuery]);

  // Function to fetch a specific page
  const fetchPage = async (page: number) => {
    if (fetchedPages.has(page)) return;
    
    setIsLoadingMore(true);
    try {
      const response = await apiRequest(buildProductsEndpoint(page));
      
      // Handle new pagination format: { count, next, previous, results }
      let pageData;
      if (response && typeof response === 'object' && 'results' in response) {
        pageData = response.results || [];
      } else {
        pageData = response || [];
      }
      
      setAllProducts(prev => {
        const newProducts = [...prev];
        const startIndex = (page - 1) * itemsPerPage;
        
        // Replace products for this page
        pageData.forEach((product: ApiProduct, index: number) => {
          newProducts[startIndex + index] = product;
        });
        
        return newProducts;
      });
      
      setFetchedPages(prev => new Set(Array.from(prev).concat([page])));
      
      // Check if we have more pages based on API response
      if (response && typeof response === 'object' && 'count' in response) {
        const totalCount = response.count || 0;
        const totalPages = Math.ceil(totalCount / itemsPerPage);
        setHasMorePages(page < totalPages);
      } else {
        // Fallback: check if we have more pages
        if (pageData.length < itemsPerPage) {
          setHasMorePages(false);
        }
      }
    } catch (error) {
      console.error('Error fetching page:', page, error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Calculate total pages based on API response count (minimum 1 page)
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  // Get products for current page
  const products: ApiProduct[] = allProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ).filter(Boolean);


  
  // Extract categories array from response
  const categories: any[] = React.useMemo(() => {
    if (!categoriesResponse) return [];
    
    // Check if response is paginated
    if (categoriesResponse && typeof categoriesResponse === 'object' && 'results' in categoriesResponse) {
      return (categoriesResponse as any).results || [];
    }
    
    // Check if response is a direct array
    if (Array.isArray(categoriesResponse)) {
      return categoriesResponse;
    }
    
    return [];
  }, [categoriesResponse]);
  
  // Extract tags array from response with proper error handling
  const tags: TagItem[] = React.useMemo(() => {
    if (!tagsResponse) return [];
    
    // Check if response is paginated
    if (tagsResponse && typeof tagsResponse === 'object' && 'results' in tagsResponse) {
      return (tagsResponse as any).results || [];
    }
    
    // Check if response is a direct array
    if (Array.isArray(tagsResponse)) {
      return tagsResponse;
    }
    
    return [];
  }, [tagsResponse]);
  
  // Get unique tags from existing products for tag suggestions (fallback)
  const uniqueTags = React.useMemo(() => {
    return products.reduce((acc: string[], product: ApiProduct) => {
      if (product.tagDetails && Array.isArray(product.tagDetails) && product.tagDetails.length > 0) {
        try {
          // Handle tags as array of tag objects from tagDetails
          product.tagDetails.forEach((tag: TagItem) => {
            if (tag.name && !acc.includes(tag.name)) {
              acc.push(tag.name);
            }
          });
        } catch (error) {
          console.warn('Error parsing product tags:', error);
        }
      }
      return acc;
    }, []);
  }, [products]);

  const totalVariantStock = React.useMemo(() => {
    return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }, [variants]);

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProductWithTagIds) => {
      console.log('🚀 Creating product with data:', data);
      return await apiRequest("/api/products/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ Create product error:', error);
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProductWithTagIds> }) => {
      console.log('🔄 Updating product', id, 'with data:', data);
      return await apiRequest(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ Update product error:', error);
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/products/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: ApiProduct) => {
    console.log('✏️ Editing product:', product.name, 'with image URL:', product.imageUrl, 'thumbnail URL:', product.thumbnailUrl);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      thumbnailUrl: product.thumbnailUrl,
      variants: product.variants || [],
      category_ids: product.categories?.map(cat => cat.id) || [],
      tags: [],
      rating: product.rating,
      isNew: product.isNew,
      isSale: product.isSale,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
    });
    
    // Use the tags array (tag IDs) for editing - this is what we send to the API
    let tagIds: number[] = [];
    if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
      try {
        // Use the tag IDs directly from the tags array
        tagIds = product.tags.filter((tagId: number) => tagId);
      } catch (error) {
        console.warn('Error extracting tag IDs from product:', error);
        tagIds = [];
      }
    }
    setSelectedTagIds(tagIds);
    
    // Set selected category IDs
    const categoryIds = product.categories?.map(cat => cat.id) || [];
    setSelectedCategoryIds(categoryIds);
    setVariants(product.variants || []);
    
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    // Validate all required fields
    if (!formData.name || !formData.description || !formData.category_ids || formData.category_ids.length === 0 || !formData.imageUrl) {
      setFormError("Please fill in all required fields: Name, Description, Category, and Image.");
      toast({
        title: "Error",
        description: "Please fill in all required fields: Name, Description, Category, and Image.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if image URL is empty or just whitespace
    const hasImage = formData.imageUrl && formData.imageUrl.trim() !== "";
    
    if (!hasImage) {
      const usePlaceholder = window.confirm(
        "No image has been selected. Would you like to use a placeholder image, or would you prefer to add an image first?"
      );
      
      if (usePlaceholder) {
        formData.imageUrl = "https://placehold.co/600x800/e6e6e6/999999?text=No+Image";
      } else {
        // User chose not to use placeholder, focus on image field
        toast({
          title: "Image Required",
          description: "Please select an image for the product",
          variant: "destructive",
        });
        return;
      }
    }

    // Prepare data with tag IDs and variants for API
    const submitData: ProductWithTagIds = {
      name: formData.name || '',
      description: formData.description || '',
      category_ids: selectedCategoryIds || [],
      tags: selectedTagIds || [],
      rating: formData.rating || '0',
      isNew: formData.isNew || false,
      isSale: formData.isSale || false,
      isFeatured: formData.isFeatured || false,
      isTrending: formData.isTrending || false,
      imageUrl: formData.imageUrl || '',
      ...(formData.thumbnailUrl && { thumbnailUrl: formData.thumbnailUrl }),
      variants: variants || [],
      ...(images && images.length > 0 && { images: images.map(img => ({ imageUrl: img.imageUrl, order: img.order })) }),
    };

    console.log('📤 Submitting product data:', submitData);
    console.log('🔍 Form data thumbnailUrl:', formData.thumbnailUrl);
    console.log('🔍 Submit data thumbnailUrl:', submitData.thumbnailUrl);

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const resetForm = () => {
    console.log('🔄 Resetting form - clearing image URL');
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      thumbnailUrl: "",
      category_ids: [],
      tags: [],
      rating: "0",
      variants: [],
      isNew: false,
      isSale: false,
      isFeatured: false,
      isTrending: false,
    });
    setEditingProduct(null);
    setTagInput("");
    setSelectedTagIds([]);
    setSelectedCategoryIds([]);
    setVariants([]);
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      // Find the tag by name and add its ID
      const tag = tags.find((t: TagItem) => t.name.toLowerCase() === tagInput.trim().toLowerCase());
      if (tag && !selectedTagIds.includes(tag.id)) {
        setSelectedTagIds([...selectedTagIds, tag.id]);
        setTagInput("");
      } else if (!tag) {
        // If tag doesn't exist, show error
        toast({
          title: "Error",
          description: "Tag not found. Please select from available tags or create it first.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setSelectedTagIds(selectedTagIds.filter((id: number) => id !== tagId));
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    
    // Fetch the page if not already fetched
    if (!fetchedPages.has(page)) {
      await fetchPage(page);
    }
    
    // Pre-fetch next page if available
    if (hasMorePages && !fetchedPages.has(page + 1)) {
      fetchPage(page + 1);
    }
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setAllProducts([]);
    setFetchedPages(new Set());
    setHasMorePages(true);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <Button 
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="py-2 px-4 h-auto"
          size="default"
        >
          <Plus className="mr-2 h-5 w-5" /> Add Product
        </Button>
      </div>

      {products && (
        <DataTable 
          data={products}
          searchField={{
            placeholder: "Search products...",
            value: searchQuery,
            onChange: setSearchQuery
          }}
          columns={[
            {
              header: "Image",
              accessor: (product: ApiProduct) => (
                product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-12 w-12 object-cover rounded" 
                  />
                ) : (
                  <div className="h-12 w-12 bg-muted flex items-center justify-center rounded">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )
              )
            },
            {
              header: "Name",
              accessor: "name",
              className: "font-medium"
            },
            {
              header: "Price",
              accessor: (product: ApiProduct) => (
                <div className="flex flex-col">
                  {product.variants && product.variants.length > 0 ? (
                    (() => {
                      // Find lowest offerPrice (if present) or originalPrice
                      let minOffer: number | null = null;
                      let minOriginal: number | null = null;
                      product.variants.forEach(v => {
                        const op = Number(v.offerPrice) || null;
                        const orp = Number(v.originalPrice) || null;
                        if (op) minOffer = minOffer === null ? op : Math.min(minOffer, op);
                        if (orp) minOriginal = minOriginal === null ? orp : Math.min(minOriginal, orp);
                      });

                      const displayPrice = minOffer ?? minOriginal;
                      return displayPrice ? (
                        <>
                          <span className="font-medium">{formatPrice(displayPrice)}</span>
                          {minOffer && minOriginal && minOriginal > minOffer && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(minOriginal)}
                            </span>
                          )}
                        </>
                      ) : (<span className="text-muted-foreground">N/A</span>);
                    })()
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </div>
              )
            },
            {
              header: "Categories",
              accessor: (product: ApiProduct) => (
                <div className="flex flex-wrap gap-1">
                  {product.categories && product.categories.length > 0 ? (
                    product.categories.map((category) => (
                      <Badge key={category.id} variant="outline" className="text-xs">
                        {category.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </div>
              )
            },
            {
              header: "Stock",
              accessor: (product: ApiProduct) => (
                (() => {
                  const total = product.variants ? product.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0) : 0;
                  const status = getStockStatus(total).status;
                  return (
                    <Badge variant={status === 'in-stock' ? 'default' : status === 'low-stock' ? 'outline' : 'destructive'}>
                      {total} {getStockStatus(total).text}
                    </Badge>
                  )
                })()
              )
            },
            {
              header: "Flags",
              accessor: (product: ApiProduct) => (
                <div className="flex gap-1 flex-wrap">
                  {product.isNew && <Badge variant="outline">New</Badge>}
                  {product.isSale && <Badge variant="outline">Sale</Badge>}
                  {product.isFeatured && <Badge variant="outline">Featured</Badge>}
                  {product.isTrending && <Badge variant="outline">Trending</Badge>}
                </div>
              )
            },
            {
              header: "Actions",
              accessor: (product: ApiProduct) => (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
              className: "text-right"
            }
          ]}
          pagination={{
            page: currentPage,
            limit: itemsPerPage,
            totalCount: totalCount,
            totalPages: totalPages
          }}
          isLoading={isLoading}
          emptyMessage="No products found. Add your first product to get started."
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? "Update the product information below." 
                : "Fill in the details to add a new product."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show form error if present */}
            {formError && (
              <div className="text-red-600 text-sm font-medium mb-2">{formError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                  required
                  className={formData.name && formData.name !== '' ? 'border-green-500' : 'border-red-500'}
                />
                {formData.name && formData.name !== '' ? (
                  <span className="text-xs text-green-600">✅ Valid</span>
                ) : (
                  <span className="text-xs text-red-600">❌ Required</span>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categories">Categories *</Label>
                <div className="space-y-2">
                  {/* Selected categories display */}
                  {selectedCategoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedCategoryIds.map((categoryId) => {
                        const category = categories.find(cat => cat.id === categoryId);
                        return category ? (
                          <Badge key={categoryId} variant="secondary" className="gap-1">
                            {category.name}
                            <button 
                              type="button" 
                              onClick={() => setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId))}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              &times;
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  {/* Category selection */}
                  <div className="flex gap-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value && !selectedCategoryIds.includes(parseInt(value))) {
                          setSelectedCategoryIds(prev => [...prev, parseInt(value)]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Add a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : categories && categories.length > 0 ? (
                          categories
                            .filter(category => !selectedCategoryIds.includes(category.id))
                            .map((category: { id: number; name: string }) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-categories" disabled>No categories found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedCategoryIds.length > 0 ? (
                  <span className="text-xs text-green-600">✅ Valid</span>
                ) : (
                  <span className="text-xs text-red-600">❌ Required</span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <RichTextEditor
                value={formData.description || ""}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter product description..."
              />
              {formData.description && formData.description !== '' ? (
                <span className="text-xs text-green-600">✅ Valid</span>
              ) : (
                <span className="text-xs text-red-600">❌ Required</span>
              )}
            </div>
            
            <div className="space-y-4">
              <Label>Variants</Label>
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={idx} className="p-3 border rounded space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>Variant Type</Label>
                        <Input
                          value={v.variantType || ''}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[idx] = { ...newVariants[idx], variantType: e.target.value };
                            setVariants(newVariants);
                          }}
                          placeholder="e.g. One Plant, Pack of 3"
                        />
                      </div>
                      <div className="w-28">
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          min={0}
                          value={v.stock ?? 0}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            newVariants[idx] = { ...newVariants[idx], stock: val };
                            setVariants(newVariants);
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={v.description || ''}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[idx] = { ...newVariants[idx], description: e.target.value };
                            setVariants(newVariants);
                          }}
                          placeholder="Variant description"
                        />
                      </div>
                      <div>
                        <Label>Original Price</Label>
                        <Input
                          value={v.originalPrice || ''}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[idx] = { ...newVariants[idx], originalPrice: e.target.value };
                            setVariants(newVariants);
                          }}
                          placeholder="e.g. 1999"
                        />
                        <Label className="mt-2">Offer Price</Label>
                        <Input
                          value={v.offerPrice || ''}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[idx] = { ...newVariants[idx], offerPrice: e.target.value };
                            setVariants(newVariants);
                          }}
                          placeholder="e.g. 1499"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => {
                        setVariants(prev => prev.filter((_, i) => i !== idx));
                      }}>
                        <Trash2 className="w-4 h-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}

                <div>
                  <Button type="button" onClick={() => setVariants(prev => [...prev, { id: 0, product: 0, variantType: '', description: '', stock: 0, originalPrice: '', offerPrice: '', discountPercentage: 0, isInStock: false }])}>
                    <Plus className="mr-2 h-4 w-4" /> Add Variant
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageOptions">Product Image *</Label>
                <div className="space-y-4">
                  <FirebaseImageSelector
                    initialImage={formData.imageUrl}
                    onImageSelected={(url) => {
                      console.log('🖼️ Image selected:', url);
                      setFormData({ ...formData, imageUrl: url });
                    }}
                    className="w-full"
                  />
                  {/* Temporary direct input for testing */}
                  <div className="mt-2">
                    <Label htmlFor="directImageUrl">Or enter image URL directly:</Label>
                    <Input
                      id="directImageUrl"
                      value={formData.imageUrl || ""}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className={formData.imageUrl && formData.imageUrl !== '' ? 'border-green-500' : 'border-red-500'}
                    />
                    {formData.imageUrl && formData.imageUrl !== '' ? (
                      <span className="text-xs text-green-600">✅ Valid</span>
                    ) : (
                      <span className="text-xs text-red-600">❌ Required</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="thumbnailOptions">Product Thumbnail</Label>
                <div className="space-y-4">
                  <FirebaseImageSelector
                    initialImage={formData.thumbnailUrl}
                    onImageSelected={(url) => setFormData({ ...formData, thumbnailUrl: url })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Product images carousel + add image button */}
            <div className="mt-4">
              <Label>Product Images</Label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  {/* Show carousel if images exist, otherwise placeholder */}
                  {images && images.length > 0 ? (
                    <ProductImageCarousel images={images.map(img => ({ id: img.id, imageUrl: img.imageUrl, order: img.order, createdAt: img.createdAt || new Date().toISOString() }))} fallbackImage={formData.imageUrl} />
                  ) : (
                    <div className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      No additional images
                    </div>
                  )}
                </div>

                <div className="w-64">
                  {showImageSelector ? (
                    <div className="p-2 border rounded">
                      <FirebaseImageSelector
                        onImageSelected={(url) => {
                          // Append new image at end with order = images.length
                          const newImg: ProductImage = { id: Date.now(), imageUrl: url, order: images.length, createdAt: new Date().toISOString() };
                          setImages(prev => [...prev, newImg]);
                          setShowImageSelector(false);
                        }}
                        className="w-full"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" onClick={() => setShowImageSelector(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button onClick={() => setShowImageSelector(true)} className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add Image
                      </Button>

                      <div className="space-y-2">
                        {images.map((img) => (
                          <div key={img.id} className="flex items-center gap-2">
                            <img src={img.imageUrl} className="w-16 h-16 object-cover rounded" />
                            <div className="flex-1 text-sm">
                              <div className="truncate">{img.imageUrl}</div>
                              <div className="text-xs text-muted-foreground">Order: {img.order}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => {
                                // Move up
                                const idx = images.findIndex(i => i.id === img.id);
                                if (idx > 0) {
                                  const next = [...images];
                                  const tmp = next[idx-1];
                                  next[idx-1] = next[idx];
                                  next[idx] = tmp;
                                  setImages(next.map((it, i) => ({ ...it, order: i })));
                                }
                              }}>
                                ▲
                              </Button>
                              <Button size="icon" variant="destructive" onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}>×</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Stock</Label>
                <Input id="totalStock" value={String(totalVariantStock)} readOnly />
                <span className="text-xs text-muted-foreground">Derived from variants</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5) *</Label>
                <Input
                  id="rating"
                  value={formData.rating || "0"}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  placeholder="E.g. 4.5"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} className="whitespace-nowrap">
                    <Tag className="h-4 w-4 mr-1" /> Add Tag
                  </Button>
                </div>
                
                {/* Show available tags if they exist */}
                {tags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Available tags (click to add):</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tags.map((tag: TagItem) => (
                        <Badge 
                          key={tag.id} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => {
                            if (!selectedTagIds.includes(tag.id)) {
                              setSelectedTagIds([...selectedTagIds, tag.id]);
                            }
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show suggested tags from products if no tags are available */}
                {uniqueTags.length > 0 && tags.length === 0 && !tagsLoading && !tagsError && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Suggested tags from products (click to add):</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {uniqueTags.map((tag: string) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => {
                            // Find tag by name and add its ID
                            const foundTag = tags.find((t: TagItem) => t.name === tag);
                            if (foundTag && !selectedTagIds.includes(foundTag.id)) {
                              setSelectedTagIds([...selectedTagIds, foundTag.id]);
                            }
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show loading state for tags */}
                {tagsLoading && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading tags...
                    </div>
                  </div>
                )}
                
                {/* Show error state for tags */}
                {tagsError && (
                  <div className="mt-2">
                    <p className="text-xs text-red-500">Failed to load tags. You can still add tags manually.</p>
                  </div>
                )}
                
                {/* Show selected tags */}
                {selectedTagIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Selected tags:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedTagIds.map((tagId: number) => {
                        const tag = tags.find((t: TagItem) => t.id === tagId);
                        return tag ? (
                          <Badge key={tagId} variant="secondary" className="gap-1">
                            {tag.name}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveTag(tagId)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              &times;
                            </button>
                          </Badge>
                        ) : (
                          <Badge key={tagId} variant="secondary" className="gap-1">
                            Unknown Tag (ID: {tagId})
                            <button 
                              type="button" 
                              onClick={() => handleRemoveTag(tagId)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              &times;
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isNew"
                  checked={formData.isNew || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isNew: checked })}
                />
                <Label htmlFor="isNew">Mark as New</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isSale"
                  checked={formData.isSale || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSale: checked })}
                />
                <Label htmlFor="isSale">Mark as Sale</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
                <Label htmlFor="isFeatured">Mark as Featured</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isTrending"
                  checked={formData.isTrending || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isTrending: checked })}
                />
                <Label htmlFor="isTrending">Mark as Trending</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
              {/* Debug info */}
              <div className="text-xs text-muted-foreground mt-2">
                Form valid: {isFormValid ? '✅' : '❌'} | 
                Pending: {(createMutation.isPending || updateMutation.isPending) ? 'Yes' : 'No'}
              </div>
              {/* Test button to fill all required fields */}
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    name: "Test Product",
                    description: "Test description",
                    imageUrl: "https://placehold.co/600x800/e6e6e6/999999?text=Test+Image"
                  });
                  setVariants([{ id: 0, product: 0, variantType: 'Default', description: 'Default variant', stock: 10, originalPrice: '100', offerPrice: '80', discountPercentage: 20, isInStock: true }]);
                  if (categories && categories.length > 0) {
                    setSelectedCategoryIds([categories[0].id]);
                  }
                }}
                className="mt-2"
              >
                Fill Test Data
              </Button>
              {/* Debug button to log current form state */}
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('🔍 Current form data:', formData);
                  console.log('🔍 Required fields:', requiredFields);
                  console.log('🔍 Categories:', categories);
                }}
                className="mt-2 ml-2"
              >
                Log Form State
              </Button>
            </DialogFooter>
          </form>
          
          {/* Add stock notifier component when editing a product (derived from variants) */}
          {editingProduct && (editingProduct.variants ? editingProduct.variants.reduce((s,v) => s + (Number(v.stock)||0), 0) : 0) > 0 && (
            <div className="mt-6 border-t pt-6">
              <StockNotifier 
                product={{
                  ...editingProduct,
                  // Provide `stock` for StockNotifier compatibility by summing variant stocks
                  stock: editingProduct.variants ? editingProduct.variants.reduce((s,v) => s + (Number(v.stock)||0), 0) : 0,
                  categories: editingProduct.categories && editingProduct.categories.length > 0 ? editingProduct.categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    imageUrl: cat.imageUrl,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })) : [{
                    id: 0,
                    name: 'Uncategorized',
                    slug: 'uncategorized',
                    description: null,
                    imageUrl: '',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }],
                  tags: editingProduct.tagDetails ? editingProduct.tagDetails.map(tag => tag.name) : [],
                  tagDetails: editingProduct.tagDetails ? editingProduct.tagDetails.map(tag => ({
                    id: tag.id,
                    name: tag.name,
                    slug: tag.name.toLowerCase().replace(/\s+/g, '-'),
                    isActive: true,
                    createdAt: tag.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })) : [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                } as any}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/products/"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
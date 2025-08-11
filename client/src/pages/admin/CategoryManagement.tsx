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
import { useMutation, useQuery } from "@tanstack/react-query";
import { Category, InsertCategory } from "@/types";
import { Loader2, Plus, Edit, Trash2, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FirebaseImageSelector } from "@/components/admin/FirebaseImageSelector";
import React from "react";

export default function CategoryManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<InsertCategory>>({
    name: "",
    slug: "",
    imageUrl: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [fetchedPages, setFetchedPages] = useState<Set<number>>(new Set());
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Build API endpoint for categories
  const buildCategoriesEndpoint = (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(itemsPerPage)
    });
    
    if (debouncedSearchQuery) {
      params.append('query', debouncedSearchQuery);
    }
    
    return `/api/categories/?${params.toString()}`;
  };

  // Fetch current page of categories
  const { data: currentPageData, isLoading } = useQuery({
    queryKey: ["/api/categories/", currentPage, itemsPerPage, debouncedSearchQuery],
    queryFn: async () => {
      console.log('🏷️ Admin CategoryManagement API call:', buildCategoriesEndpoint(currentPage));
      const response = await apiRequest(buildCategoriesEndpoint(currentPage));
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Initialize component state from React Query cache when component mounts
  React.useEffect(() => {
    if (currentPageData && currentPageData.length > 0) {
      // If we have data in the cache, initialize the component state
      setAllCategories(prev => {
        if (prev.length === 0) {
          // Only initialize if we don't already have data
          const newCategories = new Array(itemsPerPage * 10).fill(null); // Pre-allocate space
          const startIndex = (currentPage - 1) * itemsPerPage;
          
          // Set the current page data
          currentPageData.forEach((category: Category, index: number) => {
            newCategories[startIndex + index] = category;
          });
          
          return newCategories;
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

  // Update all categories when current page data changes
  React.useEffect(() => {
    if (currentPageData && currentPageData.length > 0) {
      setAllCategories(prev => {
        const newCategories = [...prev];
        const startIndex = (currentPage - 1) * itemsPerPage;
        
        // Replace categories for this page
        currentPageData.forEach((category: Category, index: number) => {
          newCategories[startIndex + index] = category;
        });
        
        return newCategories;
      });
      
      setFetchedPages(prev => new Set(Array.from(prev).concat([currentPage])));
      
      // Check if we have more pages
      if (currentPageData.length < itemsPerPage) {
        setHasMorePages(false);
      }
    } else if (currentPageData && currentPageData.length === 0) {
      // No more data
      setHasMorePages(false);
    }
  }, [currentPageData, currentPage, itemsPerPage]);

  // Reset pagination when search changes
  const prevSearchQueryRef = React.useRef(debouncedSearchQuery);
  React.useEffect(() => {
    // Only reset if the search query actually changed to a different value
    if (prevSearchQueryRef.current !== debouncedSearchQuery) {
      setAllCategories([]);
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
      const response = await apiRequest(buildCategoriesEndpoint(page));
      
      // Handle new pagination format: { count, next, previous, results }
      let pageData;
      if (response && typeof response === 'object' && 'results' in response) {
        pageData = response.results || [];
      } else {
        pageData = response || [];
      }
      
      setAllCategories(prev => {
        const newCategories = [...prev];
        const startIndex = (page - 1) * itemsPerPage;
        
        // Replace categories for this page
        pageData.forEach((category: Category, index: number) => {
          newCategories[startIndex + index] = category;
        });
        
        return newCategories;
      });
      
      setFetchedPages(prev => new Set(Array.from(prev).concat([page])));
      
      // Check if we have more pages
      if (pageData.length < itemsPerPage) {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Error fetching page:', page, error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Calculate total pages based on fetched data
  const totalPages = Math.max(
    Math.ceil(allCategories.length / itemsPerPage),
    Math.max(...Array.from(fetchedPages), 0)
  );

  // Get categories for current page
  const categories: Category[] = allCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ).filter(Boolean);
  
  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      return await apiRequest("/api/categories/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCategory> }) => {
      return await apiRequest(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/categories/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
    });
    
    // Category image will only be from Firebase Storage
    
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this category? This will also affect all products assigned to this category.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data - image is now optional
    if (!formData.name || !formData.slug) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertCategory);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      imageUrl: "",
    });
    setEditingCategory(null);
  };

  const handleGenerateSlug = () => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      setFormData({
        ...formData,
        slug,
      });
    }
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
    setAllCategories([]);
    setFetchedPages(new Set());
    setHasMorePages(true);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <Button 
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="py-2 px-4 h-auto"
          size="default"
        >
          <Plus className="mr-2 h-5 w-5" /> Add Category
        </Button>
      </div>

      {categories && (
        <DataTable 
          data={categories}
          searchField={{
            placeholder: "Search categories...",
            value: searchQuery,
            onChange: setSearchQuery
          }}
          columns={[
            {
              header: "Image",
              accessor: (category: Category) => (
                category.imageUrl ? (
                  <img 
                    src={category.imageUrl} 
                    alt={category.name} 
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
              header: "Slug",
              accessor: "slug"
            },

            {
              header: "Actions",
              accessor: (category: Category) => (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
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
            totalCount: allCategories.length,
            totalPages: totalPages
          }}
          isLoading={isLoading}
          emptyMessage="No categories found. Add your first category to get started."
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? "Update the category information below." 
                : "Fill in the details to add a new category."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="slug">Slug *</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleGenerateSlug}
                  className="text-xs py-1 px-2 h-7"
                >
                  Generate from Name
                </Button>
              </div>
              <Input
                id="slug"
                value={formData.slug || ""}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="category-slug"
                required
              />
            </div>
            

            
            <div className="space-y-2">
              <Label>Category Image</Label>
              <div className="space-y-4">
                <FirebaseImageSelector
                  initialImage={formData.imageUrl}
                  onImageSelected={(url) => setFormData({ ...formData, imageUrl: url })}
                  className="w-full"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCategory ? "Update Category" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
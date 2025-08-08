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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Edit, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import React from "react";

// Define tag type based on API response
interface ApiTag {
  id: number;
  name: string;
  createdAt: string;
}

export default function TagManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ApiTag | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [allTags, setAllTags] = useState<ApiTag[]>([]);
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
  
  // Build API endpoint for tags
  const buildTagsEndpoint = (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(itemsPerPage)
    });
    
    if (debouncedSearchQuery) {
      params.append('query', debouncedSearchQuery);
    }
    
    return `/api/tags/?${params.toString()}`;
  };

  // Fetch current page of tags
  const { data: currentPageData, isLoading } = useQuery({
    queryKey: ["/api/tags/", currentPage, itemsPerPage, debouncedSearchQuery],
    queryFn: async () => {
      console.log('🏷️ TagManagement API call:', buildTagsEndpoint(currentPage));
      const response = await apiRequest(buildTagsEndpoint(currentPage));
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Update all tags when current page data changes
  React.useEffect(() => {
    if (currentPageData && currentPageData.length > 0) {
      setAllTags(prev => {
        const newTags = [...prev];
        const startIndex = (currentPage - 1) * itemsPerPage;
        
        // Replace tags for this page
        currentPageData.forEach((tag: ApiTag, index: number) => {
          newTags[startIndex + index] = tag;
        });
        
        return newTags;
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
      setAllTags([]);
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
      const response = await apiRequest(buildTagsEndpoint(page));
      
      // Handle new pagination format: { count, next, previous, results }
      let pageData;
      if (response && typeof response === 'object' && 'results' in response) {
        pageData = response.results || [];
      } else {
        pageData = response || [];
      }
      
      setAllTags(prev => {
        const newTags = [...prev];
        const startIndex = (page - 1) * itemsPerPage;
        
        // Replace tags for this page
        pageData.forEach((tag: ApiTag, index: number) => {
          newTags[startIndex + index] = tag;
        });
        
        return newTags;
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
    Math.ceil(allTags.length / itemsPerPage),
    Math.max(...Array.from(fetchedPages), 0)
  );

  // Get tags for current page
  const tags: ApiTag[] = allTags.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ).filter(Boolean);

  // Create tag mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return await apiRequest("/api/tags/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
      toast({
        title: "Success",
        description: "Tag created successfully",
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create tag: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update tag mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string } }) => {
      return await apiRequest(`/api/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
      toast({
        title: "Success",
        description: "Tag updated successfully",
      });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update tag: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete tag mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/tags/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags/"] });
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete tag: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (tag: ApiTag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this tag?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tag name",
        variant: "destructive",
      });
      return;
    }

    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
    });
    setEditingTag(null);
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
    setAllTags([]);
    setFetchedPages(new Set());
    setHasMorePages(true);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Tag Management</h2>
        <Button 
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="py-2 px-4 h-auto"
          size="default"
        >
          <Plus className="mr-2 h-5 w-5" /> Add Tag
        </Button>
      </div>

      {tags && (
        <DataTable 
          data={tags}
          searchField={{
            placeholder: "Search tags...",
            value: searchQuery,
            onChange: setSearchQuery
          }}
          columns={[
            {
              header: "Name",
              accessor: "name",
              className: "font-medium"
            },
            {
              header: "Created",
              accessor: (tag: ApiTag) => formatDate(tag.createdAt)
            },
            {
              header: "Actions",
              accessor: (tag: ApiTag) => (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(tag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(tag.id)}
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
            totalCount: allTags.length,
            totalPages: totalPages
          }}
          isLoading={isLoading}
          emptyMessage="No tags found. Add your first tag to get started."
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Add New Tag"}</DialogTitle>
            <DialogDescription>
              {editingTag 
                ? "Update the tag information below." 
                : "Fill in the details to add a new tag."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tag Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tag name"
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingTag ? "Update Tag" : "Add Tag"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
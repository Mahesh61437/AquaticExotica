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
import { Category, InsertCategory } from "@shared/schema";
import { Loader2, Plus, Edit, Trash2, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ImageUpload } from "@/components/admin/ImageUpload";

export default function CategoryManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageSourceType, setImageSourceType] = useState<'upload' | 'url'>('upload');
  const [formData, setFormData] = useState<Partial<InsertCategory>>({
    name: "",
    slug: "",
    imageUrl: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
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

  // Fetch categories with pagination and search
  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ["/api/admin/categories", currentPage, itemsPerPage, debouncedSearchQuery],
    queryFn: async ({ queryKey }) => {
      const basePath = queryKey[0] as string;
      const page = queryKey[1] as number;
      const limit = queryKey[2] as number;
      const query = queryKey[3] as string;
      
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      
      if (query) {
        params.append('query', query);
      }
      
      const res = await fetch(`${basePath}?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    },
  });
  
  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create category");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
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
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update category");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
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
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete category");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
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
    
    // Set default placeholder image if no image was uploaded
    if (!formData.imageUrl) {
      formData.imageUrl = "https://placehold.co/600x800/e6e6e6/999999?text=Category";
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
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

      {categoriesResponse && (
        <DataTable 
          data={categoriesResponse.data || []}
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
            totalCount: categoriesResponse.pagination?.totalCount || 0,
            totalPages: categoriesResponse.pagination?.totalPages || 1
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
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="imageType">Image Source</Label>
                  <select 
                    id="categoryImageType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.imageUrl?.startsWith('http') && !formData.imageUrl?.includes('firebasestorage') ? 'url' : 'upload'}
                    onChange={(e) => {
                      // Create a default empty URL if switching to URL mode
                      if (e.target.value === 'url') {
                        setFormData({ ...formData, imageUrl: "" });
                      }
                    }}
                  >
                    <option value="upload">Upload Image</option>
                    <option value="url">External URL</option>
                  </select>
                </div>
                
                {document.getElementById('categoryImageType')?.value === 'url' || (formData.imageUrl?.startsWith('http') && !formData.imageUrl?.includes('firebasestorage')) ? (
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl || ""}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.imageUrl && (
                      <div className="mt-2 relative w-full h-48 border rounded-md overflow-hidden">
                        <img 
                          src={formData.imageUrl} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/600x800/e6e6e6/999999?text=Category";
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData({ ...formData, imageUrl: "" })}
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <ImageUpload 
                    initialImage={formData.imageUrl}
                    onImageUploaded={(url) => setFormData({ ...formData, imageUrl: url })}
                    onImageRemoved={() => setFormData({ ...formData, imageUrl: "" })}
                    folder="categories"
                  />
                )}
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
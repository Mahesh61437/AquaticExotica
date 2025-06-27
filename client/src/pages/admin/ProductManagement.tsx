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
import { Product, InsertProduct } from "@shared/schema";
import { Loader2, Plus, Edit, Trash2, Tag, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getStockStatus } from "@/lib/utils";
import { StockNotifier } from "@/components/admin/StockNotifier";
import { FirebaseImageSelector } from "@/components/admin/FirebaseImageSelector";
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

// Define new product type based on API response
interface ApiProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  discountPercentage: number;
  stock: number;
  category: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string;
  };
  tags: TagItem[];
  rating: string;
  isActive: boolean;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isInStock: boolean;
  imageUrl: string;
}

// Define tag interface
interface TagItem {
  id: number;
  name: string;
  createdAt?: string;
}

// Custom interface for API calls with tag IDs
interface ProductWithTagIds extends Omit<InsertProduct, 'tags'> {
  tags: number[];
}

export default function ProductManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [formData, setFormData] = useState<Partial<InsertProduct>>({
    name: "",
    description: "",
    price: "",
    compareAtPrice: null,
    imageUrl: "",
    category: "",
    tags: [],
    rating: "0",
    stock: 0,
    isNew: false,
    isSale: false,
    isFeatured: false,
    isTrending: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
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

  // Fetch products with pagination and search
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ["/api/products/", currentPage, itemsPerPage, debouncedSearchQuery],
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
      
      return await apiRequest(`${basePath}?${params.toString()}`);
    },
  });
  
  // Fetch categories for dropdown
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories/"],
    queryFn: async () => {
      return await apiRequest("/api/categories/");
    },
  });
  
  // Fetch tags for dropdown and suggestions
  const { data: tagsResponse, isLoading: tagsLoading, error: tagsError } = useQuery({
    queryKey: ["/api/tags/"],
    queryFn: async () => {
      return await apiRequest("/api/tags/");
    },
  });
  
  // Extract products array from response
  const products: ApiProduct[] = React.useMemo(() => {
    if (!productsResponse) return [];
    
    // Check if response is paginated
    if (productsResponse && typeof productsResponse === 'object' && 'data' in productsResponse) {
      return (productsResponse as any).data || [];
    }
    
    // Check if response is a direct array
    if (Array.isArray(productsResponse)) {
      return productsResponse;
    }
    
    return [];
  }, [productsResponse]);
  
  // Extract categories array from response
  const categories: any[] = React.useMemo(() => {
    if (!categoriesResponse) return [];
    
    // Check if response is paginated
    if (categoriesResponse && typeof categoriesResponse === 'object' && 'data' in categoriesResponse) {
      return (categoriesResponse as any).data || [];
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
    if (tagsResponse && typeof tagsResponse === 'object' && 'data' in tagsResponse) {
      return (tagsResponse as any).data || [];
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
      if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
        try {
          // Handle tags as array of tag objects
          product.tags.forEach((tag: TagItem) => {
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

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProductWithTagIds) => {
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
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProductWithTagIds> }) => {
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
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
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
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: product.imageUrl,
      category: product.category?.name || "",
      tags: [],
      rating: product.rating,
      stock: product.stock,
      isNew: product.isNew,
      isSale: product.isSale,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
    });
    
    // Extract tag IDs from product tags array
    let tagIds: number[] = [];
    if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
      try {
        // Extract tag IDs directly from the tag objects
        tagIds = product.tags
          .filter((tag: TagItem) => tag.id && tag.name)
          .map((tag: TagItem) => tag.id);
      } catch (error) {
        console.warn('Error extracting tag IDs from product:', error);
        tagIds = [];
      }
    }
    setSelectedTagIds(tagIds);
    
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data - image is now optional
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Set default placeholder image if no image was uploaded
    if (!formData.imageUrl) {
      formData.imageUrl = "https://placehold.co/600x800/e6e6e6/999999?text=No+Image";
    }

    // Prepare data with tag IDs for API
    const submitData = {
      ...formData,
      tags: selectedTagIds || []
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: submitData as ProductWithTagIds });
    } else {
      createMutation.mutate(submitData as ProductWithTagIds);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      compareAtPrice: null,
      imageUrl: "",
      category: "",
      tags: [],
      rating: "0",
      stock: 0,
      isNew: false,
      isSale: false,
      isFeatured: false,
      isTrending: false,
    });
    setEditingProduct(null);
    setTagInput("");
    setSelectedTagIds([]);
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
                  <span className="font-medium">{formatPrice(product.price)}</span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>
              )
            },
            {
              header: "Category",
              accessor: (product: ApiProduct) => product.category?.name || "N/A"
            },
            {
              header: "Stock",
              accessor: (product: ApiProduct) => (
                <Badge
                  variant={
                    getStockStatus(product.stock).status === 'in-stock'
                      ? 'default'
                      : getStockStatus(product.stock).status === 'low-stock'
                      ? 'outline'
                      : 'destructive'
                  }
                >
                  {product.stock} {getStockStatus(product.stock).text}
                </Badge>
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
            totalCount: (productsResponse as any)?.pagination?.totalCount || products.length,
            totalPages: (productsResponse as any)?.pagination?.totalPages || 1
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : categories && categories.length > 0 ? (
                      categories.map((category: { id: number; name: string }) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="default" disabled>No categories found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed product description"
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="E.g. 1999"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare At Price (₹)</Label>
                <Input
                  id="compareAtPrice"
                  value={formData.compareAtPrice || ""}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value || null })}
                  placeholder="Original price (if discounted)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageOptions">Product Image</Label>
                <div className="space-y-4">
                  <FirebaseImageSelector
                    initialImage={formData.imageUrl}
                    onImageSelected={(url) => setFormData({ ...formData, imageUrl: url })}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock || 0}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                  min={0}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
          
          {/* Add stock notifier component when editing a product */}
          {editingProduct && editingProduct.stock > 0 && (
            <div className="mt-6 border-t pt-6">
              <StockNotifier 
                product={{
                  ...editingProduct,
                  category: editingProduct.category?.name || "",
                  tags: selectedTagIds.map(tagId => {
                    const tag = tags.find((t: TagItem) => t.id === tagId);
                    return tag ? tag.name : '';
                  }).filter(name => name !== '')
                }}
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
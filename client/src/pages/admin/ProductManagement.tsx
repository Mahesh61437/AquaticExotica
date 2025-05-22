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

export default function ProductManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
    queryKey: ["/api/admin/products", currentPage, itemsPerPage, debouncedSearchQuery],
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
      
      if (!res.ok) throw new Error("Failed to fetch products");
      return await res.json();
    },
  });
  
  // Fetch categories for dropdown
  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return await res.json();
    },
  });
  
  // Extract categories array from response
  const categories = categoriesResponse?.data || [];
  
  // Get unique tags from existing products for tag suggestions
  const uniqueTags = productsResponse?.data?.reduce((acc: string[], product: Product) => {
    if (product.tags) {
      product.tags.forEach((tag: string) => {
        if (!acc.includes(tag)) {
          acc.push(tag);
        }
      });
    }
    return acc;
  }, []) || [];

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create product");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProduct> }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update product");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete product");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: product.imageUrl,
      category: product.category,
      tags: product.tags,
      rating: product.rating,
      stock: product.stock,
      isNew: product.isNew,
      isSale: product.isSale,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
    });
    
    // Image will only be Firebase Storage URLs
    
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

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertProduct);
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
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t: string) => t !== tag) || [],
    });
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

      {productsResponse && (
        <DataTable 
          data={productsResponse.data || []}
          searchField={{
            placeholder: "Search products...",
            value: searchQuery,
            onChange: setSearchQuery
          }}
          columns={[
            {
              header: "Image",
              accessor: (product: Product) => (
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
              accessor: (product: Product) => (
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
              accessor: "category"
            },
            {
              header: "Stock",
              accessor: (product: Product) => (
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
              accessor: (product: Product) => (
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
              accessor: (product: Product) => (
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
            totalCount: productsResponse.pagination?.totalCount || 0,
            totalPages: productsResponse.pagination?.totalPages || 1
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
                
                {uniqueTags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Suggested tags (click to add):</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {uniqueTags.map((tag: string) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => {
                            if (!formData.tags?.includes(tag)) {
                              setFormData({
                                ...formData,
                                tags: [...(formData.tags || []), tag]
                              });
                            }
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
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
                product={editingProduct}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
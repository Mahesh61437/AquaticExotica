import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { ShoppingCart, Package, ChevronRight, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types";
import { formatPrice, generateStarRating, getStockStatus, extractProductIdFromSlug, generateMetaDescription, cleanTextForSEO } from "@/lib/utils";
import { ProductCard } from "@/components/shop/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { StockNotificationForm } from "@/components/product/StockNotificationForm";
import { ProductImageCarousel } from "@/components/product/ProductImageCarousel";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Edit, Trash2, Tag, ImageIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StockNotifier } from "@/components/admin/StockNotifier";
import { FirebaseImageSelector } from "@/components/admin/FirebaseImageSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

// Define image type
interface ProductImage {
  id: number;
  imageUrl: string;
  order: number;
  createdAt: string;
}

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
  } | null;
  tags: number[]; // Tag IDs for API operations
  tagDetails: ApiTag[]; // Tag objects for display
  rating: string;
  isActive: boolean;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isInStock: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  images?: ProductImage[]; // Array of product images for carousel
}

// Define tag type
interface ApiTag {
  id: number;
  name: string;
  createdAt: string;
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const { toast } = useToast();
  const { addItem } = useCart();
  const { currentUser } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState<Partial<{
    name: string;
    description: string;
    price: string;
    compareAtPrice: string;
    stock: number;
    categoryId: number;
    rating: string;
    isNew: boolean;
    isSale: boolean;
    isFeatured: boolean;
    isTrending: boolean;
    imageUrl: string;
    thumbnailUrl: string;
  }>>({});
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // Extract product ID from the slug
  const productId = params?.slug ? extractProductIdFromSlug(params.slug) : null;
  
  console.log('🔍 ProductDetail - Slug:', params?.slug, 'Product ID:', productId);
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { data: product, isLoading, error } = useQuery<ApiProduct>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
    queryFn: async () => {
      console.log('📦 Fetching product:', productId);
      const response = await apiRequest(`/api/products/${productId}`);
      console.log('📦 Product response:', response);
      return response;
    },
  });

  // Fetch tags for conversion
  const { data: tagsResponse } = useQuery<ApiTag[]>({
    queryKey: ["/api/tags/"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      console.log('🏷️ Fetching tags');
      const response = await apiRequest("/api/tags/");
      console.log('🏷️ Tags response:', response);
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return Array.isArray(response) ? response : [];
    },
  });

  // Fetch categories for edit modal
  const { data: categoriesResponse } = useQuery<any[]>({
    queryKey: ["/api/categories/"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      console.log('📂 Fetching categories');
      const response = await apiRequest("/api/categories/");
      console.log('📂 Categories response:', response);
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return Array.isArray(response) ? response : [];
    },
  });

  // Fetch related products
  const { data: relatedProductsResponse } = useQuery<ApiProduct[]>({
    queryKey: [`/api/products/${productId}/related`],
    enabled: !!product,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      console.log('🔄 Fetching related products');
      const response = await apiRequest(`/api/products/${productId}/related`);
      console.log('🔄 Related products response:', response);
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return Array.isArray(response) ? response : [];
    },
  });

  // Extract tags array from response
  const tags: ApiTag[] = React.useMemo(() => {
    if (!tagsResponse) return [];
    return Array.isArray(tagsResponse) ? tagsResponse : [];
  }, [tagsResponse]);

  // Extract categories array from response
  const categories: any[] = React.useMemo(() => {
    if (!categoriesResponse) return [];
    return Array.isArray(categoriesResponse) ? categoriesResponse : [];
  }, [categoriesResponse]);

  // Extract related products array from response
  const relatedProducts: ApiProduct[] = React.useMemo(() => {
    if (!relatedProductsResponse) return [];
    return Array.isArray(relatedProductsResponse) ? relatedProductsResponse : [];
  }, [relatedProductsResponse]);

  // Helper function to convert tag objects to tag names
  const convertTagsToNames = (tags: ApiTag[]): string[] => {
    return tags.map(tag => tag.name).filter(name => name !== '');
  };

  // Handle invalid product ID from slug
  if (productId === null) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Button asChild>
          <a href="/shop">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
            <div className="space-y-4 mt-6">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Early return for error or missing product
  if (error || !product) {
    console.error('❌ ProductDetail error:', error);
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Button asChild>
          <a href="/shop">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product) return;
    
    // Do not add to cart if the product is out of stock
    if (product.stock <= 0) {
      toast({
        title: "Cannot add to cart",
        description: "This product is currently out of stock.",
        variant: "destructive"
      });
      return;
    }
    
    // Make sure the quantity doesn't exceed available stock
    const finalQuantity = Math.min(quantity, product.stock);
    
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price.toString()),
      imageUrl: product.imageUrl,
      quantity: finalQuantity,
    }, finalQuantity, true); // Open cart when adding from product detail
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleQuantityChange = (value: number) => {
    setQuantity(Math.max(1, value));
  };

  // Edit handlers
  const handleEditOpen = () => {
    if (!product) return;
    
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      categoryId: product.category?.id || 0,
      rating: product.rating,
      isNew: product.isNew,
      isSale: product.isSale,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
      imageUrl: product.imageUrl,
      thumbnailUrl: product.thumbnailUrl,
    });
    
    // Set selected tags
    setSelectedTagIds(product.tags || []);
    setTagInput("");
    
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      const submitData = {
        name: editFormData.name || product.name,
        description: editFormData.description || product.description,
        price: editFormData.price || product.price,
        compareAtPrice: editFormData.compareAtPrice || product.compareAtPrice,
        stock: editFormData.stock || product.stock,
        categoryId: editFormData.categoryId || product.category?.id || 0,
        tags: selectedTagIds,
        rating: editFormData.rating || product.rating,
        isNew: editFormData.isNew ?? product.isNew,
        isSale: editFormData.isSale ?? product.isSale,
        isFeatured: editFormData.isFeatured ?? product.isFeatured,
        isTrending: editFormData.isTrending ?? product.isTrending,
        imageUrl: editFormData.imageUrl || product.imageUrl,
        thumbnailUrl: editFormData.thumbnailUrl || product.thumbnailUrl,
      };

      await apiRequest(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
      });

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      
      setIsEditModalOpen(false);
      // Refresh the product data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const tag = tags.find((t: ApiTag) => t.name.toLowerCase() === tagInput.trim().toLowerCase());
      if (tag && !selectedTagIds.includes(tag.id)) {
        setSelectedTagIds([...selectedTagIds, tag.id]);
        setTagInput("");
      } else if (!tag) {
        toast({
          title: "Error",
          description: "Tag not found. Please select from available tags.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setSelectedTagIds(selectedTagIds.filter((id: number) => id !== tagId));
  };

  return (
    <>
      <Helmet>
        <title>{product?.name || 'Product'} - Aquatic Exotica</title>
        <meta name="description" content={generateMetaDescription(cleanTextForSEO(product?.description || ''))} />
        <meta name="keywords" content={`${product?.name || 'product'}, aquatic plants, aquascaping, aquarium supplies, ${product?.category?.name || 'aquatic'}, aquatic exotica, india`} />
        <meta property="og:title" content={`${product?.name || 'Product'} - Aquatic Exotica`} />
        <meta property="og:description" content={generateMetaDescription(cleanTextForSEO(product?.description || ''))} />
        <meta property="og:image" content={product?.imageUrl || ''} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />
        <meta property="product:price:amount" content={product?.price || '0'} />
        <meta property="product:price:currency" content="INR" />
        <meta property="product:availability" content={(product?.stock || 0) > 0 ? "in stock" : "out of stock"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product?.name || 'Product'} - Aquatic Exotica`} />
        <meta name="twitter:description" content={generateMetaDescription(cleanTextForSEO(product?.description || ''))} />
        <meta name="twitter:image" content={product?.imageUrl || ''} />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product?.name || 'Product',
            "description": cleanTextForSEO(product?.description || ''),
            "image": product?.imageUrl || '',
            "offers": {
              "@type": "Offer",
              "price": product?.price || '0',
              "priceCurrency": "INR",
              "availability": (product?.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "url": window.location.href
            },
            "brand": {
              "@type": "Brand",
              "name": "Aquatic Exotica"
            },
            "category": product?.category?.name || "Aquatic Plants"
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 mb-8">
          <a href="/home" className="hover:text-primary">Home</a>
          <ChevronRight className="h-4 w-4 mx-2" />
          <a href="/shop" className="hover:text-primary">Shop</a>
          {product.category && (
            <>
              <ChevronRight className="h-4 w-4 mx-2" />
              <a href={`/shop/${product.category.slug || product.category.name?.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary">
                {product.category.name || 'Category'}
              </a>
            </>
          )}
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-700 font-medium">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Product Image Carousel */}
          <ProductImageCarousel 
            images={product?.images || []}
            fallbackImage={product?.imageUrl || ''}
          />

          {/* Product Info */}
          <div>
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-heading font-bold">{product?.name || 'Product'}</h1>
              {currentUser?.isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditOpen}
                  className="ml-4"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
              )}
            </div>
            
            <div className="flex items-center mt-4">
              <div className="flex text-yellow-400 text-sm mr-2"
                dangerouslySetInnerHTML={{ __html: generateStarRating(product.rating) }}>
              </div>
              <span className="text-sm text-gray-500">({product.rating} rating)</span>
            </div>
            
            <div className="mt-4">
              {product.compareAtPrice ? (
                <div className="flex items-center">
                  <span className="text-2xl font-semibold text-accent mr-2">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-gray-400 line-through text-lg">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  {/* Priority Badge - Show only one with priority: Featured > Trending > New > Sale */}
                  {(() => {
                    if (product.isFeatured) {
                      return (
                        <span className="ml-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                          FEATURED
                        </span>
                      );
                    } else if (product.isTrending) {
                      return (
                        <span className="ml-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
                          TRENDING
                        </span>
                      );
                    } else if (product.isNew) {
                      return (
                        <span className="ml-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                          NEW
                        </span>
                      );
                    } else if (product.isSale) {
                      return (
                        <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          SALE
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-2xl font-semibold">
                    {formatPrice(product.price)}
                  </span>
                  {/* Priority Badge for products without compareAtPrice */}
                  {(() => {
                    if (product.isFeatured) {
                      return (
                        <span className="ml-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                          FEATURED
                        </span>
                      );
                    } else if (product.isTrending) {
                      return (
                        <span className="ml-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
                          TRENDING
                        </span>
                      );
                    } else if (product.isNew) {
                      return (
                        <span className="ml-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                          NEW
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
            
            <div 
              className="mt-6 text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
            
            <div className="mt-8 border-t border-b py-4">
              <div className="flex items-center mb-4">
                <span className="text-gray-700 mr-4">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <span className="text-lg">-</span>
                  </Button>
                  <span className="px-4 py-1 border-x min-w-[40px] text-center">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleQuantityChange(quantity + 1)}
                  >
                    <span className="text-lg">+</span>
                  </Button>
                </div>
                {(() => {
                  const stockInfo = getStockStatus(product.stock);
                  return (
                    <div className="ml-4">
                      <Badge className={`${stockInfo.color}`} variant="outline">
                        <Package className="h-3 w-3 mr-1" />
                        {stockInfo.text} ({product.stock} available)
                      </Badge>
                      {stockInfo.message && (
                        <p className="text-xs mt-1 text-gray-600">{stockInfo.message}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {product.stock > 0 ? (
                  <Button 
                    className="flex-1"
                    size="lg"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                  </Button>
                ) : (
                  <div className="w-full">
                    <StockNotificationForm 
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center">
                <Truck className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm">Delivering across India</span>
              </div>
              <div className="flex items-center">
                <RotateCcw className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm">No returns, refund only for dead-on-arrival plants</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm">3-5 working days for delivery</span>
              </div>
            </div>
            
            <Accordion type="single" collapsible className="mt-8">
              <AccordionItem value="details" className="border-b">
                <AccordionTrigger className="text-base font-medium py-4">Product Details</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                    <ul className="list-disc list-inside space-y-1">
                      <li>Category: {product.category?.name || 'N/A'}</li>
                      <li>Tags: {convertTagsToNames(product.tagDetails).join(', ')}</li>
                      {product.isNew && <li>New arrival</li>}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="shipping" className="border-b">
                <AccordionTrigger className="text-base font-medium py-4">Shipping & Returns</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Shipping</h4>
                      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-2 mt-2">
                        <li>Free shipping on orders more than ₹2000</li>
                        <li>It will take at least 3-5 working days to ship</li>
                        <li>Delivery charges:
                          <ul className="list-disc pl-5 space-y-1 mt-1">
                            <li>₹100 per kg for Karnataka</li>
                            <li>₹120 per kg for Andhra Pradesh, Kerala, Tamil Nadu</li>
                            <li>₹150 per kg for other places</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium">Returns & Refunds</h4>
                      <ul className="text-sm text-gray-600 list-disc pl-5 space-y-2 mt-2">
                        <li>No returns</li>
                        <li>Refund is only eligible when you receive the plants dead on arrival</li>
                        <li>Unboxing video is mandatory for refund</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="contact" className="border-b">
                <AccordionTrigger className="text-base font-medium py-4">Contact Us</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Get in Touch</h4>
                      <ul className="text-sm text-gray-600 space-y-2 mt-2">
                        <li><span className="font-medium">Email:</span> mahesh@aquaticexotica.com</li>
                        <li><span className="font-medium">Phone:</span> 8074751370</li>
                        <li><span className="font-medium">Address:</span> Balaji Nagar, Greamspet, Chittoor, Andhra Pradesh - 517002</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
        
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-heading font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: ApiProduct) => (
                <ProductCard key={`related-${relatedProduct.id}`} product={{
                  ...relatedProduct,
                  category: relatedProduct.category ? {
                    id: relatedProduct.category.id,
                    name: relatedProduct.category.name,
                    slug: relatedProduct.category.slug,
                    description: relatedProduct.category.description,
                    imageUrl: relatedProduct.category.imageUrl,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  } : {
                    id: 0,
                    name: 'Uncategorized',
                    slug: 'uncategorized',
                    description: null,
                    imageUrl: '',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  },
                  tags: convertTagsToNames(relatedProduct.tagDetails),
                  tagDetails: relatedProduct.tagDetails.map(tag => ({
                    id: tag.id,
                    name: tag.name,
                    slug: tag.name.toLowerCase().replace(/\s+/g, '-'),
                    isActive: true,
                    createdAt: tag.createdAt,
                    updatedAt: new Date().toISOString()
                  })),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" key={`edit-modal-${product.id}`}>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={editFormData.price || ''}
                    onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="compareAtPrice">Compare At Price</Label>
                  <Input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    value={editFormData.compareAtPrice || ''}
                    onChange={(e) => setEditFormData({...editFormData, compareAtPrice: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={editFormData.stock || ''}
                    onChange={(e) => setEditFormData({...editFormData, stock: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editFormData.rating || ''}
                    onChange={(e) => setEditFormData({...editFormData, rating: e.target.value})}
                    placeholder="0.0"
                  />
                </div>
              </div>
              
              {/* Category and Tags */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editFormData.categoryId?.toString() || ''}
                    onValueChange={(value) => setEditFormData({...editFormData, categoryId: parseInt(value) || 0})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={`category-${category.id}`} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Type tag name and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedTagIds.map((tagId) => {
                      const tag = tags.find((t: ApiTag) => t.id === tagId);
                      return tag ? (
                        <Badge key={`tag-${tagId}`} variant="secondary" className="flex items-center gap-1">
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tagId)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={editFormData.imageUrl || ''}
                    onChange={(e) => setEditFormData({...editFormData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    value={editFormData.thumbnailUrl || ''}
                    onChange={(e) => setEditFormData({...editFormData, thumbnailUrl: e.target.value})}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                placeholder="Enter product description"
                rows={4}
              />
            </div>
            
            {/* Product Flags */}
            <div className="space-y-4">
              <Label>Product Flags</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isNew"
                    checked={editFormData.isNew || false}
                    onCheckedChange={(checked) => setEditFormData({...editFormData, isNew: checked as boolean})}
                  />
                  <Label htmlFor="isNew">New</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSale"
                    checked={editFormData.isSale || false}
                    onCheckedChange={(checked) => setEditFormData({...editFormData, isSale: checked as boolean})}
                  />
                  <Label htmlFor="isSale">Sale</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={editFormData.isFeatured || false}
                    onCheckedChange={(checked) => setEditFormData({...editFormData, isFeatured: checked as boolean})}
                  />
                  <Label htmlFor="isFeatured">Featured</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isTrending"
                    checked={editFormData.isTrending || false}
                    onCheckedChange={(checked) => setEditFormData({...editFormData, isTrending: checked as boolean})}
                  />
                  <Label htmlFor="isTrending">Trending</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

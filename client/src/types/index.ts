// Product types
export interface Product {
  id: number;
  name: string;
  description: string;
  priceRange: string;
  // compareAtPrice: string;
  // discountPercentage: number;
  // stock: number;
  categories: Category[];
  tags: string[];
  tagDetails?: Tag[];
  rating: string;
  isActive: boolean;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  // isInStock: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
}

export interface InsertProduct {
  name: string;
  description: string;
  // price: string;
  compareAtPrice: string;
  // discountPercentage: number;
  // stock: number;
  categoryId: number;
  tags: string[];
  rating: string;
  isActive: boolean;
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  variants: Variant[];
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsertCategory {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string;
  isActive: boolean;
}

// Tag types
export interface Tag {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order types
export interface Order {
  id: number;
  user: number;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalAmount: string;
  shippingCost: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  price: string;
  totalPrice: number;
}

export interface ShippingAddress {
  id: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  isDefault: boolean;
}

// Cart types
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  // Optional variant id when item represents a specific product variant
  variantId?: number;
  // Optional variant name/description to display to user
  variantName?: string;
  // Optional maximum available stock for this cart item (used to cap quantity)
  maxStock?: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  count: number;
} 

export interface Variant {
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
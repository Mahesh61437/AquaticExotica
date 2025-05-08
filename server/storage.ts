import { 
  Product, InsertProduct, 
  Category, InsertCategory,
  User, InsertUser,
  Order, InsertOrder,
  users
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>; // Admin: Get all users

  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getTrendingProducts(): Promise<Product[]>;
  getNewProducts(): Promise<Product[]>;
  getSaleProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product>; // Admin: Update product
  deleteProduct(id: number): Promise<void>; // Admin: Delete product

  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getCategoryById(id: number): Promise<Category | undefined>; // Admin: Get category by ID
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Category>): Promise<Category>; // Admin: Update category
  deleteCategory(id: number): Promise<void>; // Admin: Delete category

  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>; // Admin: Get all orders
  updateOrderStatus(id: number, status: string): Promise<Order>; // Admin: Update order status
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private orders: Map<number, Order>;
  private userCurrentId: number;
  private productCurrentId: number;
  private categoryCurrentId: number;
  private orderCurrentId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.orders = new Map();
    this.userCurrentId = 1;
    this.productCurrentId = 1;
    this.categoryCurrentId = 1;
    this.orderCurrentId = 1;

    // Initialize with demo data
    this.initDemoData();
  }

  private initDemoData() {
    // Initialize categories
    const categories = [
      { 
        name: "Women", 
        slug: "women", 
        imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80" 
      },
      { 
        name: "Men", 
        slug: "men", 
        imageUrl: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80" 
      },
      { 
        name: "Accessories", 
        slug: "accessories", 
        imageUrl: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80" 
      },
      { 
        name: "Footwear", 
        slug: "footwear", 
        imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600&q=80" 
      }
    ];
    
    categories.forEach(cat => this.createCategory(cat as InsertCategory));

    // Initialize products
    const products: InsertProduct[] = [
      {
        name: "Denim Jacket",
        description: "Stylish denim jacket perfect for layering in all seasons.",
        price: "₹3,699",
        compareAtPrice: "₹4,999",
        imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Women",
        tags: ["jacket", "denim", "women"],
        rating: "4.0",
        isNew: false,
        isSale: true,
        isFeatured: true,
        isTrending: false,
        stock: 15
      },
      {
        name: "White Shirt",
        description: "Classic white button-up shirt for formal occasions.",
        price: "₹2,199",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Men",
        tags: ["shirt", "formal", "men"],
        rating: "4.5",
        isNew: false,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 25
      },
      {
        name: "Leather Bag",
        description: "Premium leather crossbody bag in tan color.",
        price: "129.50",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1591561954555-607968c989ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Accessories",
        tags: ["bag", "leather", "accessories"],
        rating: "5.0",
        isNew: true,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 10
      },
      {
        name: "Knit Sweater",
        description: "Casual knit sweater in neutral beige tone.",
        price: "65.00",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Women",
        tags: ["sweater", "knit", "women"],
        rating: "4.0",
        isNew: false,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 18
      },
      {
        name: "Sunglasses",
        description: "Designer sunglasses with dark frames.",
        price: "85.00",
        compareAtPrice: "110.00",
        imageUrl: "https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        category: "Accessories",
        tags: ["sunglasses", "accessories"],
        rating: "4.5",
        isNew: false,
        isSale: true,
        isFeatured: true,
        isTrending: false,
        stock: 22
      },
      {
        name: "White Sneakers",
        description: "Premium leather sneakers in white.",
        price: "95.00",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Footwear",
        tags: ["sneakers", "footwear", "men"],
        rating: "4.0",
        isNew: false,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 15
      },
      {
        name: "Leather Watch",
        description: "Classic wristwatch with leather strap.",
        price: "159.99",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Accessories",
        tags: ["watch", "accessories", "men"],
        rating: "5.0",
        isNew: true,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 8
      },
      {
        name: "Windbreaker Jacket",
        description: "Lightweight windbreaker jacket in navy blue.",
        price: "79.50",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=650&q=80",
        category: "Men",
        tags: ["jacket", "windbreaker", "men"],
        rating: "3.5",
        isNew: false,
        isSale: false,
        isFeatured: true,
        isTrending: false,
        stock: 12
      },
      {
        name: "Cashmere Sweater",
        description: "Premium cashmere sweater for ultimate comfort.",
        price: "120.00",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
        category: "Women",
        tags: ["sweater", "cashmere", "women"],
        rating: "5.0",
        isNew: false,
        isSale: false,
        isFeatured: false,
        isTrending: true,
        stock: 7
      },
      {
        name: "Leather Wallet",
        description: "High quality leather wallet with card compartments.",
        price: "55.00",
        compareAtPrice: null,
        imageUrl: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        category: "Accessories",
        tags: ["wallet", "leather", "accessories"],
        rating: "4.0",
        isNew: false,
        isSale: false,
        isFeatured: false,
        isTrending: true,
        stock: 20
      },
      {
        name: "Beanie Hat",
        description: "Knitted beanie hat in autumn colors.",
        price: "25.00",
        compareAtPrice: "35.00",
        imageUrl: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
        category: "Accessories",
        tags: ["hat", "beanie", "accessories"],
        rating: "3.5",
        isNew: false,
        isSale: true,
        isFeatured: false,
        isTrending: true,
        stock: 30
      },
      {
        name: "Silver Jewelry Set",
        description: "Set of silver minimalist jewelry pieces.",
        price: "89.99",
        compareAtPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
        category: "Accessories",
        tags: ["jewelry", "silver", "accessories"],
        rating: "4.5",
        isNew: false,
        isSale: false,
        isFeatured: false,
        isTrending: true,
        stock: 15
      }
    ];

    products.forEach(product => this.createProduct(product));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: false, // Default to non-admin user
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update the user with new data
    const updatedUser = { ...user, ...updates };
    
    // Ensure we don't overwrite the id
    updatedUser.id = id;
    
    // Save back to storage
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isFeatured
    );
  }

  async getTrendingProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isTrending
    );
  }

  async getNewProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isNew
    );
  }

  async getSaleProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.isSale
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      (product) => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery) ||
        product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productCurrentId++;
    
    // Ensure all boolean fields have default values if not provided
    const product: Product = { 
      ...insertProduct, 
      id,
      isNew: insertProduct.isNew ?? false,
      isSale: insertProduct.isSale ?? false,
      isFeatured: insertProduct.isFeatured ?? false,
      isTrending: insertProduct.isTrending ?? false,
      compareAtPrice: insertProduct.compareAtPrice ?? null
    };
    
    this.products.set(id, product);
    return product;
  }
  
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const product = await this.getProductById(id);
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Update the product with new data
    const updatedProduct = { ...product, ...updates };
    
    // Ensure we don't overwrite the id
    updatedProduct.id = id;
    
    // Save back to storage
    this.products.set(id, updatedProduct);
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<void> {
    const product = await this.getProductById(id);
    if (!product) {
      throw new Error("Product not found");
    }
    
    this.products.delete(id);
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug
    );
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error("Category not found");
    }
    
    // Update the category with new data
    const updatedCategory = { ...category, ...updates };
    
    // Ensure we don't overwrite the id
    updatedCategory.id = id;
    
    // Save back to storage
    this.categories.set(id, updatedCategory);
    
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<void> {
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error("Category not found");
    }
    
    this.categories.delete(id);
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    // Ensure userId is null if not provided
    const order: Order = { 
      ...insertOrder, 
      id, 
      userId: insertOrder.userId ?? null 
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = await this.getOrderById(id);
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Update only the status
    const updatedOrder = { ...order, status };
    
    // Save back to storage
    this.orders.set(id, updatedOrder);
    
    return updatedOrder;
  }
}

// Import and use the database storage implementation
import { DatabaseStorage } from "./database-storage";

// Comment out MemStorage for now since we're switching to database storage
// export const storage = new MemStorage();

// Use database storage instead
export const storage = new DatabaseStorage();

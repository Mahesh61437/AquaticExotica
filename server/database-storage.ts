import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  categories, type Category, type InsertCategory,
  orders, type Order, type InsertOrder
} from "@shared/schema";
import { db } from "./db";
import { eq, like, asc, desc } from "drizzle-orm";
import { IStorage } from "./storage";

// Database implementation of storage
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      password: users.password,
      fullName: users.fullName,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.email, email));
    
    if (user) {
      // Set isAdmin to false by default if not present
      return { ...user, isAdmin: false };
    }
    
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    // Ensure we don't try to update id
    const { id: _, ...updatesWithoutId } = updates;
    
    // Update the user
    const [updatedUser] = await db
      .update(users)
      .set(updatesWithoutId)
      .where(eq(users.id, id))
      .returning();
      
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isFeatured, true));
  }

  async getTrendingProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isTrending, true));
  }

  async getNewProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isNew, true));
  }

  async getSaleProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isSale, true));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db.select().from(products).where(
      like(products.name, `%${query}%`)
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }
  
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    // Ensure we don't try to update id
    const { id: _, ...updatesWithoutId } = updates;
    
    // Update the product
    const [updatedProduct] = await db
      .update(products)
      .set(updatesWithoutId)
      .where(eq(products.id, id))
      .returning();
      
    if (!updatedProduct) {
      throw new Error("Product not found");
    }
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<void> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
      
    // If delete operation did not affect any rows, the product does not exist
    if (!result) {
      throw new Error("Product not found");
    }
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }
  
  async updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
    // Ensure we don't try to update id
    const { id: _, ...updatesWithoutId } = updates;
    
    // Update the category
    const [updatedCategory] = await db
      .update(categories)
      .set(updatesWithoutId)
      .where(eq(categories.id, id))
      .returning();
      
    if (!updatedCategory) {
      throw new Error("Category not found");
    }
    
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<void> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));
      
    // If delete operation did not affect any rows, the category does not exist
    if (!result) {
      throw new Error("Category not found");
    }
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }
  
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
      
    if (!updatedOrder) {
      throw new Error("Order not found");
    }
    
    return updatedOrder;
  }
}
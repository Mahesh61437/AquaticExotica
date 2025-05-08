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
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      password: users.password,
      fullName: users.fullName,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, id));
    
    if (user) {
      // Set isAdmin to false by default if not present
      return { ...user, isAdmin: false };
    }
    
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Import at function level to avoid circular dependencies
      const { getUserByUsernameViaSQL } = await import('./db-utils');
      
      const user = await getUserByUsernameViaSQL(username);
      return user || undefined;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Import at function level to avoid circular dependencies
      const { getUserByEmailViaSQL } = await import('./db-utils');
      
      const user = await getUserByEmailViaSQL(email);
      return user || undefined;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Import at function level to avoid circular dependencies
    const { createUserViaSQL } = await import('./db-utils');
    
    // Use our SQL utility function
    const user = await createUserViaSQL(
      insertUser.username,
      insertUser.email,
      insertUser.password,
      insertUser.fullName,
      insertUser.isAdmin || false
    );
    
    if (!user) {
      throw new Error("Failed to create user");
    }
    
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      // Use a raw SQL query to update the user
      const fields = [];
      const values = [];
      const params = [];
      let paramIndex = 1;
      
      if (updates.username !== undefined) {
        fields.push('username = $' + paramIndex);
        values.push(updates.username);
        params.push(`$${paramIndex++}`);
      }
      
      if (updates.email !== undefined) {
        fields.push('email = $' + paramIndex);
        values.push(updates.email);
        params.push(`$${paramIndex++}`);
      }
      
      if (updates.password !== undefined) {
        fields.push('password = $' + paramIndex);
        values.push(updates.password);
        params.push(`$${paramIndex++}`);
      }
      
      if (updates.fullName !== undefined) {
        fields.push('full_name = $' + paramIndex);
        values.push(updates.fullName);
        params.push(`$${paramIndex++}`);
      }
      
      if (updates.isAdmin !== undefined) {
        fields.push('is_admin = $' + paramIndex);
        values.push(updates.isAdmin);
        params.push(`$${paramIndex++}`);
      }
      
      if (fields.length === 0) {
        throw new Error("No valid fields provided for update");
      }
      
      const query = `
        UPDATE users 
        SET ${fields.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING id, username, email, password, full_name, created_at, is_admin
      `;
      
      const result = await db.execute<{
        id: number;
        username: string;
        email: string;
        password: string;
        full_name: string;
        created_at: Date;
        is_admin: boolean;
      }>(query, [...values, id]);
      
      if (result.rows.length === 0) {
        throw new Error("User not found");
      }
      
      const user = result.rows[0];
      
      // Transform the database fields to the application format
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        fullName: user.full_name,
        createdAt: user.created_at,
        isAdmin: user.is_admin
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    // Use raw SQL query to get all fields from the database
    const result = await db.execute(
      'SELECT id, username, email, password, full_name, created_at, is_admin FROM users'
    );
    const usersList = result.rows as any[];
    
    // Map the snake_case fields to camelCase for each user
    return usersList.map(dbUser => ({
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password,
      fullName: dbUser.full_name,
      createdAt: dbUser.created_at,
      isAdmin: dbUser.is_admin || false
    }));
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
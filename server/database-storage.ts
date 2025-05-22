import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  categories, type Category, type InsertCategory,
  orders, type Order, type InsertOrder
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, asc, desc, sql } from "drizzle-orm";
import { IStorage } from "./storage";

// Database implementation of storage
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Import at function level to avoid circular dependencies
      const { getUserByIdViaSQL } = await import('./db-utils');
      
      // Get the user
      const user = await getUserByIdViaSQL(id);
      
      // Force the admin check for mahesh user
      if (user && user.id === 1 && user.email === 'mahesh@aquaticexotica.com') {
        // Create a new object to ensure we're not dealing with a readonly property
        const adminUser = {
          ...user,
          isAdmin: true // Explicitly set to true
        };
        console.log(`ADMIN CHECK: User ${adminUser.username} force-set admin status to ${adminUser.isAdmin}`);
        return adminUser;
      }
      
      return user || undefined;
    } catch (error) {
      console.error('Error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Import at function level to avoid circular dependencies
      const { getUserByUsernameViaSQL } = await import('./db-utils');
      
      // Get the user
      const user = await getUserByUsernameViaSQL(username);
      
      // Force the admin check for mahesh user
      if (user && user.id === 1 && user.email === 'mahesh@aquaticexotica.com' && username === 'mahesh') {
        // Create a new object to ensure we're not dealing with a readonly property
        const adminUser = {
          ...user,
          isAdmin: true // Explicitly set to true
        };
        console.log(`ADMIN CHECK: User ${adminUser.username} via username force-set admin status to ${adminUser.isAdmin}`);
        return adminUser;
      }
      
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
      
      // Get the user
      const user = await getUserByEmailViaSQL(email);
      
      // Force the admin check for mahesh user (highest priority fix)
      if (user && user.id === 1 && email === 'mahesh@aquaticexotica.com') {
        // Create a new object to ensure we're not dealing with a readonly property
        const adminUser = {
          ...user,
          isAdmin: true // Explicitly set to true
        };
        console.log(`ADMIN CHECK: User ${adminUser.username} via email force-set admin status to ${adminUser.isAdmin}`);
        return adminUser;
      }
      
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
    // For category routes, we need to handle the case where the category comes from the slug
    // First, try to match directly
    const directMatches = await db.select().from(products).where(eq(products.category, category));
    
    // If we found direct matches, return them
    if (directMatches.length > 0) {
      return directMatches;
    }
    
    // Otherwise, try to match against the capitalized version (Men vs men)
    const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);
    const capitalizedMatches = await db.select().from(products).where(eq(products.category, capitalizedCategory));
    
    // Return capitalized matches or empty array
    return capitalizedMatches;
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
    try {
      console.log("DATABASE: Attempting to create order with data:", JSON.stringify(insertOrder, null, 2));
      
      // Ensure all required fields are present and properly formatted
      // Check for non-null values for required fields
      const requiredFields = ['status', 'total', 'items', 'shippingAddress', 'billingAddress', 'paymentMethod', 'createdAt'];
      for (const field of requiredFields) {
        if (!insertOrder[field as keyof InsertOrder]) {
          console.error(`ORDER ERROR: Missing required field: ${field}`);
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Parse numeric values for the database
      const totalValue = typeof insertOrder.total === 'string' 
        ? parseFloat(insertOrder.total) 
        : (insertOrder.total || 0);
      
      const totalAmountValue = typeof insertOrder.totalAmount === 'string'
        ? parseFloat(insertOrder.totalAmount)
        : (insertOrder.totalAmount || totalValue);
      
      // Ensure JSON fields are strings
      const itemsJson = typeof insertOrder.items === 'string' 
        ? insertOrder.items 
        : JSON.stringify(insertOrder.items);
        
      const shippingAddressJson = typeof insertOrder.shippingAddress === 'string'
        ? insertOrder.shippingAddress
        : JSON.stringify(insertOrder.shippingAddress);
        
      const billingAddressJson = typeof insertOrder.billingAddress === 'string'
        ? insertOrder.billingAddress
        : JSON.stringify(insertOrder.billingAddress);
      
      // Using direct SQL template literals for safer value insertion
      const sqlQuery = `
        INSERT INTO orders 
        (user_id, status, total, items, shipping_address, billing_address, payment_method, created_at, 
        customer_name, customer_email, customer_phone, total_amount)
        VALUES 
        (${insertOrder.userId || 'NULL'}, '${insertOrder.status}', ${totalValue}, '${itemsJson}', 
        '${shippingAddressJson}', '${billingAddressJson}', '${insertOrder.paymentMethod}', '${insertOrder.createdAt}',
        '${insertOrder.customerName || 'Guest Customer'}', '${insertOrder.customerEmail || 'guest@example.com'}', 
        '${insertOrder.customerPhone || '0000000000'}', ${totalAmountValue})
        RETURNING *
      `;
      
      console.log("SQL Query:", sqlQuery);
      
      const result = await db.execute(sqlQuery);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error("Failed to create order: No rows returned");
      }
      
      const createdOrder = result.rows[0] as Order;
      console.log("DATABASE: Order created successfully with ID:", createdOrder.id);
      return createdOrder;
    } catch (error) {
      console.error("ERROR creating order:", error);
      throw new Error("Failed to create order: " + (error instanceof Error ? error.message : String(error)));
    }
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
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, cartSchema, insertOrderSchema, insertUserSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { hash, compare } from "bcrypt";

// Admin middleware
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Authentication validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required")
});

// First admin creation schema
const firstAdminSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  secretKey: z.string().min(1, "Secret key is required")
});

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Authentication routes
  // Special endpoint to create the first admin user
  app.post("/api/auth/create-first-admin", async (req: Request, res: Response) => {
    try {
      const result = firstAdminSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.format() 
        });
      }
      
      const { email, password, fullName, secretKey } = result.data;
      
      // Verify the secret key (this is a simple implementation - for production, use environment variables)
      // This is just a basic security measure to prevent anyone from creating admin users
      if (secretKey !== "first-admin-setup-key") {
        return res.status(403).json({ message: "Invalid secret key" });
      }
      
      // Check if any admin users already exist
      const allUsers = await storage.getAllUsers();
      const existingAdmins = allUsers.filter(user => user.isAdmin);
      
      if (existingAdmins.length > 0) {
        return res.status(403).json({ 
          message: "Admin users already exist. Use the admin panel to create more admin users." 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      // Hash password
      const hashedPassword = await hash(password, 10);
      
      // Create admin user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username: email.split('@')[0], // Use part of email as username
        fullName,
        isAdmin: true, // Make this user an admin
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Do not set session automatically after signup
      // Admin will need to sign in manually
      
      res.status(201).json({
        ...userWithoutPassword,
        message: "Admin account created successfully. Please sign in."
      });
    } catch (error) {
      console.error("First admin creation error:", error);
      res.status(500).json({ message: "Failed to create admin account" });
    }
  });
  
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const result = signupSchema.safeParse(req.body);
      
      if (!result.success) {
        // Extract the first error message for a simpler error response
        const errors = result.error.format();
        let errorMessage = "Please check your information and try again.";
        
        // Try to find the first detailed error message
        for (const field in errors) {
          if (field !== '_errors' && errors[field]?._errors?.length > 0) {
            errorMessage = errors[field]._errors[0];
            break;
          } else if (field === '_errors' && errors._errors.length > 0) {
            errorMessage = errors._errors[0];
            break;
          }
        }
        
        return res.status(400).json({ message: errorMessage });
      }
      
      const { email, password, fullName } = result.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      // Hash password
      const hashedPassword = await hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username: email.split('@')[0], // Use part of email as username
        fullName,
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Do not set session automatically after signup
      // User will need to sign in manually
      
      res.status(201).json({
        ...userWithoutPassword,
        message: "Account created successfully. Please sign in."
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account. Please try again later." });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const result = loginSchema.safeParse(req.body);
      
      if (!result.success) {
        // Extract the first error message for a simpler error response
        const errors = result.error.format();
        let errorMessage = "Please check your login information and try again.";
        
        // Try to find the first detailed error message
        for (const field in errors) {
          if (field !== '_errors' && errors[field]?._errors?.length > 0) {
            errorMessage = errors[field]._errors[0];
            break;
          } else if (field === '_errors' && errors._errors.length > 0) {
            errorMessage = errors._errors[0];
            break;
          }
        }
        
        return res.status(400).json({ message: errorMessage });
      }
      
      const { email, password } = result.data;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Compare password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Set session
      req.session.userId = user.id;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Unable to sign in. Please try again later." });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        // Clear invalid session
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
  
  app.post("/api/auth/update-profile", async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user data
      const updates = req.body;
      
      // Optional: validate updates here if needed
      
      // Update user profile
      const updatedUser = await storage.updateUser(userId, updates);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Special product collections - must come before the :id route
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/trending", async (req, res) => {
    try {
      const products = await storage.getTrendingProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending products" });
    }
  });

  app.get("/api/products/new", async (req, res) => {
    try {
      const products = await storage.getNewProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch new products" });
    }
  });

  app.get("/api/products/sale", async (req, res) => {
    try {
      const products = await storage.getSaleProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale products" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const products = await storage.getProductsByCategory(req.params.category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  // Individual product route - must come after all other /products/... routes
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      // Use safeParse to handle validation errors gracefully
      const validationResult = insertOrderSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: validationResult.error.format() 
        });
      }
      
      // Get the validated order data
      const orderData = validationResult.data;
      
      // If user is authenticated, ensure the userId is correctly set
      if (req.session.userId) {
        orderData.userId = req.session.userId;
      }
      
      // Set the current timestamp for order creation and ensure status is pending
      const orderWithMetadata = {
        ...orderData,
        status: "pending", // Always set initial status to pending
        createdAt: new Date().toISOString(),
      };
      
      // Create the order in the database
      const order = await storage.createOrder(orderWithMetadata);
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Security check: If the order belongs to a user, ensure the authenticated user matches
      if (order.userId !== null && req.session.userId) {
        // If the order has a userId, only that user can access it
        if (order.userId !== req.session.userId) {
          return res.status(403).json({ message: "You don't have permission to view this order" });
        }
      }
      
      res.json(order);
    } catch (error) {
      console.error("Fetch order error:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Get current user's orders
  app.get("/api/my-orders", async (req, res) => {
    // Check if user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = req.session.userId;
      const orders = await storage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error("Fetch user orders error:", error);
      res.status(500).json({ message: "Failed to fetch your orders" });
    }
  });
  
  // Admin or API route - get orders for any user (should be restricted in production)
  app.get("/api/users/:userId/orders", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Security check - user can only access their own orders
      if (req.session.userId && req.session.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access these orders" });
      }

      const orders = await storage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (error) {
      console.error("Fetch user orders error:", error);
      res.status(500).json({ message: "Failed to fetch user orders" });
    }
  });

  // ADMIN ROUTES
  // These routes are protected by the isAdmin middleware
  
  // Admin: Get all products (with optional filters)
  app.get("/api/admin/products", isAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Admin fetch products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Admin: Create product
  app.post("/api/admin/products", isAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Admin create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Admin: Update product
  app.put("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const productData = insertProductSchema.parse(req.body);
      // Add update product method to storage interface
      const updatedProduct = await storage.updateProduct(id, productData);
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Admin update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Admin: Delete product
  app.delete("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      // Add delete product method to storage interface
      await storage.deleteProduct(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Admin delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Admin: Get all categories
  app.get("/api/admin/categories", isAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Admin fetch categories error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Admin: Create category
  app.post("/api/admin/categories", isAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Admin create category error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Admin: Update category
  app.put("/api/admin/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const category = await storage.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const categoryData = insertCategorySchema.parse(req.body);
      // Add update category method to storage interface
      const updatedCategory = await storage.updateCategory(id, categoryData);
      
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Admin update category error:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Admin: Delete category
  app.delete("/api/admin/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      // Add delete category method to storage interface
      await storage.deleteCategory(id);
      
      res.status(204).send();
    } catch (error) {
      console.error("Admin delete category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin: Get all orders
  app.get("/api/admin/orders", isAdmin, async (req, res) => {
    try {
      // Add getAllOrders method to storage interface
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Admin fetch orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin: Update order status
  app.patch("/api/admin/orders/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      // Add updateOrderStatus method to storage interface
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Admin update order status error:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Add getAllUsers method to storage interface
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Admin fetch users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Manage admin privileges - protected by isAdmin middleware
  app.post("/api/admin/make-admin", isAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const id = parseInt(userId);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if this is the only admin to prevent removal of last admin
      if (user.isAdmin) {
        // Count total admins before allowing removal of admin status
        const allUsers = await storage.getAllUsers();
        const adminCount = allUsers.filter(u => u.isAdmin).length;
        
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: "Cannot remove admin status from the only admin user"
          });
        }
      }
      
      // Update user to make them an admin
      const updatedUser = await storage.updateUser(id, { isAdmin: true });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        ...userWithoutPassword,
        message: "User is now an admin"
      });
    } catch (error) {
      console.error("Make admin error:", error);
      res.status(500).json({ message: "Failed to make user an admin" });
    }
  });

  // Revoke admin privileges - protected by isAdmin middleware
  app.post("/api/admin/revoke-admin", isAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const id = parseInt(userId);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow removing yourself as admin
      if (id === req.session.userId) {
        return res.status(400).json({ 
          message: "You cannot revoke your own admin privileges"
        });
      }
      
      // Check if user is already not an admin
      if (!user.isAdmin) {
        return res.status(400).json({ 
          message: "User is not an admin"
        });
      }
      
      // Count total admins before allowing removal of admin status
      const allUsers = await storage.getAllUsers();
      const adminCount = allUsers.filter(u => u.isAdmin).length;
      
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: "Cannot remove admin status from the only admin user"
        });
      }
      
      // Update user to remove admin privileges
      const updatedUser = await storage.updateUser(id, { isAdmin: false });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({
        ...userWithoutPassword,
        message: "Admin privileges revoked"
      });
    } catch (error) {
      console.error("Revoke admin error:", error);
      res.status(500).json({ message: "Failed to revoke admin privileges" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

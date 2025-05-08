import { pgTable, text, serial, integer, boolean, decimal, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping the existing schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull(),
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull(),
  isNew: boolean("is_new").default(false).notNull(),
  isSale: boolean("is_sale").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isTrending: boolean("is_trending").default(false).notNull(),
  stock: integer("stock").notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  status: text("status").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items").notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  billingAddress: jsonb("billing_address").notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
});

// Cart items schema (for validation)
export const cartItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  imageUrl: z.string(),
  quantity: z.number().positive(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  count: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;

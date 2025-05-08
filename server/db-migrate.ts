import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";
import * as schema from "../shared/schema";

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  neonConfig.webSocketConstructor = ws;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  console.log("Running database schema migration...");
  
  try {
    // Create tables directly based on schema using raw SQL with the pool
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        compare_at_price DECIMAL(10, 2),
        image_url TEXT NOT NULL,
        category TEXT NOT NULL,
        tags TEXT[] NOT NULL,
        rating DECIMAL(3, 1) NOT NULL,
        is_new BOOLEAN NOT NULL DEFAULT FALSE,
        is_sale BOOLEAN NOT NULL DEFAULT FALSE,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_trending BOOLEAN NOT NULL DEFAULT FALSE,
        stock INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        image_url TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        items JSONB NOT NULL,
        shipping_address JSONB NOT NULL,
        billing_address JSONB NOT NULL,
        payment_method TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    
    console.log("Database schema migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Export the function for use in other modules
export { runMigration };
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure for WebSocket support
neonConfig.webSocketConstructor = ws;

/**
 * Database connection configuration
 * 
 * You can configure the database connection using environment variables:
 * 
 * DATABASE_URL - The full connection string (takes precedence if set)
 * 
 * Or individual components:
 * DB_HOST - The database host
 * DB_PORT - The database port
 * DB_USER - The database user
 * DB_PASSWORD - The database password
 * DB_NAME - The database name
 * DB_SSL - Whether to use SSL (true/false)
 */

function getConnectionString(): string {
  // If DATABASE_URL is provided, use it directly
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Otherwise, try to construct from individual components
  const host = process.env.DB_HOST || process.env.PGHOST;
  const port = process.env.DB_PORT || process.env.PGPORT || '5432';
  const user = process.env.DB_USER || process.env.PGUSER;
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD;
  const database = process.env.DB_NAME || process.env.PGDATABASE;
  const ssl = process.env.DB_SSL?.toLowerCase() === 'true' || true; // Default to true
  
  // Check if we have enough information to construct a connection string
  if (host && user && password && database) {
    const sslParam = ssl ? '?sslmode=require' : '';
    return `postgres://${user}:${password}@${host}:${port}/${database}${sslParam}`;
  }
  
  // If we get here, we don't have a valid connection string
  throw new Error(
    "Database connection information is incomplete. Please provide either DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME."
  );
}

// Get connection string and create the pool
const connectionString = getConnectionString();
console.log(`Connecting to database at ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
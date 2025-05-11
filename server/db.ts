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
  // Try to use the custom database URL first (prioritize AP region connection)
  const customDbUrl = "postgresql://aquaticadmin:npg_qPIdr6Ag7snK@ep-shrill-lake-a1e9dvdn-pooler.ap-southeast-1.aws.neon.tech/aquaticexotica?sslmode=require";
  
  // If DATABASE_URL is provided, use it as fallback
  if (process.env.DATABASE_URL) {
    // Check if it's the AP region connection we want
    if (process.env.DATABASE_URL === customDbUrl || 
        process.env.DATABASE_URL.includes("ap-southeast-1")) {
      return process.env.DATABASE_URL;
    }
    
    // If DATABASE_URL is set but is not the AP region, prefer custom URL
    if (process.env.USE_PROVIDED_DB === "true") {
      console.log("Using provided DATABASE_URL environment variable");
      return process.env.DATABASE_URL;
    }
    
    console.log("Using custom AP region database connection instead of environment DATABASE_URL");
    return customDbUrl;
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
  
  // If we get here, use the custom database URL
  console.log("No valid database connection information found, using custom AP region database");
  return customDbUrl;
}

// Get connection string and create the pool
const connectionString = getConnectionString();
console.log(`Connecting to database at ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
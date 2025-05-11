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
  // Always use the AP region connection for consistency
  const apDbUrl = "postgresql://aquaticadmin:npg_qPIdr6Ag7snK@ep-shrill-lake-a1e9dvdn-pooler.ap-southeast-1.aws.neon.tech/aquaticexotica?sslmode=require";
  
  console.log("Using Asia Pacific region database connection");
  return apDbUrl;
}

// Get connection string and create the pool
const connectionString = getConnectionString();
console.log(`Connecting to database at ${connectionString.replace(/:[^:@]+@/, ':***@')}`);

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
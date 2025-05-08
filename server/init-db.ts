import { db } from './db';
import { createUserViaSQL } from './db-utils';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function initializeDatabase() {
  try {
    // Check if the database already has users
    const countResult = await db.execute<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const count = parseInt(countResult.rows[0].count.toString(), 10);
    
    if (count > 0) {
      console.log("Database already contains data, skipping initialization.");
      return;
    }
    
    console.log("Creating initial admin user...");
    
    // Create admin user
    const hashedPassword = await hashPassword("admin123");
    const adminUser = await createUserViaSQL(
      "admin",
      "admin@example.com",
      hashedPassword,
      "Admin User",
      true
    );
    
    if (adminUser) {
      console.log("Created admin user:", adminUser.email);
    }
    
    console.log("Database initialization completed.");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Execute the function if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error initializing database:', error);
      process.exit(1);
    });
}
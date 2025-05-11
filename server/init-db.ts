import { db } from './db';
import { createUserViaSQL } from './db-utils';
import { hash } from 'bcrypt';

// Use bcrypt for hashing to match the comparison method in routes.ts
async function hashPassword(password: string) {
  // Use bcrypt with 10 rounds of salting (standard recommended value)
  return await hash(password, 10);
}

export async function initializeDatabase() {
  try {
    // Check if the database already has users
    const countResult = await db.execute('SELECT COUNT(*) as count FROM users');
    const countValue = countResult.rows && countResult.rows[0] ? 
                      (countResult.rows[0] as { count: string | number }).count : "0";
    const count = parseInt(countValue.toString(), 10);
    
    if (count > 0) {
      console.log("Database already contains users, checking for admin user...");
      
      // Check if there's at least one admin user
      const adminCheckResult = await db.execute(`
        SELECT COUNT(*) as count FROM users WHERE is_admin = TRUE
      `).catch(err => {
        console.log("Could not check for admin users, assuming none exist:", err.message);
        return { rows: [{ count: "0" }] };
      });
      
      const countValue = adminCheckResult.rows && adminCheckResult.rows[0] ? 
                        (adminCheckResult.rows[0] as { count: string | number }).count : "0";
      const adminCount = parseInt(countValue.toString(), 10);
      
      if (adminCount === 0) {
        console.log("No admin users found, creating default admin...");
        // Create admin user with the specified credentials
        const hashedPassword = await hashPassword("Mahesh61437");
        const adminUser = await createUserViaSQL(
          "mahesh",
          "mahesh@aquaticexotica.com",
          hashedPassword,
          "mahesh",
          true
        );
        
        if (adminUser) {
          console.log("Created admin user:", adminUser.email);
        }
      } else {
        console.log(`Found ${adminCount} admin users, skipping admin creation.`);
      }
      
      return;
    }
    
    console.log("Database has no users, creating initial admin user...");
    
    // Create admin user with the specified credentials
    const hashedPassword = await hashPassword("Mahesh61437");
    const adminUser = await createUserViaSQL(
      "mahesh",
      "mahesh@aquaticexotica.com",
      hashedPassword,
      "mahesh",
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
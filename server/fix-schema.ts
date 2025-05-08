import { db, pool } from "./db";

async function fixSchema() {
  try {
    console.log("Starting database schema fix...");
    
    // Check if is_admin column exists in users table
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `);
    
    if (checkResult.rowCount === 0) {
      console.log("Missing 'is_admin' column detected, adding it now...");
      
      // Add is_admin column if it doesn't exist
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false
      `);
      
      console.log("Added 'is_admin' column to users table successfully");
    } else {
      console.log("The 'is_admin' column already exists, no action needed");
    }
    
    console.log("Database schema fix completed successfully!");
  } catch (error) {
    console.error("Error fixing database schema:", error);
  } finally {
    await pool.end();
  }
}

fixSchema().then(() => {
  console.log("Schema fix process completed");
});
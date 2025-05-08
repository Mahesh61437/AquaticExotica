import { db } from './db';

// Function to check and fix the database schema
export async function fixSchema() {
  console.log('Checking and fixing database schema...');
  
  try {
    // Check if is_admin column exists in users table
    const userColumns = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columnNames = userColumns.rows.map(row => row.column_name);
    
    // Add is_admin column if it doesn't exist
    if (!columnNames.includes('is_admin')) {
      console.log('Adding is_admin column to users table...');
      await db.execute(`
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log('Added is_admin column to users table');
    }
    
    console.log('Database schema check completed successfully');
  } catch (error) {
    console.error('Error fixing database schema:', error);
    throw error;
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  fixSchema()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error fixing schema:', error);
      process.exit(1);
    });
}
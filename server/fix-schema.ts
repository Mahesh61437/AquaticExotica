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
    
    const userColumnNames = userColumns.rows.map(row => row.column_name);
    
    // Add is_admin column if it doesn't exist
    if (!userColumnNames.includes('is_admin')) {
      console.log('Adding is_admin column to users table...');
      await db.execute(`
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log('Added is_admin column to users table');
    }
    
    // Check if customer columns exist in orders table
    const orderColumns = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    
    const orderColumnNames = orderColumns.rows.map(row => row.column_name);
    
    // Add customer_name column if it doesn't exist
    if (!orderColumnNames.includes('customer_name')) {
      console.log('Adding customer_name column to orders table...');
      await db.execute(`
        ALTER TABLE orders ADD COLUMN customer_name TEXT
      `);
      console.log('Added customer_name column to orders table');
    }
    
    // Add customer_email column if it doesn't exist
    if (!orderColumnNames.includes('customer_email')) {
      console.log('Adding customer_email column to orders table...');
      await db.execute(`
        ALTER TABLE orders ADD COLUMN customer_email TEXT
      `);
      console.log('Added customer_email column to orders table');
    }
    
    // Add customer_phone column if it doesn't exist
    if (!orderColumnNames.includes('customer_phone')) {
      console.log('Adding customer_phone column to orders table...');
      await db.execute(`
        ALTER TABLE orders ADD COLUMN customer_phone TEXT
      `);
      console.log('Added customer_phone column to orders table');
    }
    
    // Add total_amount column if it doesn't exist
    if (!orderColumnNames.includes('total_amount')) {
      console.log('Adding total_amount column to orders table...');
      await db.execute(`
        ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10, 2)
      `);
      console.log('Added total_amount column to orders table');
    }
    
    console.log('Database schema check completed successfully');
  } catch (error) {
    console.error('Error fixing database schema:', error);
    throw error;
  }
}

// Execute the function if this script is run directly
// Using ESM approach which is different from CommonJS require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  fixSchema()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error fixing schema:', error);
      process.exit(1);
    });
}
import { db } from './db';

// Function to check and fix the database schema
export async function fixSchema() {
  console.log('Checking and fixing database schema...');
  
  try {
    // Check if table 'users' exists
    const tableExists = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Database tables do not exist yet, skipping schema fixes...');
      return;
    }
    
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
    
    // Check if table 'orders' exists
    const ordersTableExists = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);
    
    if (!ordersTableExists.rows[0].exists) {
      console.log('Orders table does not exist yet, skipping order schema fixes...');
      return;
    }
    
    // Check if customer columns exist in orders table
    const orderColumns = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    
    const orderColumnNames = orderColumns.rows.map(row => row.column_name);
    
    // Perform a direct add of all missing columns at once to improve reliability
    let alterTableCommands = [];
    
    if (!orderColumnNames.includes('customer_name')) {
      alterTableCommands.push('ADD COLUMN customer_name TEXT');
    }
    
    if (!orderColumnNames.includes('customer_email')) {
      alterTableCommands.push('ADD COLUMN customer_email TEXT');
    }
    
    if (!orderColumnNames.includes('customer_phone')) {
      alterTableCommands.push('ADD COLUMN customer_phone TEXT');
    }
    
    if (!orderColumnNames.includes('total_amount')) {
      alterTableCommands.push('ADD COLUMN total_amount DECIMAL(10, 2)');
    }
    
    if (alterTableCommands.length > 0) {
      console.log('Adding missing columns to orders table...');
      const alterTableQuery = `ALTER TABLE orders ${alterTableCommands.join(', ')}`;
      console.log('SQL Query:', alterTableQuery);
      await db.execute(alterTableQuery);
      console.log('Added missing columns to orders table');
    }
    
    console.log('Database schema check completed successfully');
  } catch (error) {
    // Log but don't crash the server - continue execution
    console.error('Error fixing database schema:', error);
    
    // Check if it's a column already exists error
    if (error instanceof Error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('already exists')) {
        console.log('Column already exists, continuing...');
        return; // Don't rethrow
      }
    }
    
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fixSchema()
    // .then(() => process.exit(0))
    .catch(error => {
      console.error('Error fixing schema:', error);
      // process.exit(1);
    });
}
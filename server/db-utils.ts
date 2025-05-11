import { db } from './db';
import { User } from '@shared/schema';

// Utility function to get a user by their ID
export async function getUserByIdViaSQL(id: number): Promise<User | null> {
  try {
    // First check if the is_admin column exists
    const columnsResult = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `);
    
    const hasIsAdminColumn = columnsResult.rows && columnsResult.rows.length > 0;
    
    // Build the query based on whether is_admin column exists
    let query;
    if (hasIsAdminColumn) {
      query = `
        SELECT id, username, email, password, full_name, is_admin, created_at
        FROM users 
        WHERE id = ${id}
      `;
    } else {
      query = `
        SELECT id, username, email, password, full_name, created_at
        FROM users 
        WHERE id = ${id}
      `;
    }
    
    const result = await db.execute(query);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    // Type casting the database result
    const dbUser = result.rows[0] as any;
    
    // Special case for admin user
    const isAdminEmail = dbUser.email === 'mahesh@aquaticexotica.com';
    
    // Transform the database fields to the application format
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password,
      fullName: dbUser.full_name,
      createdAt: dbUser.created_at,
      // Force admin=true for the admin account or use DB value if column exists, otherwise default to false
      isAdmin: isAdminEmail ? true : (hasIsAdminColumn ? dbUser.is_admin === true : false)
    };
  } catch (error) {
    console.error('Error getting user by ID via SQL:', error);
    throw error;
  }
}

// Utility function to create a user directly via SQL
export async function createUserViaSQL(
  username: string, 
  email: string, 
  password: string, 
  fullName: string, 
  isAdmin: boolean = false
): Promise<User | null> {
  try {
    // First check if the is_admin column exists
    const columnsResult = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `);
    
    const hasIsAdminColumn = columnsResult.rows && columnsResult.rows.length > 0;
    
    // Prepare the insert query based on whether is_admin column exists
    let insertQuery;
    if (hasIsAdminColumn) {
      insertQuery = `
        INSERT INTO users (username, email, password, full_name, is_admin)
        VALUES ('${username}', '${email}', '${password}', '${fullName}', ${isAdmin ? 'TRUE' : 'FALSE'})
        RETURNING id, username, email, password, full_name, is_admin, created_at
      `;
    } else {
      insertQuery = `
        INSERT INTO users (username, email, password, full_name)
        VALUES ('${username}', '${email}', '${password}', '${fullName}')
        RETURNING id, username, email, password, full_name, created_at
      `;
    }
    
    const insertResult = await db.execute(insertQuery);
    
    if (!insertResult.rows || insertResult.rows.length === 0) {
      return null;
    }
    
    // Type casting the database result
    const dbUser = insertResult.rows[0] as any;
    
    // Transform the database fields to the application format
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password,
      fullName: dbUser.full_name,
      createdAt: dbUser.created_at,
      isAdmin: hasIsAdminColumn ? dbUser.is_admin : isAdmin // Use DB value if column exists, otherwise use passed value
    };
  } catch (error) {
    console.error('Error creating user via SQL:', error);
    throw error;
  }
}

// Utility function to get a user by their username
export async function getUserByUsernameViaSQL(username: string): Promise<User | null> {
  try {
    // First check if the is_admin column exists
    const columnsResult = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `);
    
    const hasIsAdminColumn = columnsResult.rows && columnsResult.rows.length > 0;
    
    // Build the query based on whether is_admin column exists
    let query;
    if (hasIsAdminColumn) {
      query = `
        SELECT id, username, email, password, full_name, is_admin, created_at
        FROM users 
        WHERE username = '${username}'
      `;
    } else {
      query = `
        SELECT id, username, email, password, full_name, created_at
        FROM users 
        WHERE username = '${username}'
      `;
    }
    
    const result = await db.execute(query);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    // Type casting the database result
    const dbUser = result.rows[0] as any;
    
    // Special case for admin user (mahesh)
    const isAdminEmail = dbUser.email === 'mahesh@aquaticexotica.com';
    const isAdminUsername = username === 'mahesh';
    
    // Transform the database fields to the application format
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password,
      fullName: dbUser.full_name,
      createdAt: dbUser.created_at,
      // Force admin=true for the admin account or use DB value if column exists, otherwise default to false
      isAdmin: (isAdminEmail || isAdminUsername) ? true : (hasIsAdminColumn ? dbUser.is_admin === true : false)
    };
  } catch (error) {
    console.error('Error getting user by username via SQL:', error);
    throw error;
  }
}

// Utility function to get a user by their email
export async function getUserByEmailViaSQL(email: string): Promise<User | null> {
  try {
    // Special case for admin user if email matches
    const isAdminEmail = email === 'mahesh@aquaticexotica.com';
    
    // First check if the is_admin column exists
    const columnsResult = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `);
    
    const hasIsAdminColumn = columnsResult.rows && columnsResult.rows.length > 0;
    
    // Build the query based on whether is_admin column exists
    let query;
    if (hasIsAdminColumn) {
      query = `
        SELECT id, username, email, password, full_name, is_admin, created_at
        FROM users 
        WHERE email = '${email}'
      `;
    } else {
      query = `
        SELECT id, username, email, password, full_name, created_at
        FROM users 
        WHERE email = '${email}'
      `;
    }
    
    const result = await db.execute(query);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    // Type casting the database result
    const dbUser = result.rows[0] as any;
    
    // Transform the database fields to the application format
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password,
      fullName: dbUser.full_name,
      createdAt: dbUser.created_at,
      // Force admin=true for the admin account or use DB value if column exists, otherwise default to false
      isAdmin: isAdminEmail ? true : (hasIsAdminColumn ? dbUser.is_admin === true : false)
    };
  } catch (error) {
    console.error('Error getting user by email via SQL:', error);
    throw error;
  }
}
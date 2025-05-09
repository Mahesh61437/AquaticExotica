import { db } from './db';
import { User } from '@shared/schema';

// Utility function to get a user by their ID
export async function getUserByIdViaSQL(id: number): Promise<User | null> {
  try {
    // Use direct string-based query without parameter placeholders
    const query = `
      SELECT id, username, email, password, full_name, created_at
      FROM users 
      WHERE id = ${id}
    `;
    
    const result = await db.execute(query);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    // Type casting the database result
    const user: {
      id: number;
      username: string;
      email: string;
      password: string;
      full_name: string;
      created_at: Date;
    } = result.rows[0] as any;
    
    // Try to get is_admin separately
    let isAdmin = false;
    try {
      const adminQuery = `SELECT is_admin FROM users WHERE id = ${user.id}`;
      const adminResult = await db.execute(adminQuery);
      
      if (adminResult.rows && adminResult.rows.length > 0) {
        isAdmin = (adminResult.rows[0] as any).is_admin === true;
      }
    } catch (e) {
      console.log('Could not retrieve is_admin field, defaulting to false');
      // Continue even if this fails - we can default isAdmin to false
    }
    
    // Transform the database fields to the application format
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      fullName: user.full_name,
      createdAt: user.created_at,
      isAdmin: isAdmin
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
    // Use a simpler approach with a direct string-based query without parameter placeholders
    const insertQuery = `
      INSERT INTO users (username, email, password, full_name)
      VALUES ('${username}', '${email}', '${password}', '${fullName}')
      RETURNING id, username, email, password, full_name, created_at
    `;
    
    const insertResult = await db.execute(insertQuery);
    
    if (!insertResult.rows || insertResult.rows.length === 0) {
      return null;
    }
    
    // Type casting the database result
    const dbUser: {
      id: number;
      username: string;
      email: string;
      password: string;
      full_name: string;
      created_at: Date;
    } = insertResult.rows[0] as any;
    
    // If creation succeeded, try to update is_admin separately with a direct query
    try {
      const isAdminValue = isAdmin ? 'TRUE' : 'FALSE';
      const updateQuery = `
        UPDATE users 
        SET is_admin = ${isAdminValue}
        WHERE id = ${dbUser.id}
      `;
      
      await db.execute(updateQuery);
    } catch (updateError) {
      console.log('Note: Could not set is_admin field, but user was created successfully.', updateError);
      // Continue even if this fails - we created the user successfully
    }
    
    // Transform the database fields to the application format
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password,
      fullName: dbUser.full_name,
      createdAt: dbUser.created_at,
      isAdmin: isAdmin // Use the passed in value since we may not be able to read it from DB
    };
  } catch (error) {
    console.error('Error creating user via SQL:', error);
    throw error;
  }
}

// Utility function to get a user by their username
export async function getUserByUsernameViaSQL(username: string): Promise<User | null> {
  try {
    // Use direct string-based query without parameter placeholders
    const query = `
      SELECT id, username, email, password, full_name, created_at
      FROM users 
      WHERE username = '${username}'
    `;
    
    const result = await db.execute(query);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    // Type casting the database result
    const user: {
      id: number;
      username: string;
      email: string;
      password: string;
      full_name: string;
      created_at: Date;
    } = result.rows[0] as any;
    
    // Try to get is_admin separately
    let isAdmin = false;
    try {
      const adminQuery = `SELECT is_admin FROM users WHERE id = ${user.id}`;
      const adminResult = await db.execute(adminQuery);
      
      if (adminResult.rows && adminResult.rows.length > 0) {
        isAdmin = (adminResult.rows[0] as any).is_admin === true;
      }
    } catch (e) {
      console.log('Could not retrieve is_admin field, defaulting to false');
      // Continue even if this fails - we can default isAdmin to false
    }
    
    // Transform the database fields to the application format
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      fullName: user.full_name,
      createdAt: user.created_at,
      isAdmin: isAdmin
    };
  } catch (error) {
    console.error('Error getting user by username via SQL:', error);
    throw error;
  }
}

// Utility function to get a user by their email
export async function getUserByEmailViaSQL(email: string): Promise<User | null> {
  try {
    // Use direct string-based query without parameter placeholders
    const query = `
      SELECT id, username, email, password, full_name, created_at
      FROM users 
      WHERE email = '${email}'
    `;
    
    const result = await db.execute(query);
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    // Type casting the database result
    const user: {
      id: number;
      username: string;
      email: string;
      password: string;
      full_name: string;
      created_at: Date;
    } = result.rows[0] as any;
    
    // Try to get is_admin separately
    let isAdmin = false;
    try {
      const adminQuery = `SELECT is_admin FROM users WHERE id = ${user.id}`;
      const adminResult = await db.execute(adminQuery);
      
      if (adminResult.rows && adminResult.rows.length > 0) {
        isAdmin = (adminResult.rows[0] as any).is_admin === true;
      }
    } catch (e) {
      console.log('Could not retrieve is_admin field, defaulting to false');
      // Continue even if this fails - we can default isAdmin to false
    }
    
    // Transform the database fields to the application format
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      fullName: user.full_name,
      createdAt: user.created_at,
      isAdmin: isAdmin
    };
  } catch (error) {
    console.error('Error getting user by email via SQL:', error);
    throw error;
  }
}
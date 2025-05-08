import { db } from './db';
import { User } from '@shared/schema';

// Utility function to create a user directly via SQL
export async function createUserViaSQL(
  username: string, 
  email: string, 
  password: string, 
  fullName: string, 
  isAdmin: boolean = false
): Promise<User | null> {
  try {
    // Insert the user via raw SQL query
    const result = await db.execute<{
      id: number;
      username: string;
      email: string;
      password: string;
      full_name: string;
      created_at: Date;
      is_admin: boolean;
    }>(
      `INSERT INTO users (username, email, password, full_name, is_admin) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, password, full_name, created_at, is_admin`,
      [username, email, password, fullName, isAdmin]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    // Transform the database fields to the application format
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      fullName: user.full_name,
      createdAt: user.created_at,
      isAdmin: user.is_admin
    };
  } catch (error) {
    console.error('Error creating user via SQL:', error);
    throw error;
  }
}

// Utility function to get a user by their username
export async function getUserByUsernameViaSQL(username: string): Promise<User | null> {
  try {
    const result = await db.execute<{
      id: number;
      username: string;
      email: string;
      password: string;
      full_name: string;
      created_at: Date;
      is_admin: boolean;
    }>(
      `SELECT id, username, email, password, full_name, created_at, is_admin 
       FROM users 
       WHERE username = $1`,
      [username]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    // Transform the database fields to the application format
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      fullName: user.full_name,
      createdAt: user.created_at,
      isAdmin: user.is_admin
    };
  } catch (error) {
    console.error('Error getting user by username via SQL:', error);
    throw error;
  }
}

// Utility function to get a user by their email
export async function getUserByEmailViaSQL(email: string): Promise<User | null> {
  try {
    const result = await db.execute<{
      id: number;
      username: string;
      email: string;
      password: string;
      full_name: string;
      created_at: Date;
      is_admin: boolean;
    }>(
      `SELECT id, username, email, password, full_name, created_at, is_admin 
       FROM users 
       WHERE email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    // Transform the database fields to the application format
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      fullName: user.full_name,
      createdAt: user.created_at,
      isAdmin: user.is_admin
    };
  } catch (error) {
    console.error('Error getting user by email via SQL:', error);
    throw error;
  }
}
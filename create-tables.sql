-- Create tables based on shared/schema.ts

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  rating DECIMAL(3, 1) NOT NULL,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_sale BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_trending BOOLEAN NOT NULL DEFAULT FALSE,
  stock INTEGER NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10, 2)
);

-- Create session table for authentication
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session ("expire");
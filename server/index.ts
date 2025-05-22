import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { setupImageOptimization } from './image-optimization';
import { setupCaching } from './cache-middleware';
import { runMigration } from './db-migrate';
import { fixSchema } from './fix-schema';
import { initializeDatabase } from './init-db';
import helmet from 'helmet';

// Create PostgreSQL session store
const PgSession = connectPgSimple(session);

const app = express();

// Set up security headers with Helmet
// Configure with appropriate settings for development
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Allow scripts, styles, fonts, and media from various sources
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow unsafe-inline for development
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
        imgSrc: ["'self'", "data:", "https://firebasestorage.googleapis.com", "https://images.unsplash.com", "https:"],
        connectSrc: ["'self'", "https:", "wss:", "ws:"],
        mediaSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'"]
      }
    },
    // Other security settings that won't break development
    xssFilter: true,
    noSniff: true,
    hsts: {
      maxAge: 63072000, // 2 years in seconds
      includeSubDomains: true,
      preload: true
    } // Enable HSTS for better security
  })
);

// Add middleware to handle HTTPS and www redirection
app.use((req, res, next) => {
  const host = req.hostname;
  
  // In production, enforce HTTPS and www subdomain
  if (process.env.NODE_ENV === 'production') {
    // If not on HTTPS, redirect to HTTPS
    if (req.headers['x-forwarded-proto'] !== 'https') {
      // Determine the correct host (with www if needed)
      const targetHost = host === 'aquaticexotica.com' ? 'www.aquaticexotica.com' : host;
      return res.redirect(301, `https://${targetHost}${req.originalUrl}`);
    }
    
    // If on root domain without www, redirect to www subdomain
    if (host === 'aquaticexotica.com') {
      return res.redirect(301, `https://www.${host}${req.originalUrl}`);
    }
  }
  
  next();
});

// Log information about the current environment
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Server starting in', process.env.NODE_ENV || 'development', 'mode with security headers');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'candid-e-commerce-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    sameSite: 'lax', // Provides some CSRF protection
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Add session type declaration
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run database migration and initialize with demo data
  try {
    // Fix the database schema first
    console.log("Running database schema migration...");
    const { fixSchema } = await import("./fix-schema");
    await fixSchema().catch(err => {
      console.warn("Schema fix warning (continuing):", err.message);
    });
    console.log("Database schema migration completed");
    
    // Then run the standard database migration
    console.log("Running database schema migration...");
    const { runMigration } = await import("./db-migrate");
    await runMigration().catch(err => {
      console.warn("Migration warning (continuing):", err.message);
    });
    console.log("Database migration completed");
    
    // Check if we need to initialize the database
    // Get the directory name properly in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbInitFlagPath = path.join(__dirname, '..', '.db_initialized');
    
    // Always check and ensure admin users exist, but don't recreate data
    console.log("Initializing database with admin user if needed...");
    const { initializeDatabase } = await import("./init-db");
    await initializeDatabase().catch(err => {
      console.warn("Database initialization warning (continuing):", err.message);
    });
  } catch (error) {
    // Log but don't exit the process
    console.error("Database setup encountered issues:", error);
    console.log("Continuing server startup despite database issues");
  }

  // Initialize image optimization middleware
  setupImageOptimization(app);
  
  // Initialize cache middleware for static assets
  setupCaching(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Server error:", err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

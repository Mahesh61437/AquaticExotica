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
import cors from 'cors';
import { initRedis } from './redis';

// Create PostgreSQL session store
const PgSession = connectPgSimple(session);

const app = express();

const vercelRegex = /\.vercel\.app$/;


// Log all incoming requests
// app.use((req, res, next) => {
//   const start = Date.now();
  
//   res.on('finish', () => {
//     const duration = Date.now() - start;
//     const logData = {
//       method: req.method,
//       url: req.originalUrl,
//       status: res.statusCode,
//       duration: `${duration}ms`,
//       ip: req.ip,
//       userAgent: req.get('user-agent')
//     };
    
//     if (res.statusCode >= 500) {
//       console.error('Server error response', logData);
//     } else if (res.statusCode >= 400) {
//       console.warn('Client error response', logData);
//     } else {
//       console.log('Request completed', logData);
//     }
//   });
  
//   next();
// });


const allowedOrigins = [
  "https://aquaticexotica.com",
  "https://www.aquaticexotica.com",
  "https://aquaticexotica-production-88d0.up.railway.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow localhost for local development
      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        return callback(null, true);
      }

      // Allow specific production domains
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any *.vercel.app domain
      try {
        const { hostname } = new URL(origin);
        if (vercelRegex.test(hostname)) {
          return callback(null, true);
        }
      } catch (e) {
        // If origin is not a valid URL, reject
      }

      // Otherwise, block
      callback(new Error("Not allowed by CORS"));
      console.log(`CORS blocked request from origin: ${origin}`);
    },
    credentials: true,
    optionsSuccessStatus: 204,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*'
  })
);

// app.use(cors({
//   origin: 'your-frontend-domain',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

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
        connectSrc: ["'self'", "https:", "wss:", "ws:", "http:", "http://localhost:*", "http://127.0.0.1:*"],
        mediaSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'"]
      }
    },
    // Other security settings that won't break development
    xssFilter: true,
    noSniff: true,
    hsts: false, // Disable HSTS in development
    crossOriginEmbedderPolicy: false, // Disable in development
    crossOriginOpenerPolicy: false, // Disable in development
    crossOriginResourcePolicy: false // Disable in development
  })
);

// Add middleware to handle HTTPS and www redirection
// app.use((req, res, next) => {
//   const host = req.hostname;
  
//   // In production, enforce HTTPS and www subdomain
//   if (process.env.NODE_ENV === 'production') {
//     // If not on HTTPS, redirect to HTTPS
//     if (req.headers['x-forwarded-proto'] !== 'https') {
//       // Determine the correct host (with www if needed)
//       const targetHost = host === 'aquaticexotica.com' ? 'www.aquaticexotica.com' : host;
//       return res.redirect(301, `https://${targetHost}${req.originalUrl}`);
//     }
    
//     // If on root domain without www, redirect to www subdomain
//     if (host === 'aquaticexotica.com') {
//       return res.redirect(301, `https://www.${host}${req.originalUrl}`);
//     }
//   }
  
//   next();
// });

// Log information about the current environment
console.log('NODE_ENV:', { env: process.env.NODE_ENV });
console.log('Server starting', { 
  mode: process.env.NODE_ENV || 'development',
  withSecurity: 'with security headers'
});

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
  console.log('Starting server initialization...');
  
  // Initialize Redis
  try {
    await initRedis();
    console.log('Redis initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis', { error: error instanceof Error ? error.message : error });
    // Continue without Redis if it fails
  }
  
  // Run database migration and initialize with demo data
  try {
    // Fix the database schema first
    console.log("Running database schema migration...");
    const { fixSchema } = await import("./fix-schema");
    await fixSchema().catch(err => {
      console.warn("Schema fix warning (continuing):", { error: err.message });
    });
    console.log("Database schema migration completed");
    
    // Then run the standard database migration
    console.log("Running standard database migration...");
    const { runMigration } = await import("./db-migrate");
    await runMigration().catch(err => {
      console.warn("Migration warning (continuing):", { error: err.message });
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

  // app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  //   const status = err.status || err.statusCode || 500;
  //   const message = err.message || "Internal Server Error";

  //   res.status(status).json({ message });
  //   console.error("Server error:", err);
  // });

  // // importantly only setup vite in development and after
  // // setting up all the other routes so the catch-all route
  // // doesn't interfere with the other routes
  // if (app.get("env") === "development") {
  //   await setupVite(app, server);
  // } else {
  //   serveStatic(app);
  // }

  // 404 handler and logger - MUST be after static file serving
  // app.use((req, res) => {
  //   console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
  //     ip: req.ip,
  //     userAgent: req.get('user-agent')
  //   });
  //   res.status(404).json({ message: "Not Found" });
  // });

  // Global error handler with detailed logging
  // app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  //   const status = err.status || err.statusCode || 500;
  //   const message = err.message || "Internal Server Error";
  //   const logMsg = `${status} Error on ${req.method} ${req.originalUrl}: ${message}`;

  //   if (status >= 500) {
  //     console.error(logMsg, { 
  //       stack: err.stack,
  //       body: req.body,
  //       query: req.query,
  //       params: req.params,
  //       headers: req.headers
  //     });
  //   } else {
  //     console.warn(logMsg, {
  //       body: req.body,
  //       query: req.query,
  //       params: req.params
  //     });
  //   }

  //   res.status(status).json({ message });
  // });

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client.
  const port = process.env.PORT || 3000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });

  // Handle graceful shutdown
//   process.on('SIGTERM', () => {
//     console.log('SIGTERM signal received: closing HTTP server');
//     server.close(() => {
//       console.log('HTTP server closed');
//       process.exit(0);
//     });
//   });

//   process.on('SIGINT', () => {
//     console.log('SIGINT signal received: closing HTTP server');
//     server.close(() => {
//       console.log('HTTP server closed');
//       process.exit(0);
//     });
//   });

//   // Log unhandled errors
//   process.on('uncaughtException', (error) => {
//     console.error('Uncaught Exception:', { 
//       error: error.message, 
//       stack: error.stack 
//     });
//     process.exit(1);
//   });

//   process.on('unhandledRejection', (reason, promise) => {
//     console.error('Unhandled Rejection at:', { 
//       promise, 
//       reason: reason instanceof Error ? reason.message : reason,
//       stack: reason instanceof Error ? reason.stack : undefined
//     });
//   });
})();

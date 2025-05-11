import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { createServer } from "http";

// Add declaration for global references to prevent garbage collection
declare global {
  var keepAliveInterval: NodeJS.Timeout;
  var keepAlivePromise: Promise<any>;
}

// Create PostgreSQL session store
const PgSession = connectPgSimple(session);

const app = express();
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
  // Create HTTP server instance first
  const server = createServer(app);
  
  // Run database migration and initialize with demo data
  try {
    // Fix the database schema first
    console.log("Running database schema migration...");
    const { fixSchema } = await import("./fix-schema");
    await fixSchema();
    console.log("Database schema migration completed successfully");
    
    // Then run the standard database migration
    console.log("Running database schema migration...");
    const { runMigration } = await import("./db-migrate");
    await runMigration();
    console.log("Database migration completed");
    
    // Run schema fix again to ensure is_admin column is created
    // This is because runMigration may reset the schema based on the models
    await fixSchema();
    console.log("Schema verification completed");
    
    // Finally initialize with demo data
    console.log("Initializing database with demo data...");
    const { initializeDatabase } = await import("./init-db");
    await initializeDatabase();
    console.log("Database initialization completed");
  } catch (error) {
    console.error("Database setup failed:", error);
  }

  // Register pure root health check first - no database dependency
  app.get("/", (_req, res) => {
    // Respond immediately with a lightweight 'OK' response for deployment health checks
    // Don't do any logging or database operations here to ensure fastest possible response
    res.set('Connection', 'close').status(200).send('OK');
  });

  // Register other routes before Vite middleware
  await registerRoutes(app, server);

  // Then register Vite middleware in development (after health check endpoint)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Move the database check to a separate endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT NOW()');
        res.status(200).json({
          status: "healthy",
          timestamp: new Date().toISOString(),
          message: "OK",
          database: "connected"
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Database health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
        database: "disconnected"
      });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = Number(process.env.PORT || 5000);
  // Ensure correct interface binding for deployment
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on http://0.0.0.0:${port}`);
    log(`Environment: ${process.env.NODE_ENV}`);
    log('Server initialized and ready to handle requests');
  });

  // Handle termination signals properly
  process.on('SIGTERM', () => {
    log('Received SIGTERM signal, keeping application alive');
  });

  process.on('SIGINT', () => {
    log('Received SIGINT signal, keeping application alive');
  });

  // Prevent unhandled promise rejections from crashing the app
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  // Keep the server alive indefinitely - critical for deployment
  const keepAlive = setInterval(() => {
    log('Server is running...');
  }, 60000); // Log every minute to show the server is alive
  
  // Ensure the interval reference is not lost
  // @ts-ignore - Safely storing interval reference
  global.keepAliveInterval = keepAlive;

  // Handle termination signals properly
  process.on('SIGTERM', () => {
    log('Received SIGTERM signal, keeping application alive');
  });

  process.on('SIGINT', () => {
    log('Received SIGINT signal, keeping application alive');
  });

  // Prevent unhandled promise rejections from crashing the app
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  // Prevent the main Promise from resolving to keep the process alive
  // Also add a global reference to ensure the Promise isn't garbage collected
  const neverEndingPromise = new Promise(() => {
    log('Server started and will remain running');
  });
  
  // Store a reference in the global scope to avoid garbage collection
  // @ts-ignore - Safely storing Promise reference
  global.keepAlivePromise = neverEndingPromise;
  
  return neverEndingPromise;
})();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

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
    
    // Finally initialize with demo data
    console.log("Initializing database with demo data...");
    const { initializeDatabase } = await import("./init-db");
    await initializeDatabase().catch(err => {
      console.warn("Database initialization warning (continuing):", err.message);
    });
    console.log("Database initialization completed");
  } catch (error) {
    // Log but don't exit the process
    console.error("Database setup encountered issues:", error);
    console.log("Continuing server startup despite database issues");
  }

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

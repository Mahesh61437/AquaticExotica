import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { log } from './vite';

// Define cache duration (in seconds)
export const CACHE_DURATIONS = {
  // Assets that can be cached for a long time (1 week)
  longTerm: 60 * 60 * 24 * 7,
  // Assets that might change more frequently (1 day)
  shortTerm: 60 * 60 * 24,
  // HTML files that should be validated more often (1 hour)
  html: 60 * 60
};

/**
 * Middleware to add appropriate cache headers based on file type
 */
export function staticAssetCache(req: Request, res: Response, next: NextFunction) {
  // Skip for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  const extension = path.extname(req.path).toLowerCase();
  
  // Set caching headers based on file type
  if (['.js', '.css', '.woff', '.woff2', '.ttf', '.eot'].includes(extension)) {
    // Static assets that rarely change
    res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATIONS.longTerm}`);
    res.setHeader('Expires', new Date(Date.now() + CACHE_DURATIONS.longTerm * 1000).toUTCString());
  } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'].includes(extension)) {
    // Images - these need good caching
    res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATIONS.longTerm}`);
    res.setHeader('Expires', new Date(Date.now() + CACHE_DURATIONS.longTerm * 1000).toUTCString());
  } else if (extension === '.html' || req.path === '/' || !extension) {
    // HTML files need to be refreshed more often
    res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATIONS.html}`);
    res.setHeader('Expires', new Date(Date.now() + CACHE_DURATIONS.html * 1000).toUTCString());
  }
  
  next();
}

/**
 * Initialize caching middleware
 */
export function setupCaching(app: any) {
  log('Setting up static asset caching middleware...', 'cache-service');
  app.use(staticAssetCache);
}
import { Request, Response, NextFunction } from 'express';
import { log } from './vite';
import fetch from 'node-fetch';

// Cache duration (1 week in seconds)
const CACHE_DURATION = 60 * 60 * 24 * 7;

/**
 * Image optimization middleware
 * - Sets proper cache headers for images
 * - Future expansion: resizing, optimization, WebP conversion
 */
export function setupImageOptimization(app: any) {
  log('Setting up image optimization service...', 'image-service');
  
  // Endpoint to proxy and optimize external images
  app.get('/api/image-proxy', async (req: Request, res: Response) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        return res.status(400).send('No image URL provided');
      }
      
      // For security, you may want to whitelist domains
      const allowedDomains = [
        'images.unsplash.com',
        'firebasestorage.googleapis.com',
        'storage.googleapis.com',
        'lh3.googleusercontent.com'
      ];
      
      // Check if URL is from allowed domain
      const isAllowed = allowedDomains.some(domain => imageUrl.includes(domain));
      
      if (!isAllowed) {
        return res.status(403).send('Image domain not allowed');
      }
      
      // Fetch the image
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
      }
      
      // Get image data and content type
      const imageBuffer = await response.buffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Set cache headers
      res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATION}`);
      res.setHeader('Expires', new Date(Date.now() + CACHE_DURATION * 1000).toUTCString());
      res.setHeader('Content-Type', contentType);
      
      // Return the image
      res.send(imageBuffer);
      
    } catch (error) {
      log(`Image proxy error: ${error}`, 'image-service');
      res.status(500).send('Error processing image');
    }
  });
  
  // Middleware to add cache headers to static assets
  app.use('/assets', (req: Request, res: Response, next: NextFunction) => {
    // Check if the file is an image
    if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)) {
      res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATION}`);
      res.setHeader('Expires', new Date(Date.now() + CACHE_DURATION * 1000).toUTCString());
    }
    next();
  });
  
  log('Image optimization service initialized', 'image-service');
}
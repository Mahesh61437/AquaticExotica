/**
 * Optimize image URLs for better performance
 */

// This indicates if the app is running in production mode
const isProduction = import.meta.env.PROD;

// These resolutions are used for responsive images
type ImageSize = 'small' | 'medium' | 'large' | 'original';

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number; 
  size?: ImageSize;
  format?: 'webp' | 'jpeg' | 'png' | 'avif' | 'auto';
  useProxy?: boolean; // Whether to use our image proxy
}

// Size presets (in pixels)
const sizeMappings: Record<ImageSize, { width?: number, height?: number }> = {
  small: { width: 300 },
  medium: { width: 600 },
  large: { width: 1200 },
  original: { width: undefined, height: undefined }
};

/**
 * Optimize an image URL for better performance
 * - For external images, routes through our proxy service 
 * - For Unsplash, adds optimization parameters
 * - For Firebase Storage, adds size parameters
 */
export function optimizeImageUrl(url: string, options: OptimizeOptions = {}): string {
  if (!url) return '';
  
  // Extract options
  const { 
    width, 
    height, 
    quality = 80, 
    size = 'medium',
    format = 'auto',
    useProxy = true
  } = options;
  
  // Get size preset if no explicit dimensions provided
  const sizePreset = !width && !height ? sizeMappings[size] : {};
  const finalWidth = width || sizePreset.width;
  const finalHeight = height || sizePreset.height;
  
  // Unsplash image optimization
  if (url.includes('images.unsplash.com')) {
    // Unsplash already supports optimization params
    let optimizedUrl = url;
    
    // Add/update query parameters
    const urlObj = new URL(url);
    
    // Set quality
    urlObj.searchParams.set('q', quality.toString());
    
    // Set size
    if (finalWidth) {
      urlObj.searchParams.set('w', finalWidth.toString());
    }
    
    if (finalHeight) {
      urlObj.searchParams.set('h', finalHeight.toString());
    }
    
    // Set format
    if (format !== 'auto') {
      urlObj.searchParams.set('fm', format);
    }
    
    return urlObj.toString();
  }
  
  // Firebase Storage optimization
  if (url.includes('firebasestorage.googleapis.com')) {
    // Firebase supports width/height parameters
    const urlObj = new URL(url);
    
    // If URL already has parameters, we need to add to them
    if (finalWidth) {
      urlObj.searchParams.set('width', finalWidth.toString());
    }
    
    if (finalHeight) {
      urlObj.searchParams.set('height', finalHeight.toString());
    }
    
    return urlObj.toString();
  }
  
  // For any other image URLs, use our proxy service
  if (useProxy && isProduction) {
    const encodedUrl = encodeURIComponent(url);
    let proxyUrl = `/api/image-proxy?url=${encodedUrl}`;
    
    // Add size parameters as needed
    if (finalWidth) {
      proxyUrl += `&width=${finalWidth}`;
    }
    
    if (finalHeight) {
      proxyUrl += `&height=${finalHeight}`;
    }
    
    if (quality) {
      proxyUrl += `&quality=${quality}`;
    }
    
    if (format !== 'auto') {
      proxyUrl += `&format=${format}`;
    }
    
    return proxyUrl;
  }
  
  // Return original URL if no optimizations applied
  return url;
}
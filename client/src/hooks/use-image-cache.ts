import { useState, useEffect, useRef } from 'react';

interface CachedImage {
  src: string;
  loaded: boolean;
  error: boolean;
}

// Global cache to persist across component re-renders
const imageCache = new Map<string, CachedImage>();

export function useImageCache(src: string, fallbackSrc?: string) {
  const [state, setState] = useState<CachedImage>(() => {
    // Check if image is already cached
    const cached = imageCache.get(src);
    if (cached) {
      return cached;
    }
    
    // Initialize new cache entry
    const newEntry: CachedImage = {
      src,
      loaded: false,
      error: false
    };
    imageCache.set(src, newEntry);
    return newEntry;
  });

  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return;

    // If already loaded, return early
    if (state.loaded) return;

    const img = new Image();
    imgRef.current = img;

    const handleLoad = () => {
      const cached = imageCache.get(src);
      if (cached) {
        cached.loaded = true;
        cached.error = false;
        imageCache.set(src, cached);
      }
      setState(prev => ({ ...prev, loaded: true, error: false }));
    };

    const handleError = () => {
      const cached = imageCache.get(src);
      if (cached) {
        cached.loaded = false;
        cached.error = true;
        imageCache.set(src, cached);
      }
      setState(prev => ({ ...prev, loaded: false, error: true }));
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
      imgRef.current = null;
    };
  }, [src, state.loaded]);

  // Try fallback if main image fails
  useEffect(() => {
    if (state.error && fallbackSrc && fallbackSrc !== src) {
      const fallbackCached = imageCache.get(fallbackSrc);
      if (fallbackCached && fallbackCached.loaded) {
        setState(fallbackCached);
      }
    }
  }, [state.error, fallbackSrc, src]);

  return {
    src: state.error && fallbackSrc ? fallbackSrc : src,
    loaded: state.loaded,
    error: state.error,
    isLoading: !state.loaded && !state.error
  };
}

// Utility function to preload images
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cached: CachedImage = { src, loaded: true, error: false };
      imageCache.set(src, cached);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Utility function to clear cache
export function clearImageCache() {
  imageCache.clear();
}

// Utility function to get cache stats
export function getImageCacheStats() {
  const total = imageCache.size;
  const loaded = Array.from(imageCache.values()).filter(img => img.loaded).length;
  const errors = Array.from(imageCache.values()).filter(img => img.error).length;
  
  return { total, loaded, errors };
} 
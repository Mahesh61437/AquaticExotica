import { useState, useEffect, useRef } from 'react';
import { optimizeImageUrl } from '@/lib/image-utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  size?: 'small' | 'medium' | 'large' | 'original';
  quality?: number;
  placeholderColor?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  priority?: boolean; // Set true for above-the-fold images
}

export function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  size = 'medium',
  quality = 80,
  placeholderColor = "#f3f4f6",
  objectFit = 'cover',
  onLoad,
  priority = false
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const imgRef = useRef<HTMLDivElement>(null);

  // Use our optimization utility to improve the image URL
  const optimizedSrc = optimizeImageUrl(src, {
    width,
    height,
    quality,
    size,
    format: 'webp', // Prefer WebP format when supported
  });

  // Intersection Observer to detect when the image is in viewport
  useEffect(() => {
    // Skip if image is priority (above the fold)
    if (priority) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading images when they are 200px from viewport
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Add dimension styles if provided
  const dimensionStyles = {
    ...(width ? { width: `${width}px` } : {}),
    ...(height ? { height: `${height}px` } : {})
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={dimensionStyles}
    >
      {/* Placeholder with blur effect */}
      <div 
        className={`absolute inset-0 bg-gray-200 transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundColor: placeholderColor }}
      />
      
      {/* Actual image - only load when in viewport or if priority */}
      {isInView && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit }}
          onLoad={handleImageLoad}
          loading={priority ? 'eager' : 'lazy'} // Native lazy loading as additional support
          fetchPriority={priority ? 'high' : 'auto'} // Let browser know priority
          decoding="async" // Don't block rendering
        />
      )}
    </div>
  );
}
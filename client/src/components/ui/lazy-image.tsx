import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholderColor?: string;
  onLoad?: () => void;
}

export function LazyImage({
  src,
  alt,
  className = "",
  width,
  height,
  placeholderColor = "#f3f4f6",
  onLoad
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when the image is in viewport
  useEffect(() => {
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
  }, []);

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
      
      {/* Actual image - only load when in viewport */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          loading="lazy" // Native lazy loading as additional support
          fetchPriority="auto" // Let browser decide priority based on visibility
          decoding="async" // Don't block rendering
        />
      )}
    </div>
  );
}
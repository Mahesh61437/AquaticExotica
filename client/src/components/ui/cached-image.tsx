import React from 'react';
import { useImageCache } from '@/hooks/use-image-cache';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface CachedImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  quality?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

export const CachedImage = React.memo(({
  src,
  alt,
  fallbackSrc,
  className,
  size = 'medium',
  quality = 85,
  objectFit = 'cover',
  onLoad,
  onError,
  priority = false
}: CachedImageProps) => {
  const { src: displaySrc, loaded, error, isLoading } = useImageCache(src, fallbackSrc);

  // Handle load and error callbacks
  React.useEffect(() => {
    if (loaded && onLoad) {
      onLoad();
    }
    if (error && onError) {
      onError();
    }
  }, [loaded, error, onLoad, onError]);

  // Size classes
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-full h-full',
    large: 'w-full h-full'
  };

  // Object fit classes
  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down'
  };

  if (isLoading) {
    return (
      <Skeleton 
        className={cn(
          sizeClasses[size],
          'rounded-lg',
          className
        )} 
      />
    );
  }

  if (error && !fallbackSrc) {
    return (
      <div 
        className={cn(
          sizeClasses[size],
          'bg-gray-200 rounded-lg flex items-center justify-center',
          className
        )}
      >
        <span className="text-gray-500 text-xs">Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={cn(
        sizeClasses[size],
        objectFitClasses[objectFit],
        'rounded-lg transition-opacity duration-200',
        loaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      loading={priority ? 'eager' : 'lazy'}
      onLoad={() => {
        if (onLoad) onLoad();
      }}
      onError={() => {
        if (onError) onError();
      }}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if src or key props change
  return (
    prevProps.src === nextProps.src &&
    prevProps.fallbackSrc === nextProps.fallbackSrc &&
    prevProps.alt === nextProps.alt &&
    prevProps.className === nextProps.className &&
    prevProps.size === nextProps.size &&
    prevProps.quality === nextProps.quality &&
    prevProps.objectFit === nextProps.objectFit &&
    prevProps.priority === nextProps.priority
  );
});

CachedImage.displayName = 'CachedImage'; 
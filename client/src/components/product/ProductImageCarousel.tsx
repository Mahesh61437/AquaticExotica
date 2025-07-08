import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductImage {
  id: number;
  imageUrl: string;
  order: number;
  createdAt: string;
}

interface ProductImageCarouselProps {
  images: ProductImage[];
  fallbackImage?: string;
  className?: string;
}

export function ProductImageCarousel({ 
  images, 
  fallbackImage, 
  className = "" 
}: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Sort images by order
  const sortedImages = React.useMemo(() => {
    return [...images].sort((a, b) => a.order - b.order);
  }, [images]);

  // If no images, show fallback or empty state
  if (!sortedImages || sortedImages.length === 0) {
    return (
      <div className={cn("aspect-[3/4] overflow-hidden rounded-lg bg-muted", className)}>
        {fallbackImage ? (
          <img 
            src={fallbackImage} 
            alt="Product" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No images available
          </div>
        )}
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? sortedImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === sortedImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = sortedImages[currentIndex];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image Display */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
        <img 
          src={currentImage.imageUrl} 
          alt={`Product image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {sortedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => goToImage(index)}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                currentIndex === index 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <img 
                src={image.imageUrl} 
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 
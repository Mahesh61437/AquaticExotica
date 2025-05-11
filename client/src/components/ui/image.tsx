import React, { useState } from "react";
import { ImageIcon } from "lucide-react";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

/**
 * Image component with built-in error handling and fallback
 * Will display a placeholder if the image fails to load
 */
export function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackSrc,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState<boolean>(false);
  
  // Return fallback placeholder if there's an error
  if (error) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        {...props}
      >
        {fallbackSrc ? (
          <img 
            src={fallbackSrc} 
            alt={alt || "Fallback image"} 
            className={className}
            onError={() => setError(true)}
            {...props}
          />
        ) : (
          <div className="text-gray-400 flex flex-col items-center justify-center p-4">
            <ImageIcon className="h-12 w-12 mb-2" />
            <span className="text-xs text-center">{alt || "Image not available"}</span>
          </div>
        )}
      </div>
    );
  }

  // Return the normal image with error handling
  return (
    <img
      src={src}
      alt={alt || ""}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DiwaliPopupBannerProps {
  onClose: () => void;
}

export const DiwaliPopupBanner: React.FC<DiwaliPopupBannerProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show banner with a slight delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
        {/* Banner Container - Sized to fit image */}
        <div className="relative mx-auto">
          <div className="relative rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 scale-100 opacity-100">
            {/* Close Button - Positioned within banner */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="absolute top-3 right-3 z-20 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full p-2 transition-all duration-200 cursor-pointer shadow-lg border border-gray-200"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>

            {/* Banner Image - Natural size */}
            <img 
              src="/images/diwali-offer-banner.png"
              alt="Diwali Bucephalandra Offer"
              className="max-w-[90vw] max-h-[80vh] w-auto h-auto object-contain rounded-2xl"
            />
          </div>
        </div>
    </div>
  );
};

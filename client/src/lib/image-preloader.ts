import { preloadImage } from '@/hooks/use-image-cache';

// Critical images that should be preloaded immediately
const CRITICAL_IMAGES = [
  '/images/aquarium_banner.jpeg',
  '/images/aquarium_promo.jpeg',
  // Add more critical images here
];

// Preload critical images
export function preloadCriticalImages() {
  CRITICAL_IMAGES.forEach(src => {
    preloadImage(src).catch(err => {
      console.warn(`Failed to preload critical image: ${src}`, err);
    });
  });
}

// Preload images for a specific page
export function preloadPageImages(pageType: 'home' | 'shop' | 'product' | 'category') {
  const pageImages: Record<string, string[]> = {
    home: [
      '/images/aquarium_banner.jpeg',
      '/images/aquarium_promo.jpeg',
    ],
    shop: [
      // Shop page specific images
    ],
    product: [
      // Product page specific images
    ],
    category: [
      // Category page specific images
    ]
  };

  const images = pageImages[pageType] || [];
  images.forEach(src => {
    preloadImage(src).catch(err => {
      console.warn(`Failed to preload page image: ${src}`, err);
    });
  });
}

// Preload product images for better performance
export function preloadProductImages(imageUrls: string[]) {
  imageUrls.forEach(src => {
    if (src) {
      preloadImage(src).catch(err => {
        console.warn(`Failed to preload product image: ${src}`, err);
      });
    }
  });
}

// Preload category images
export function preloadCategoryImages(imageUrls: string[]) {
  imageUrls.forEach(src => {
    if (src) {
      preloadImage(src).catch(err => {
        console.warn(`Failed to preload category image: ${src}`, err);
      });
    }
  });
} 
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string): string {
  // If the price is already a string with the ₹ symbol, return it as is
  if (typeof price === 'string' && price.includes('₹')) {
    return price;
  }
  
  // Otherwise, format it properly as INR
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

export function generateStarRating(rating: number | string): string {
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  const fullStars = Math.floor(numRating);
  const hasHalfStar = numRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHtml = '';
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fa-solid fa-star"></i>';
  }
  
  // Half star
  if (hasHalfStar) {
    starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="fa-regular fa-star"></i>';
  }
  
  return starsHtml;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export type StockStatus = 'out-of-stock' | 'low-stock' | 'in-stock';

export function getStockStatus(stockLevel: number): { status: StockStatus; color: string; text: string; message?: string } {
  console.log('📦 Checking stock level:', stockLevel);
  if (stockLevel <= 0) {
    return {
      status: 'out-of-stock',
      color: 'bg-red-100 text-red-700 border-red-200',
      text: 'Out of Stock',
      message: 'This item is currently out of stock. We\'ll notify you when it\'s back in stock.'
    };
  } else if (stockLevel <= 5) {
    return {
      status: 'low-stock',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      text: 'Low Stock',
      message: 'Only a few items left. Order soon!'
    };
  } else {
    return {
      status: 'in-stock',
      color: 'bg-green-100 text-green-700 border-green-200',
      text: 'In Stock',
      message: 'Ready to ship within 24 hours'
    };
  }
}

/**
 * Generate a SEO-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

/**
 * Extract product ID from a slug that contains both slug and ID
 */
export function extractProductIdFromSlug(slug: string): number | null {
  console.log('🔍 Extracting product ID from slug:', slug);
  
  // Handle empty or invalid slug
  if (!slug || typeof slug !== 'string') {
    console.log('❌ Invalid slug:', slug);
    return null;
  }
  
  // Try to match the pattern: slug-123
  const match = slug.match(/-(\d+)$/);
  
  if (match) {
    const productId = parseInt(match[1]);
    console.log('✅ Extracted product ID:', productId);
    return productId;
  }
  
  // If no match found, try to parse the entire slug as a number (fallback)
  const numericSlug = parseInt(slug);
  if (!isNaN(numericSlug)) {
    console.log('✅ Parsed numeric slug as product ID:', numericSlug);
    return numericSlug;
  }
  
  console.log('❌ No product ID found in slug:', slug);
  return null;
}

/**
 * Generate a product URL with slug and ID
 */
export function generateProductUrl(product: { id: number; name: string }): string {
  const slug = generateSlug(product.name);
  return `/product/${slug}-${product.id}`;
}

/**
 * Generate a category URL with slug
 */
export function generateCategoryUrl(category: { slug: string; name: string }): string {
  const slug = category.slug || generateSlug(category.name);
  return `/shop/${slug}`;
}

/**
 * Clean and format text for SEO
 */
export function cleanTextForSEO(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Generate meta description from content
 */
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  const cleaned = cleanTextForSEO(content);
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength - 3) + '...';
}

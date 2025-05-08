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

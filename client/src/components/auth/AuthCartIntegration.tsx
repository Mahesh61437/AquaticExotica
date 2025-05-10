import { useAuthCart } from '@/hooks/use-auth-cart';

/**
 * This component doesn't render anything, but integrates
 * authentication with the cart - handling cart merging on login
 */
export function AuthCartIntegration() {
  // Use the auth cart hook for its side effects
  useAuthCart();
  
  // This component doesn't render anything
  return null;
}
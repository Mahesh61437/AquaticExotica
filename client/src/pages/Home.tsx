import { Helmet } from "react-helmet";
import { Suspense, lazy } from "react";
import { HeroBanner } from "@/components/home/HeroBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaceholderSection } from "@/components/layout/PlaceholderSection";

// Lazy loaded components
const FeaturedCategories = lazy(() => import("@/components/home/FeaturedCategories").then(module => ({ default: module.FeaturedCategories })));
const FeaturedProducts = lazy(() => import("@/components/home/FeaturedProducts").then(module => ({ default: module.FeaturedProducts })));
const TrendingProducts = lazy(() => import("@/components/home/TrendingProducts").then(module => ({ default: module.TrendingProducts })));

export default function Home() {
  return (
    <>
      <Helmet>
        <title>AquaticExotica - Premium Aquarium Products</title>
        <meta name="description" content="AquaticExotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Free delivery on orders over ₹2000." />
        <meta property="og:title" content="AquaticExotica - Premium Aquarium Products" />
        <meta property="og:description" content="AquaticExotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Free delivery on orders over ₹2000." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/aquarium_banner.jpeg" />
      </Helmet>

      {/* Hero Banner renders immediately */}
      <HeroBanner />

      {/* Lazy loaded components with suspense fallbacks */}
      <Suspense fallback={<PlaceholderSection title="Featured Categories" height="12rem" />}>
        <FeaturedCategories />
      </Suspense>

      <Suspense fallback={<PlaceholderSection title="Featured Products" height="24rem" bgColor="bg-gray-50" />}>
        <FeaturedProducts />
      </Suspense>

      <Suspense fallback={<PlaceholderSection title="Trending Now" height="18rem" />}>
        <TrendingProducts />
      </Suspense>
    </>
  );
}

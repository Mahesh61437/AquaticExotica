import { Helmet } from "react-helmet";
import { Suspense, lazy } from "react";
import { HeroBanner } from "@/components/home/HeroBanner";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy loaded components
const FeaturedCategories = lazy(() => import("@/components/home/FeaturedCategories"));
const FeaturedProducts = lazy(() => import("@/components/home/FeaturedProducts"));
const TrendingProducts = lazy(() => import("@/components/home/TrendingProducts").then(module => ({ default: module.TrendingProducts })));

// Simple fallback component
function SectionPlaceholder({ title, height, bgColor = "bg-white" }: { title: string; height: string; bgColor?: string }) {
  return (
    <section className={`py-12 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold mb-8">{title}</h2>
        <div className={`w-full animate-pulse`} style={{ height }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 h-full">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="w-full h-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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
      <Suspense fallback={<SectionPlaceholder title="Featured Categories" height="12rem" />}>
        <FeaturedCategories />
      </Suspense>

      <Suspense fallback={<SectionPlaceholder title="Featured Products" height="24rem" bgColor="bg-gray-50" />}>
        <FeaturedProducts />
      </Suspense>

      <Suspense fallback={<SectionPlaceholder title="Trending Now" height="18rem" />}>
        <TrendingProducts />
      </Suspense>
    </>
  );
}

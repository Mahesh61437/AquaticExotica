import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/akva_4.jpeg";
import { PromotionalBanner } from "@/components/home/PromotionalBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, lazy } from "react";

// Lazy loaded components
const FeaturedCategories = lazy(() => import("@/components/home/FeaturedCategories"));

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

// Simple Hero Banner Component (inlined to avoid import errors)
function SimpleBanner() {
  return (
    <div className="relative w-full h-[60vh] flex items-center">
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10 text-white">
        <h1 className="text-4xl md:text-6xl font-heading font-bold max-w-xl leading-tight">
          Premium Aquatic Products for Your Aquarium
        </h1>
        <p className="mt-4 max-w-xl text-lg">
          Discover our wide selection of aquatic plants, rare fish species, and professional equipment. Free delivery on orders over ₹2000.
        </p>
        <Button asChild className="mt-8 px-8 py-6 text-base">
          <Link href="/shop">
            Shop Now
          </Link>
        </Button>
      </div>
    </div>
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

      {/* Simple Hero Banner */}
      <SimpleBanner />

      {/* Featured Categories */}
      <Suspense fallback={<SectionPlaceholder title="Featured Categories" height="12rem" />}>
        <FeaturedCategories />
      </Suspense>

      {/* Promotional Banner instead of Featured Products */}
      <PromotionalBanner />
    </>
  );
}

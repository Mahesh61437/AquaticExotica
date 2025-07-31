import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PromotionalBanner } from "@/components/home/PromotionalBanner";
import { SimpleBanner } from "@/components/home/SimpleBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, lazy } from "react";
import { generateMetaDescription } from "@/lib/utils";

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

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Aquatic Exotica - Premium Aquarium Products & Aquatic Plants</title>
        <meta name="description" content={generateMetaDescription("Aquatic Exotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Free delivery on orders over ₹2000 across India.")} />
        <meta name="keywords" content="aquatic plants, aquarium supplies, aquascaping, fish tank, aquatic exotica, india, aquarium equipment, aquatic plants online" />
        <meta property="og:title" content="Aquatic Exotica - Premium Aquarium Products & Aquatic Plants" />
        <meta property="og:description" content={generateMetaDescription("Aquatic Exotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Free delivery on orders over ₹2000 across India.")} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/aquarium_banner.jpeg" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aquatic Exotica - Premium Aquarium Products & Aquatic Plants" />
        <meta name="twitter:description" content={generateMetaDescription("Aquatic Exotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Free delivery on orders over ₹2000 across India.")} />
        <meta name="twitter:image" content="/images/aquarium_banner.jpeg" />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Aquatic Exotica",
            "url": window.location.origin,
            "logo": `${window.location.origin}/images/aquarium_banner.jpeg`,
            "description": "Premium aquatic plants, rare fish species, and professional aquarium equipment",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Chittoor",
              "addressRegion": "Andhra Pradesh",
              "addressCountry": "IN"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+91-8074751370",
              "contactType": "customer service",
              "email": "mahesh@aquaticexotica.com"
            },
            "sameAs": [
              "https://aquaticexotica.com"
            ]
          })}
        </script>
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

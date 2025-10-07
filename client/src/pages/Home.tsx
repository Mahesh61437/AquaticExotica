import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/akva_4.jpeg";
import { PromotionalBanner } from "@/components/home/PromotionalBanner";
import React from "react";
import { generateMetaDescription } from "@/lib/utils";
import { useAnalytics } from "@/hooks/use-analytics";

// Direct imports to avoid lazy loading issues
import FeaturedCategories from "@/components/home/FeaturedCategories";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import { TrendingProducts } from "@/components/home/TrendingProducts";



export default function Home() {
  const { trackPage } = useAnalytics();

  // Track page view when component mounts
  useEffect(() => {
    trackPage('/');
  }, [trackPage]);

  return (
    <>
      <Helmet>
        <title>Aquatic Exotica - Premium Aquarium Products & Aquatic Plants</title>
        <meta name="description" content={generateMetaDescription("Aquatic Exotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Quality aquatic supplies delivered across India.")} />
        <meta name="keywords" content="aquatic plants, aquarium supplies, aquascaping, fish tank, aquatic exotica, india, aquarium equipment, aquatic plants online" />
        <meta property="og:title" content="Aquatic Exotica - Premium Aquarium Products & Aquatic Plants" />
        <meta property="og:description" content={generateMetaDescription("Aquatic Exotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Quality aquatic supplies delivered across India.")} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/icon%2Faquaticexoticicon.png?alt=media&token=d7bcaa53-5145-4203-af8f-4ceed21b4657" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aquatic Exotica - Premium Aquarium Products & Aquatic Plants" />
        <meta name="twitter:description" content={generateMetaDescription("Aquatic Exotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Quality aquatic supplies delivered across India.")} />
        <meta name="twitter:image" content="https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/icon%2Faquaticexoticicon.png?alt=media&token=d7bcaa53-5145-4203-af8f-4ceed21b4657" />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Aquatic Exotica",
            "url": window.location.origin,
            "logo": "https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/icon%2Faquaticexoticicon.png?alt=media&token=d7bcaa53-5145-4203-af8f-4ceed21b4657",
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

      {/* Logo Showcase Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center space-x-4">
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/aqua-india-61437.firebasestorage.app/o/icon%2Faquaticexoticicon.png?alt=media&token=d7bcaa53-5145-4203-af8f-4ceed21b4657" 
                alt="Aquatic Exotica Logo" 
                className="h-20 w-20 object-contain"
              />
              <div className="text-left">
                <h2 className="text-3xl font-heading font-bold text-gray-900">
                  Aquatic Exotica
                </h2>
                <p className="text-lg text-gray-600 mt-1">
                  Premium Aquarium Solutions
                </p>
              </div>
            </div>
            <p className="max-w-2xl text-gray-600 text-lg leading-relaxed">
              Your trusted partner for premium aquatic plants, rare fish species, and professional aquarium equipment. 
              We bring the beauty of underwater ecosystems to your home with quality products and expert guidance.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="bg-green-50 px-4 py-2 rounded-full">
                <span className="text-green-700 font-medium">🌿 Premium Plants</span>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-full">
                <span className="text-blue-700 font-medium">🐠 Rare Fish</span>
              </div>
              <div className="bg-purple-50 px-4 py-2 rounded-full">
                <span className="text-purple-700 font-medium">⚙️ Professional Equipment</span>
              </div>
              <div className="bg-orange-50 px-4 py-2 rounded-full">
                <span className="text-orange-700 font-medium">🚚 Nationwide Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Trending Products */}
      <TrendingProducts />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Company Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4 rounded-lg">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold">500+</div>
                <div className="text-blue-100">Happy Customers</div>
              </div>
            </div>
            <div className="p-4 rounded-lg">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold">1000+</div>
                <div className="text-blue-100">Products Sold</div>
              </div>
            </div>
            <div className="p-4 rounded-lg">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold">50+</div>
                <div className="text-blue-100">Aquatic Species</div>
              </div>
            </div>
            <div className="p-4 rounded-lg">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold">24/7</div>
                <div className="text-blue-100">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex text-yellow-400 mb-4">
                ⭐⭐⭐⭐⭐
              </div>
              <p className="text-gray-700 mb-4">
                "Amazing quality aquatic plants! My aquarium has never looked better. The delivery was fast and packaging was perfect."
              </p>
              <div className="font-semibold">- Priya Sharma</div>
              <div className="text-sm text-gray-500">Mumbai</div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex text-yellow-400 mb-4">
                ⭐⭐⭐⭐⭐
              </div>
              <p className="text-gray-700 mb-4">
                "Excellent customer service and premium quality fish. They helped me set up my first aquarium perfectly!"
              </p>
              <div className="font-semibold">- Rajesh Kumar</div>
              <div className="text-sm text-gray-500">Delhi</div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex text-yellow-400 mb-4">
                ⭐⭐⭐⭐⭐
              </div>
              <p className="text-gray-700 mb-4">
                "Best place to buy aquarium equipment in India. Great prices and everything arrived in perfect condition."
              </p>
              <div className="font-semibold">- Anjali Patel</div>
              <div className="text-sm text-gray-500">Bangalore</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">Stay Updated</h2>
            <p className="text-gray-600 mb-8">
              Get the latest updates on new aquatic species, special offers, and aquarium care tips delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white">
                Subscribe
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <PromotionalBanner />
    </>
  );
}

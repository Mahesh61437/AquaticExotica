import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/akva_4.jpeg";
import { CachedImage } from "@/components/ui/cached-image";
import React from "react";

export const SimpleBanner = React.memo(() => {
  return (
    <div className="relative w-full h-[60vh] flex items-center">
      <div className="absolute inset-0">
        <CachedImage 
          src={heroImage}
          alt="Premium Aquatic Products"
          className="w-full h-full object-cover"
          size="large"
          objectFit="cover"
          priority={true}
        />
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
}, (prevProps, nextProps) => {
  // No props to compare, so always return true to prevent re-renders
  return true;
});

SimpleBanner.displayName = 'SimpleBanner';
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroBanner() {
  return (
    <section 
      className="relative bg-cover bg-center h-[60vh] flex items-center" 
      style={{ 
        backgroundImage: "url('/images/aquarium_banner.jpeg')",
        backgroundColor: "#000", // Add black background for padding if needed
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="container mx-auto px-4 relative z-10 text-white">
        <h1 className="text-4xl md:text-6xl font-heading font-bold max-w-xl leading-tight">
          Discover Aquatic Wonders
        </h1>
        <p className="mt-4 max-w-xl text-lg">
          Explore our collection of premium aquatic plants, rare fish species, and professional aquarium equipment
        </p>
        <Button asChild className="mt-8 px-8 py-6 text-base">
          <Link href="/shop">Explore Collection</Link>
        </Button>
      </div>
    </section>
  );
}

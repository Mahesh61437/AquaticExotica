import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroBanner() {
  return (
    <section 
      className="relative bg-primary bg-opacity-10 h-[60vh] flex items-center" 
    >
      <div className="absolute inset-0 flex justify-center items-center">
        <img 
          src="/images/aquarium_banner.jpeg" 
          alt="Aquatic Plants" 
          className="max-h-full object-contain"
          onError={(e) => {
            console.error("Failed to load hero image");
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="container mx-auto px-4 relative z-10 text-white">
        <h1 className="text-4xl md:text-6xl font-heading font-bold max-w-xl leading-tight">
          Discover Aquatic Wonders
        </h1>
        <p className="mt-4 max-w-xl text-lg">
          Free Delivery on Orders Above ₹2000
        </p>
        <Button asChild className="mt-8 px-8 py-6 text-base">
          <Link href="/shop">Explore Collection</Link>
        </Button>
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroBanner() {
  return (
    <section 
      className="relative bg-cover bg-center h-[60vh] flex items-center" 
      style={{ 
        backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=800&q=80')"
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <div className="container mx-auto px-4 relative z-10 text-white">
        <h1 className="text-4xl md:text-6xl font-heading font-bold max-w-xl leading-tight">
          New Autumn Collection 2023
        </h1>
        <p className="mt-4 max-w-xl text-lg">
          Discover the latest fashion trends that will define this season
        </p>
        <Button asChild className="mt-8 px-8 py-6 text-base">
          <Link href="/shop">Shop Now</Link>
        </Button>
      </div>
    </section>
  );
}

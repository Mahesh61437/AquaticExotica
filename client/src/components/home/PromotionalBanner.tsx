import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import heroImage from "@assets/akva_4.jpeg";

export function PromotionalBanner() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="p-8 md:p-12 text-white flex-1">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Explore Our Premium Aquarium Collection
              </h2>
              <p className="text-white/90 mb-8 text-lg max-w-xl">
                Discover a world of exotic fish, rare aquatic plants, premium equipment, and everything you need for your perfect aquarium setup.
              </p>
              <Button 
                asChild 
                variant="secondary" 
                className="group bg-white text-blue-600 hover:bg-gray-100 inline-flex items-center px-6 py-3 text-base font-medium"
              >
                <Link href="/shop">
                  Browse All Products
                  <ShoppingBag className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Link>
              </Button>
            </div>
            
            <div className="hidden md:block w-full md:w-2/5 h-64">
              <div className="h-full p-6 flex items-center justify-center">
                <div className="relative w-full h-full bg-white p-2 rounded-lg shadow-lg transform rotate-3">
                  <img 
                    src={heroImage} 
                    alt="Premium Aquarium Collection" 
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute bottom-3 left-3 bg-white px-3 py-1 rounded shadow text-blue-600 font-medium transform -rotate-3">
                    Premium Collection
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
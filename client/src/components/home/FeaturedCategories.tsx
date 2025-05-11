import { Link } from "wouter";
import { useState, useEffect } from "react";

// Static categories with gradient backgrounds
const staticCategories = [
  {
    id: 1,
    name: "Fish",
    slug: "fish",
    gradient: "from-blue-600 to-indigo-700"
  },
  {
    id: 2,
    name: "Plants",
    slug: "plants",
    gradient: "from-green-500 to-emerald-700"
  },
  {
    id: 3,
    name: "Equipment",
    slug: "equipment",
    gradient: "from-gray-600 to-gray-900"
  },
  {
    id: 4,
    name: "Decoration",
    slug: "decoration",
    gradient: "from-amber-400 to-orange-500"
  }
];

export default function FeaturedCategories() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate short loading time (300ms) for consistent UI transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-8">Shop By Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold text-center mb-8">Shop By Category</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {staticCategories.map((category) => (
            <Link 
              key={category.id} 
              href={`/shop/${category.slug}`} 
              className="group relative overflow-hidden rounded-lg aspect-square flex items-center justify-center"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`}></div>
              
              {/* Category Icon */}
              <div className="relative z-10 text-white text-center p-4">
                <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  {category.name === "Fish" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
                      <path d="M18 12.5a5.5 5.5 0 0 1-5.5 5.5 5.5 5.5 0 0 1-5.5-5.5c0-2.8 2.2-5.5 5.5-5.5 3.3 0 5.5 2.7 5.5 5.5z" />
                      <path d="M18.5 7.5c.9 0 1.5.7 1.5 1.5s-.6 1.5-1.5 1.5-1.5-.7-1.5-1.5.6-1.5 1.5-1.5z" />
                      <path d="M5 12.5c3.5-1 6.5-3.5 6.5-3.5s-3 2.5-6.5 3.5z" />
                      <path d="m5 12.5 5 2" />
                    </svg>
                  )}
                  {category.name === "Plants" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
                      <path d="M11.9 3c-2 0-6 8-6 12 0 2 1 3 3 3 1.31 0 2.42-.8 2.8-2" />
                      <path d="M18 3c2.39 0 6 8 6 12 0 2-1 3-3 3-1.31 0-2.42-.8-2.8-2" />
                      <path d="M3 15h8" />
                      <path d="M19 15h2" />
                      <path d="M12 22v-8" />
                    </svg>
                  )}
                  {category.name === "Equipment" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  )}
                  {category.name === "Decoration" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
                      <path d="M5 22h14" />
                      <path d="M5 22v-8h14v8" />
                      <path d="M10 14v-1" />
                      <path d="M2 22v-5c0-8 4-12 10-12 6 0 10 4 10 12v5" />
                    </svg>
                  )}
                </div>
                <span className="text-white font-heading font-semibold text-xl block">
                  {category.name}
                </span>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/10 transition duration-300"></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// For backwards compatibility
export { FeaturedCategories }

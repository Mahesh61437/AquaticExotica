import { Link } from "wouter";
import { useState, useEffect } from "react";
import { Category } from "@/types";
import { apiCache } from "@/lib/api-cache";
import { CachedImage } from "@/components/ui/cached-image";
import React from "react";

export const FeaturedCategories = React.memo(() => {
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Function to get gradient based on category name
  const getCategoryGradient = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('women')) return "from-pink-500 to-rose-600";
    if (lowerName.includes('men')) return "from-blue-600 to-indigo-700";
    if (lowerName.includes('kids')) return "from-yellow-400 to-orange-500";
    if (lowerName.includes('accessories')) return "from-purple-500 to-violet-700";
    
    // Default gradient
    return "from-blue-500 to-cyan-600";
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Try to get categories from cache first (30 minute cache time)
        const data = await apiCache.get<Category[]>('/api/categories/', undefined, 30 * 60 * 1000);
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
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
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/shop/${category.slug}`} 
              className="group relative overflow-hidden rounded-lg aspect-square"
            >
              {/* Gradient background (shows when image fails to load) */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(category.name)} z-0`}></div>
              
              {/* Category image with caching */}
              <CachedImage 
                src={category.imageUrl}
                alt={`${category.name} Category`}
                className="relative z-10 object-cover w-full h-full transform group-hover:scale-105 transition duration-300"
                size="large"
                objectFit="cover"
                fallbackSrc=""
              />
              
              {/* Category name overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4 z-20">
                <span className="text-white font-heading font-semibold text-xl">
                  {category.name}
                </span>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/10 transition duration-300 z-30"></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}, (prevProps, nextProps) => {
  // No props to compare, so always return true to prevent re-renders
  return true;
});

FeaturedCategories.displayName = 'FeaturedCategories';

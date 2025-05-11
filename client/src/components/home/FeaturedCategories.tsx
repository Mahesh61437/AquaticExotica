import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Category } from "@shared/schema";
import { apiCache } from "@/lib/api-cache";

export default function FeaturedCategories() {
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const imageRefs = useRef<Record<number, HTMLImageElement | null>>({});
  
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
        const data = await apiCache.get<Category[]>('/api/categories', undefined, 30 * 60 * 1000);
        setCategories(data);
        
        // Initialize image loading states
        const initialLoadedState: Record<number, boolean> = {};
        data.forEach(cat => {
          initialLoadedState[cat.id] = false;
        });
        setLoadedImages(initialLoadedState);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Intersection Observer for lazy loading images
  useEffect(() => {
    if (isLoading || categories.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const categoryId = Number(img.dataset.categoryId);
            
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.onload = () => {
                setLoadedImages(prev => ({
                  ...prev,
                  [categoryId]: true
                }));
              };
              img.onerror = () => {
                // On error, mark as loaded but use gradient background
                setLoadedImages(prev => ({
                  ...prev,
                  [categoryId]: false
                }));
              };
              
              // Remove data-src to avoid setting the src again
              img.removeAttribute('data-src');
            }
            
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.01
      }
    );
    
    Object.entries(imageRefs.current).forEach(([categoryId, imgRef]) => {
      if (imgRef) {
        observer.observe(imgRef);
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, [isLoading, categories]);

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
              {/* Gradient background (shows when image fails to load or while loading) */}
              <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(category.name)} transition-opacity duration-300 ${
                loadedImages[category.id] ? 'opacity-0' : 'opacity-100'
              }`}></div>
              
              {/* Category image with lazy loading */}
              <img 
                ref={(el) => imageRefs.current[category.id] = el}
                data-src={category.imageUrl}
                data-category-id={category.id}
                alt={`${category.name} Category`}
                className={`object-cover w-full h-full transform group-hover:scale-105 transition duration-300 ${
                  loadedImages[category.id] ? 'opacity-100' : 'opacity-0'
                }`}
                src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
              />
              
              {/* Category name overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <span className="text-white font-heading font-semibold text-xl">
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

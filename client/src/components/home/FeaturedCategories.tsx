import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Category } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { apiCache } from "@/lib/api-cache";

export default function FeaturedCategories() {
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const imageRefs = useRef<Record<number, HTMLImageElement | null>>({});

  // Still use React Query for cache invalidation
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 60 * 1000, // 1 minute
  });

  // Fast client-side data loading with apiCache
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsClientLoading(true);
        const categoriesData = await apiCache.get<Category[]>('/api/categories');
        setLocalCategories(categoriesData);
        
        // Initialize image loading states
        const initialLoadedState: Record<number, boolean> = {};
        categoriesData.forEach(cat => {
          initialLoadedState[cat.id] = false;
        });
        setLoadedImages(initialLoadedState);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsClientLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Update local state when React Query data changes
  useEffect(() => {
    if (categories.length > 0) {
      setLocalCategories(categories);
    }
  }, [categories]);
  
  // Intersection Observer for lazy loading images
  useEffect(() => {
    if (localCategories.length === 0) return;
    
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
              // Remove data-src to avoid setting the src again
              img.removeAttribute('data-src');
            }
            
            // Unobserve after setting src to avoid unnecessary calls
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '200px 0px', // Load images 200px before they enter viewport
        threshold: 0.01
      }
    );
    
    // Set up observation for each image ref
    Object.entries(imageRefs.current).forEach(([categoryId, imgRef]) => {
      if (imgRef) {
        observer.observe(imgRef);
      }
    });
    
    return () => {
      observer.disconnect();
    };
  }, [localCategories]);

  if (isClientLoading) {
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
          {localCategories.map((category) => (
            <Link 
              key={category.id} 
              href={`/shop/${category.slug}`} 
              className="group relative overflow-hidden rounded-lg aspect-square"
            >
              <div className={`absolute inset-0 bg-gray-200 transition-opacity duration-300 ${
                loadedImages[category.id] ? 'opacity-0' : 'opacity-100'
              }`}></div>
              
              <img 
                ref={(el) => imageRefs.current[category.id] = el}
                data-src={category.imageUrl}
                data-category-id={category.id}
                alt={`${category.name} Aquarium Products`} 
                className={`object-cover w-full h-full transform group-hover:scale-105 transition duration-300 ${
                  loadedImages[category.id] ? 'opacity-100' : 'opacity-0'
                }`}
                src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <span className="text-white font-heading font-semibold text-xl">{category.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// For backwards compatibility
export { FeaturedCategories }

import { useState, useEffect, useCallback } from 'react';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from "lucide-react";

// Define the structure for each carousel slide
export interface CarouselSlide {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  autoplayDelay?: number; // in milliseconds, default to 5000 (5 seconds)
}

export function HeroCarousel({ slides, autoplayDelay = 5000 }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  // Set up callbacks for the Embla Carousel
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Initialize the carousel
  useEffect(() => {
    if (!emblaApi) return;
    
    // Set up ScrollSnaps and onSelect callback
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    onSelect();

    // Set up autoplay
    const autoplay = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, autoplayDelay);

    // Clean up
    return () => {
      clearInterval(autoplay);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, autoplayDelay, onSelect]);

  // Navigation button handlers
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      {/* Main Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide) => (
            <div key={slide.id} className="relative min-w-full h-[60vh] flex items-center">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ 
                  backgroundImage: `url(${slide.imageUrl})`,
                  backgroundSize: 'cover',
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              </div>
              
              <div className="container mx-auto px-4 relative z-10 text-white">
                <h1 className="text-4xl md:text-6xl font-heading font-bold max-w-xl leading-tight">{slide.title}</h1>
                <p className="mt-4 max-w-xl text-lg">{slide.subtitle}</p>
                {slide.buttonText && (
                  <Button asChild className="mt-8 px-8 py-6 text-base">
                    <Link href={slide.buttonLink || "/shop"}>
                      {slide.buttonText}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="absolute inset-y-0 left-0 flex items-center">
        <button 
          onClick={scrollPrev}
          className="p-2 bg-black bg-opacity-30 text-white rounded-r-lg hover:bg-opacity-50 transition"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button 
          onClick={scrollNext}
          className="p-2 bg-black bg-opacity-30 text-white rounded-l-lg hover:bg-opacity-50 transition"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${
              index === selectedIndex ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
import { CarouselSlide } from "@/components/home/HeroCarousel";

// This file contains the configuration for the hero carousel slides
// You can easily modify the slides here by changing the title, subtitle, and imageUrl
// You can add or remove slides as needed

const heroCarouselSlides: CarouselSlide[] = [
  {
    id: 1,
    title: "Discover Aquatic Wonders",
    subtitle: "Premium aquatic plants, rare fish species & professional equipment. Free delivery on orders above ₹2000!",
    imageUrl: "/images/aquarium_banner.jpeg",
    buttonText: "Explore Collection",
    buttonLink: "/shop"
  },
  {
    id: 2,
    title: "Premium Aquatic Plants",
    subtitle: "Transform your aquarium with our curated selection of live plants from around the world",
    imageUrl: "/images/aquarium_promo.jpeg",
    buttonText: "Shop Plants",
    buttonLink: "/shop?category=plants"
  },
  {
    id: 3,
    title: "Professional Aquarium Equipment",
    subtitle: "High-quality filters, lighting, and accessories for your perfect aquatic setup",
    imageUrl: "/images/aquarium_banner.jpeg",
    buttonText: "View Equipment",
    buttonLink: "/shop?category=equipment"
  },
  {
    id: 4,
    title: "Expert Aquarium Care",
    subtitle: "Get professional advice and support for all your aquarium needs. 24/7 customer support!",
    imageUrl: "/images/aquarium_promo.jpeg",
    buttonText: "Learn More",
    buttonLink: "/contact"
  }
];

export default heroCarouselSlides;
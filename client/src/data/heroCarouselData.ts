import { CarouselSlide } from "@/components/home/HeroCarousel";

// This file contains the configuration for the hero carousel slides
// You can easily modify the slides here by changing the title, subtitle, and imageUrl
// You can add or remove slides as needed

const heroCarouselSlides: CarouselSlide[] = [
  {
    id: 1,
    title: "Discover Aquatic Wonders",
    subtitle: "Free Delivery on Orders Above ₹2000",
    imageUrl: "/images/aquarium_banner.jpeg",
    buttonText: "Explore Collection",
    buttonLink: "/shop"
  },
  {
    id: 2,
    title: "Premium Aquatic Plants",
    subtitle: "Transform your aquarium with our curated selection of live plants",
    imageUrl: "/images/slide2.jpg", // You'll need to add this image to public/images
    buttonText: "Shop Plants",
    buttonLink: "/shop?category=plants"
  },
  {
    id: 3,
    title: "Professional Aquarium Equipment",
    subtitle: "High-quality filters, lighting, and accessories for your aquatic setup",
    imageUrl: "/images/slide3.jpg", // You'll need to add this image to public/images
    buttonText: "View Equipment",
    buttonLink: "/shop?category=equipment"
  }
];

export default heroCarouselSlides;
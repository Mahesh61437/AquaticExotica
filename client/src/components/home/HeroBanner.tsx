import { HeroCarousel } from "@/components/home/HeroCarousel";
import heroCarouselSlides from "@/data/heroCarouselData";

export function HeroBanner() {
  return <HeroCarousel slides={heroCarouselSlides} />;
}

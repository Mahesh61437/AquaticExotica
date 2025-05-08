import { Helmet } from "react-helmet";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { PromotionalBanner } from "@/components/home/PromotionalBanner";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { InstagramFeed } from "@/components/home/InstagramFeed";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>ModernShop - Fashion E-Commerce</title>
        <meta name="description" content="Discover the latest fashion trends at ModernShop. Shop our collection of clothing, accessories, and footwear with free shipping on orders over $50." />
        <meta property="og:title" content="ModernShop - Fashion E-Commerce" />
        <meta property="og:description" content="Discover the latest fashion trends at ModernShop. Shop our collection of clothing, accessories, and footwear with free shipping on orders over $50." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=630&q=80" />
      </Helmet>

      <HeroBanner />
      <FeaturedCategories />
      <FeaturedProducts />
      <PromotionalBanner />
      <TrendingProducts />
      <InstagramFeed />
    </>
  );
}

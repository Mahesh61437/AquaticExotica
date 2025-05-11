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
        <title>AquaticExotica - Premium Aquarium Products</title>
        <meta name="description" content="AquaticExotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Free shipping on orders over ₹500." />
        <meta property="og:title" content="AquaticExotica - Premium Aquarium Products" />
        <meta property="og:description" content="AquaticExotica offers premium aquatic plants, rare fish species, and professional aquarium equipment. Free shipping on orders over ₹500." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/aquarium_banner.jpeg" />
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

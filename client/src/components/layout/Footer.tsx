import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Instagram, Linkedin, Send } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">AquaticExotica</h3>
            <p className="text-gray-400 mb-4">
              Your destination for premium aquatic plants, exotic fish species, and professional aquarium equipment.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shop?filter=new" className="text-gray-400 hover:text-white transition">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop?sort=popular" className="text-gray-400 hover:text-white transition">
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link href="/shop?category=plants" className="text-gray-400 hover:text-white transition">
                  Aquatic Plants
                </Link>
              </li>
              <li>
                <Link href="/shop?category=equipment" className="text-gray-400 hover:text-white transition">
                  Aquarium Equipment
                </Link>
              </li>
              <li>
                <Link href="/shop?filter=sale" className="text-gray-400 hover:text-white transition">
                  Sale
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-white transition">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest updates and offers.
            </p>
            <form className="flex">
              <Input
                type="email"
                placeholder="Your email"
                className="flex-1 rounded-r-none bg-gray-800 border-gray-700 focus:border-primary"
              />
              <Button type="submit" className="rounded-l-none">
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} AquaticExotica. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <div className="h-8 w-12 bg-gray-600 rounded"></div>
              <div className="h-8 w-12 bg-gray-600 rounded"></div>
              <div className="h-8 w-12 bg-gray-600 rounded"></div>
              <div className="h-8 w-12 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

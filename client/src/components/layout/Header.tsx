import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, User, ShoppingBag, Menu, X, LogIn, LogOut, LayoutDashboard } from "lucide-react"; 
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [location, setLocation] = useLocation();
  const { cart, setIsCartOpen } = useCart();
  const { currentUser, signOut } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Nav */}
        <div className="py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-heading font-bold text-primary">
            ModernShop
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className={`font-medium hover:text-primary transition ${location === '/' ? 'text-primary' : ''}`}>
              Home
            </Link>
            <Link href="/shop" className={`font-medium hover:text-primary transition ${location === '/shop' ? 'text-primary' : ''}`}>
              Shop
            </Link>
          </nav>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Toggle */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)} 
              className="text-gray-600 hover:text-primary transition"
            >
              <Search size={20} />
            </button>
            
            {/* User Account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-600 hover:text-primary transition">
                  {currentUser ? (
                    <div className="relative">
                      <User size={20} />
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></span>
                    </div>
                  ) : (
                    <User size={20} />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {currentUser ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer w-full">
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-orders" className="cursor-pointer w-full">
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    {currentUser.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer w-full">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="cursor-pointer w-full">
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Sign In</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/signup" className="cursor-pointer w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Sign Up</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Shopping Cart */}
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative text-gray-600 hover:text-primary transition"
            >
              <ShoppingBag size={20} />
              {cart.count > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.count}
                </span>
              )}
            </button>
            
            {/* Mobile Menu Toggle */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="text-gray-600 md:hidden">
                  <Menu size={24} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] sm:max-w-sm">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <Link 
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-2xl font-heading font-bold text-primary"
                    >
                      ModernShop
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <X size={24} />
                    </Button>
                  </div>
                  <nav className="flex flex-col space-y-4">
                    <Link 
                      href="/" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="py-2 border-b border-gray-100 font-medium"
                    >
                      Home
                    </Link>
                    <Link 
                      href="/shop" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2 border-b border-gray-100 font-medium"
                    >
                      Shop
                    </Link>
                    {currentUser ? (
                      <>
                        <Link 
                          href="/account" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-2 border-b border-gray-100 font-medium"
                        >
                          My Account
                        </Link>
                        <Link 
                          href="/my-orders" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-2 border-b border-gray-100 font-medium"
                        >
                          My Orders
                        </Link>
                        {currentUser.isAdmin && (
                          <Link 
                            href="/admin" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="py-2 border-b border-gray-100 font-medium flex items-center"
                          >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <button 
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleSignOut();
                          }}
                          className="py-2 border-b border-gray-100 font-medium text-left flex items-center"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link 
                          href="/login" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-2 border-b border-gray-100 font-medium flex items-center"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          <span>Sign In</span>
                        </Link>
                        <Link 
                          href="/signup" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-2 border-b border-gray-100 font-medium flex items-center"
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Sign Up</span>
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Search Bar (expandable) */}
        {isSearchOpen && (
          <div className="py-3 border-t">
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex">
              <Input
                type="text"
                placeholder="Search for products..."
                className="rounded-r-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="rounded-l-none">
                <Search size={18} />
              </Button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

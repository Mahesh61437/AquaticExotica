import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, User, ShoppingBag, Menu, X, LogIn, LogOut, LayoutDashboard, Bell } from "lucide-react"; 
import { useAuth } from "@/context/AuthContext";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import { NotificationDropdown } from "@/components/admin/NotificationDropdown";
import { useUnreadCount } from "@/hooks/use-notifications";
import { Logo } from "@/components/ui/Logo";
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get unread count for admin users
  const { unreadCount } = useUnreadCount();

  
  const handleSignOut = async () => {
    await signOut();
    setLocation("/home");
  };

  return (
    <>
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-2">
        {/* Top Nav */}
        <div className="py-3">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            {/* Logo */}
            <Logo size="lg" />
            
            {/* Desktop Navigation */}
            <nav className="flex space-x-8">
            <Link href="/home" className={`font-medium hover:text-primary transition ${location === '/home' ? 'text-primary' : ''}`}>
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
              className="text-gray-600 hover:text-primary transition p-2"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)} 
                className="text-gray-600 hover:text-primary transition p-2 relative"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {currentUser?.isAdmin && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {currentUser ? (
                <NotificationDropdown 
                  isOpen={isNotificationOpen} 
                  onClose={() => setIsNotificationOpen(false)} 
                />
              ) : (
                isNotificationOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Notifications</h3>
                        <button
                          onClick={() => setIsNotificationOpen(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-center py-8">
                        <Bell size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600">Please log in to view your notifications</p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
            
            {/* User Account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-600 hover:text-primary transition p-2" aria-label="User account">
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
              className="relative text-gray-600 hover:text-primary transition p-2"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={20} />
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.count}
                </span>
              )}
            </button>
          </div>
          </div>
          
          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between bg-white text-gray-900 border-b border-gray-200 min-h-[60px] px-2">
            {/* Mobile Logo */}
            <div className="flex items-center space-x-2">
              <Logo size="md" />
            </div>
            
            {/* Mobile Actions */}
            <div className="flex items-center space-x-1">
              {/* Search */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                className="text-gray-600 hover:text-primary transition p-2"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              
              {/* Notifications */}
              <Sheet open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <SheetTrigger asChild>
                  <button 
                    className="text-gray-600 hover:text-primary transition p-2 relative"
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {currentUser?.isAdmin && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:max-w-md">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Notifications</h2>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsNotificationOpen(false)}
                      >
                        <X size={24} />
                      </Button>
                    </div>
                    
                    {currentUser ? (
                      <div className="flex-1 overflow-y-auto">
                        <NotificationDropdown 
                          isOpen={true} 
                          onClose={() => setIsNotificationOpen(false)} 
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Bell size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Guest User</h3>
                        <p className="text-gray-600">Please log in to view your notifications</p>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Mobile Menu Toggle */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="text-gray-600 p-2" aria-label="Menu">
                    <Menu size={18} />
                  </button>
                </SheetTrigger>
              <SheetContent side="left" className="w-[80vw] sm:max-w-sm">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                      <Logo size="sm" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <X size={24} />
                    </Button>
                  </div>
                  
                  {/* User Management Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    {currentUser ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{currentUser.fullName || currentUser.email}</p>
                          <p className="text-sm text-gray-500">{currentUser.email}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleSignOut}
                          className="text-red-600 hover:text-red-700"
                        >
                          <LogOut size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="font-medium text-gray-900">Guest User</p>
                        <p className="text-sm text-gray-500">Sign in to access your account and your cart</p>
                      </div>
                    )}
                  </div>
                  
                  <nav className="flex flex-col space-y-4">
                    <Link 
                      href="/home" 
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
                    {currentUser && (
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
                      </>
                    )}
                    
                    {!currentUser && (
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
        </div>
        
        {/* Search Dropdown */}
        <div className="relative">
          <SearchDropdown 
            isOpen={isSearchOpen} 
            onClose={() => setIsSearchOpen(false)} 
          />
        </div>
      </div>
    </header>
    
    {/* Mobile Fixed Cart Button */}
    <div className="md:hidden fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsCartOpen(true)} 
        className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition relative"
        aria-label="Shopping cart"
      >
        <ShoppingBag size={24} />
        {cart.count > 0 && (
          <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {cart.count > 9 ? '9+' : cart.count}
          </span>
        )}
      </button>
    </div>
    </>
  );
}

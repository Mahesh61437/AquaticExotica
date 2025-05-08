import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function PromotionalBanner() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    // Here you would typically send this to your API
    toast({
      title: "Thank you for subscribing!",
      description: "Your discount code will be sent to your email.",
    });
    
    setEmail("");
  };

  return (
    <section className="py-16 bg-primary bg-opacity-10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <span className="text-primary font-semibold">SPECIAL OFFER</span>
          <h2 className="text-3xl lg:text-4xl font-heading font-bold mt-2">
            Get 25% Off On Your First Purchase
          </h2>
          <p className="mt-4 text-gray-600">
            Sign up for our newsletter and receive an exclusive discount code for your first order. Limited time offer, don't miss out!
          </p>
          
          <form className="mt-6 flex flex-col sm:flex-row" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Your email address"
              className="flex-1 sm:rounded-r-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              type="submit" 
              className="mt-2 sm:mt-0 sm:rounded-l-none"
            >
              Subscribe
            </Button>
          </form>
        </div>
        
        <div className="relative h-[300px] lg:h-[400px]">
          <img 
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80" 
            alt="Fashion Model" 
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
          />
          <div className="absolute top-0 right-0 bg-accent text-white font-bold rounded-bl-lg p-4 text-4xl">
            25% OFF
          </div>
        </div>
      </div>
    </section>
  );
}

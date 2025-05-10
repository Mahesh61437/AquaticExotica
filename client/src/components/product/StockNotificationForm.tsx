import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Mail } from "lucide-react";

interface StockNotificationFormProps {
  productId: number;
  productName: string;
}

export default function StockNotificationForm({ productId, productName }: StockNotificationFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/stock-notifications/subscribe", {
        email,
        productId,
        productName
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setSubscribed(true);
        toast({
          title: "Notification set up",
          description: "We'll email you when this product is back in stock",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to subscribe");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (subscribed) {
    return (
      <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200 text-green-800">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5" />
          <p className="font-medium">We'll notify you when this product is back in stock</p>
        </div>
        <p className="text-sm mt-1">An email will be sent to {email}</p>
      </div>
    );
  }
  
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-sm mb-2">Get notified when this product is back in stock</h3>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting
            </>
          ) : (
            "Notify Me"
          )}
        </Button>
      </form>
    </div>
  );
}
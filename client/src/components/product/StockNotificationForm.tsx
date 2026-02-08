import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

interface StockNotificationFormProps {
  productId: number;
  productName: string;
}

export function StockNotificationForm({ productId, productName }: StockNotificationFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const isAuthenticated = !!currentUser;

  // If user is authenticated, pre-fill email and disable input
  useEffect(() => {
    if (isAuthenticated && currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [isAuthenticated, currentUser]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("/api/stock-notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          email: email.trim(),
        }),
      });

      setIsSubscribed(true);
      setEmail("");
      
      toast({
        title: "Successfully subscribed",
        description: `You'll be notified when ${productName} is back in stock.`,
      });
    } catch (error: any) {
      console.error("Stock notification subscription error:", error);
      toast({
        title: "Subscription failed",
        description: error.message || "Failed to subscribe to stock notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-medium text-green-800">Successfully subscribed!</h3>
            <p className="text-sm text-green-600">
              You'll receive an email when this product is back in stock.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 text-gray-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-2">Get notified when back in stock</h3>
          <p className="text-sm text-gray-600 mb-3">
            Enter your email address or phone number and we'll notify you when this product becomes available again.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="email" className="sr-only">
                Email address or phone number
              </Label>
              <Input
                id="email"
                placeholder="Enter your email or phone number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !email.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Notify me
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
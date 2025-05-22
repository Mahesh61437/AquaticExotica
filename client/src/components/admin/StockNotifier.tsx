import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { Product } from "@shared/schema";

interface StockNotifierProps {
  product: Product;
  onSuccess?: () => void;
}

export function StockNotifier({ product, onSuccess }: StockNotifierProps) {
  const [isNotifying, setIsNotifying] = useState(false);
  const { toast } = useToast();

  const handleNotifyCustomers = async () => {
    if (isNotifying) return;
    
    setIsNotifying(true);
    
    try {
      const response = await fetch("/api/stock-notifications/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name
        }),
        credentials: "include"
      });
      
      if (response.ok) {
        toast({
          title: "Notifications sent",
          description: "Customers have been notified that this product is back in stock.",
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send notifications");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send stock notifications",
        variant: "destructive"
      });
    } finally {
      setIsNotifying(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Notifications</CardTitle>
        <CardDescription>
          Notify customers who requested to be alerted when this product is back in stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          When you click the button below, all customers who signed up for stock notifications
          for this product will receive an email letting them know it's available again.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleNotifyCustomers} 
          disabled={isNotifying}
        >
          {isNotifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Notifications...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Notify Customers
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/context/AuthContext";
// import { useCheckoutAnalytics } from "@/hooks/use-analytics";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/utils";
import { getAllStates, getCitiesByState, autocompleteCity } from "@/lib/india-states-cities";
import { validatePinCode, validateIndianPhone } from "@/lib/india-states";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { ClearableInput } from "@/components/ui/clearable-input";
import React from "react"; // Added missing import

// Define saved address interface
interface SavedAddress {
  id: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  isDefault: boolean;
}

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(validateIndianPhone, {
    message: "Please enter a valid 10-digit Indian mobile number (starting with 6-9)",
  }),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().refine(validatePinCode, {
    message: "Please enter a valid 6-digit Indian PIN code",
  }),
  country: z.string().min(2, "Country is required"),
  sameAsBilling: z.boolean().default(true),
  shippingFullName: z.string().optional(),
  shippingEmail: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZipCode: z.string().optional().refine(
    (val) => !val || validatePinCode(val),
    {
      message: "Please enter a valid 6-digit Indian PIN code",
    }
  ),
  shippingCountry: z.string().optional(),
  // Removed payment method as requested
  saveInfo: z.boolean().default(false),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CheckoutForm() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { cart, clearCart } = useCart();
  const { currentUser } = useAuth();
  // const { trackOrderComplete } = useCheckoutAnalytics();
  
  // Track selected saved address
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<number | null>(null);

  // States for dependent dropdown selections
  const [selectedState, setSelectedState] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<{ name: string; state: string }[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "IN", // India as default country
      sameAsBilling: true,
      shippingFullName: "",
      shippingEmail: "",
      shippingAddress: "",
      shippingCity: "",
      shippingState: "",
      shippingZipCode: "",
      shippingCountry: "IN",
      // Payment method removed
      saveInfo: false,
      notes: "",
    },
  });

  // Fetch saved addresses
  const { data: savedAddressesResponse = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["/api/shippingaddress"],
    queryFn: async () => {
      const response = await apiRequest("/api/shippingaddress");
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return response || [];
    },
    enabled: !!currentUser, // Only fetch if user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract saved addresses from response
  const savedAddresses = React.useMemo(() => {
    if (!savedAddressesResponse) return [];
    
    // Check if response is paginated with new format
    if (savedAddressesResponse && typeof savedAddressesResponse === 'object' && 'results' in savedAddressesResponse) {
      return (savedAddressesResponse as any).results || [];
    }
    
    // Check if response is a direct array
    if (Array.isArray(savedAddressesResponse)) {
      return savedAddressesResponse;
    }
    
    return [];
  }, [savedAddressesResponse]);
  
  // Update available cities when state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableCities(getCitiesByState(selectedState));
    } else {
      setAvailableCities([]);
    }
  }, [selectedState]);
  
  // Check if user has saved addresses and populate form with default address
  useEffect(() => {
    if (currentUser && savedAddresses.length > 0) {
      // Always add the user's email
      if (currentUser.email) {
        form.setValue('email', currentUser.email);
      }
      
      // Get default address
      const defaultAddress = savedAddresses.find((addr: SavedAddress) => addr.isDefault);
      if (defaultAddress) {
        console.log("Default address found:", defaultAddress);
        
        // Pre-fill form with default address
        form.setValue('fullName', defaultAddress.recipientName);
        form.setValue('email', defaultAddress.recipientEmail || (currentUser?.email || ''));
        form.setValue('address', defaultAddress.addressLine1);
        form.setValue('city', defaultAddress.city);
        form.setValue('state', defaultAddress.state);
        form.setValue('zipCode', defaultAddress.zipCode);
        form.setValue('phone', defaultAddress.recipientPhone);
        
        // Set selected state to update city dropdown
        setSelectedState(defaultAddress.state);
        
        // Set as selected address
        setSelectedSavedAddressId(defaultAddress.id);
      }
    }
  }, [currentUser, savedAddresses, form]);

  // Function to handle saved address selection
  const handleSavedAddressSelect = (address: SavedAddress) => {
    setSelectedSavedAddressId(address.id);
    
    // Fill in the form with this address
    form.setValue('fullName', address.recipientName);
    form.setValue('email', address.recipientEmail || (currentUser?.email || ''));
    form.setValue('address', address.addressLine1);
    form.setValue('city', address.city);
    form.setValue('state', address.state);
    form.setValue('zipCode', address.zipCode);
    form.setValue('phone', address.recipientPhone);
    
    // Update the state to populate cities dropdown
    setSelectedState(address.state);
  };

  const onSubmit = async (data: FormValues) => {
    if (cart.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some products to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare cart items in the new format
      const items = cart.items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        variant_id: item.variantId ?? null  // Always include variant_id (null if no variant)
      }));

      const shippingCost = 150; // Shipping cost

      // Create order data based on whether a saved address is selected
      let orderData;
      
      if (selectedSavedAddressId) {
        // Use saved address
        orderData = {
          items,
          shipping_address_id: selectedSavedAddressId,
          shipping_cost: shippingCost.toFixed(2)
        };
      } else {
        // Use form data for new address
        orderData = {
          items,
          shipping_cost: shippingCost.toFixed(2),
          address_line_1: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zipCode,
          country: data.country,
          recipient_name: data.fullName,
          recipient_phone: data.phone,
          is_default: data.saveInfo // Save as default if user checked the option
        };
      }

      // Log the order data before submitting (for debugging)
      console.log("Submitting order data:", orderData);
      
      // Submit order to API using apiRequest
      const response = await apiRequest("/api/orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const orderId = response.id;

      // Clear cart after order creation (before payment)
      clearCart();

      // Initiate PayU payment and redirect to PayU hosted checkout
      // Backend will fetch order details and customer info from database
      try {
        const { processPayUPayment } = await import("@/lib/payu-service");
        
        await processPayUPayment(orderId);
        
        // User will be redirected to PayU, so no need to redirect here
        // PayU will redirect back to success/failure URLs after payment
      } catch (paymentError: any) {
        console.error("Payment initiation error:", paymentError);
        
        // If payment initiation fails, redirect to order confirmation anyway
        // Order is already created, payment can be retried later
        toast({
          title: "Order created",
          description: "Order created successfully. Payment initiation failed. You can retry payment from order details.",
          variant: "default",
        });
        
        setLocation(`/order-confirmation/${orderId}`);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Watch the sameAsBilling value to conditionally show shipping fields
  const sameAsBilling = form.watch("sameAsBilling");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">Billing Information</h2>
              
              {/* Saved addresses section */}
              {currentUser && savedAddresses.length > 0 && (
                <div className="mb-6 p-4 border rounded-md bg-gray-50">
                  <h3 className="text-lg font-medium mb-2">Your Saved Addresses</h3>
                  {addressesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading addresses...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {Array.isArray(savedAddresses) && savedAddresses.map((address: SavedAddress) => (
                        <div 
                          key={address.id} 
                          className={`p-3 border rounded-md cursor-pointer transition-colors hover:border-primary ${
                            selectedSavedAddressId === address.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                          }`}
                          onClick={() => handleSavedAddressSelect(address)}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{address.recipientName}</span>
                            {address.isDefault && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-sm text-gray-600">{address.addressLine1}</p>
                          {address.addressLine2 && (
                            <p className="text-sm text-gray-600">{address.addressLine2}</p>
                          )}
                          <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                          <p className="text-sm text-gray-600">Phone: {address.recipientPhone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Option to use new address */}
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSavedAddressId(null);
                        form.reset();
                        setSelectedState("");
                      }}
                    >
                      Use New Address
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <ClearableInput placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <ClearableInput type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <ClearableInput placeholder="(123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <ClearableInput placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedState(value);
                          // Reset city when state changes
                          form.setValue('city', '');
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAllStates().map((state: { code: string; name: string }) => (
                            <SelectItem key={state.code} value={state.name}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <CityAutocomplete
                          value={field.value}
                          onValueChange={field.onChange}
                          stateName={selectedState}
                          placeholder="Select city"
                          disabled={!selectedState}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN Code</FormLabel>
                      <FormControl>
                        <ClearableInput placeholder="600001" maxLength={6} {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter a 6-digit Indian PIN code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={true} // Lock to India only
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="IN">India</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Save address option - only show if no saved address is selected */}
              {!selectedSavedAddressId && (
                <FormField
                  control={form.control}
                  name="saveInfo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Save this address for future orders
                        </FormLabel>
                        <FormDescription>
                          This address will be saved to your account for quick checkout
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* Shipping Address Section - Only show if different from billing */}
              {!sameAsBilling && (
                <div className="space-y-4">
                  <h3 className="text-xl font-heading font-semibold">Shipping Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shippingFullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <ClearableInput placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shippingEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <ClearableInput type="email" placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <ClearableInput placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shippingState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select 
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Reset shipping city when shipping state changes
                              form.setValue('shippingCity', '');
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAllStates().map((state: { code: string; name: string }) => (
                                <SelectItem key={state.code} value={state.name}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <CityAutocomplete
                              value={field.value || ""}
                              onValueChange={field.onChange}
                              stateName={form.watch("shippingState") || ""}
                              placeholder="Select city"
                              disabled={!form.watch("shippingState")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shippingZipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN Code</FormLabel>
                          <FormControl>
                            <ClearableInput placeholder="600001" maxLength={6} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={true}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="IN">India</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Same as billing checkbox */}
              <FormField
                control={form.control}
                name="sameAsBilling"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Shipping address same as billing address
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Order Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Notes (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Any special instructions for your order..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place Order
            </Button>
          </form>
        </Form>
      </div>

      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              {cart.count} item{cart.count !== 1 ? "s" : ""} in your cart
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item, index) => (
              <div key={`${item.id}-${item.variantId || 'no-variant'}-${index}`} className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.variantName && (
                      <p className="text-xs text-gray-600">{item.variantName}</p>
                    )}
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
            
            <div className="pt-2">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Shipping</span>
                <span>₹150.00</span>
              </div>
              <div className="flex justify-between py-3 border-t border-b mt-2 text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(cart.total + 150)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

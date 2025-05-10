import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/utils";
import { indianStates, getCitiesByState, validatePinCode, validateIndianPhone } from "@/lib/india-states";
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

const formSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
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
  shippingFirstName: z.string().optional(),
  shippingLastName: z.string().optional(),
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
  const { currentUser, getDefaultAddress } = useAuth();
  
  // Track if we should show saved addresses
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<string | undefined>(undefined);

  // States for dependent dropdown selections
  const [selectedState, setSelectedState] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<{ name: string; state: string }[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "IN", // India as default country
      sameAsBilling: true,
      shippingFirstName: "",
      shippingLastName: "",
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
    if (currentUser) {
      // Always add the user's email
      if (currentUser.email) {
        form.setValue('email', currentUser.email);
      }
      
      // Check if user has saved addresses
      if (currentUser.addresses && currentUser.addresses.length > 0) {
        setShowSavedAddresses(true);
        
        // Get default address
        const defaultAddress = getDefaultAddress();
        if (defaultAddress) {
          console.log("Default address found:", defaultAddress);
          
          // Pre-fill form with default address
          form.setValue('firstName', defaultAddress.name.split(' ')[0] || '');
          form.setValue('lastName', defaultAddress.name.split(' ').slice(1).join(' ') || '');
          form.setValue('address', defaultAddress.addressLine1);
          form.setValue('city', defaultAddress.city);
          form.setValue('state', defaultAddress.state);
          form.setValue('zipCode', defaultAddress.pinCode);
          form.setValue('phone', defaultAddress.phone);
          
          // Set selected state to update city dropdown
          setSelectedState(defaultAddress.state);
        }
      }
    }
  }, [currentUser, form, getDefaultAddress]);

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
      // Prepare shipping address (either same as billing or different)
      const shippingAddress = data.sameAsBilling
        ? {
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
          }
        : {
            address: data.shippingAddress || "",
            city: data.shippingCity || "",
            state: data.shippingState || "",
            zipCode: data.shippingZipCode || "",
            country: data.shippingCountry || "",
          };

      // Create order data formatted according to schema requirements
      const orderData = {
        status: "pending",
        total: (cart.total + 150).toString(), // Add shipping cost to the total
        items: cart.items,
        shippingAddress: {
          firstName: data.sameAsBilling ? data.firstName : (data.shippingFirstName || data.firstName),
          lastName: data.sameAsBilling ? data.lastName : (data.shippingLastName || data.lastName),
          email: data.email,
          phone: data.phone,
          address: data.sameAsBilling ? data.address : (data.shippingAddress || ""),
          city: data.sameAsBilling ? data.city : (data.shippingCity || ""),
          state: data.sameAsBilling ? data.state : (data.shippingState || ""),
          zipCode: data.sameAsBilling ? data.zipCode : (data.shippingZipCode || ""),
          country: data.sameAsBilling ? data.country : (data.shippingCountry || "IN"),
        },
        billingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        paymentMethod: "pending", // Set default payment status
        createdAt: new Date().toISOString(),
        userId: currentUser?.id || null, // Link order to user if authenticated
      };

      // Submit order to API
      const response = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });
      const order = await response.json();

      // Clear cart and show success with message about stock check
      clearCart();
      
      toast({
        title: "Order received successfully!",
        description: "We are currently checking if the stock is available for your order. We will contact you shortly via WhatsApp with the details.",
        duration: 6000, // Show for longer so user can read message
      });

      // Redirect to confirmation page
      setLocation(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: "There was an error processing your order. Please try again.",
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
              {showSavedAddresses && currentUser?.addresses && currentUser.addresses.length > 0 && (
                <div className="mb-6 p-4 border rounded-md bg-gray-50">
                  <h3 className="text-lg font-medium mb-2">Your Saved Addresses</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {currentUser.addresses.map((address) => (
                      <div 
                        key={address.id} 
                        className={`p-3 border rounded-md cursor-pointer transition-colors hover:border-primary ${
                          selectedSavedAddress === address.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}
                        onClick={() => {
                          // Set the selected address
                          setSelectedSavedAddress(address.id);
                          
                          // Fill in the form with this address
                          const nameParts = address.name.split(' ');
                          form.setValue('firstName', nameParts[0] || '');
                          form.setValue('lastName', nameParts.slice(1).join(' ') || '');
                          form.setValue('address', address.addressLine1);
                          form.setValue('city', address.city);
                          form.setValue('state', address.state);
                          form.setValue('zipCode', address.pinCode);
                          form.setValue('phone', address.phone);
                          
                          // Update the state to populate cities dropdown
                          setSelectedState(address.state);
                        }}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium">{address.name}</span>
                          {address.isDefault && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Default</span>}
                        </div>
                        <p className="text-sm text-gray-600">{address.addressLine1}</p>
                        <p className="text-sm text-gray-600">{address.city}, {address.state} {address.pinCode}</p>
                        <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
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
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
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
                        <Input placeholder="(123) 456-7890" {...field} />
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
                      <Input placeholder="123 Main St" {...field} />
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedState(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {indianStates.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
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
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!selectedState}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedState ? "Select city" : "Select state first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCities.length > 0 ? (
                            availableCities.map((city) => (
                              <SelectItem key={city.name} value={city.name}>
                                {city.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="none">
                              No cities available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="600001" maxLength={6} {...field} />
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
            </div>

            {/* Shipping Information */}
            <div className="space-y-6">
              <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-heading font-bold">Shipping Information</h2>
                
                <FormField
                  control={form.control}
                  name="sameAsBilling"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Shipping address is the same as billing
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {!sameAsBilling && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="shippingFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shippingLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {indianStates.map((state) => (
                                <SelectItem key={state.code} value={state.code}>
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
                            <Input placeholder="Mumbai" {...field} />
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
                            <Input placeholder="600001" maxLength={6} {...field} />
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
                      name="shippingCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue="IN"
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
            </div>

            {/* Payment information removed as requested */}
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">Order Information</h2>
              
              <div className="p-4 bg-blue-50 rounded-md text-blue-700">
                <p className="text-sm font-medium mb-2">Order & Payment Process</p>
                <p className="text-xs">
                  After submitting your order, we will check stock availability and contact you 
                  via WhatsApp with payment options and delivery details.
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">Additional Information</h2>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Notes (optional)</FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Special instructions for delivery or additional information"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        Save my information for faster checkout next time
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Place Order"}
            </Button>
          </form>
        </Form>
      </div>

      {/* Order Summary */}
      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              {cart.count} item{cart.count !== 1 ? "s" : ""} in your cart
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center pb-2 border-b">
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
          <CardFooter>
            <p className="text-sm text-gray-500">
              Flat rate shipping of ₹150 applies to all orders in India.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

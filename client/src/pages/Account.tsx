import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllStates, getCitiesByState, autocompleteCity } from "@/lib/india-states-cities";
import { validatePinCode } from "@/lib/india-states";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Loader2, Package, MapPin, Edit, Trash2 } from "lucide-react";
import React from "react";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { ClearableInput } from "@/components/ui/clearable-input";

// Address form schema
const addressFormSchema = z.object({
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(6, "Valid ZIP code is required"),
  country: z.string().min(2, "Country is required"),
  recipientName: z.string().min(2, "Recipient name is required"),
  recipientEmail: z.string().email("Valid email is required"),
  recipientPhone: z.string().min(10, "Valid phone number is required"),
  isDefault: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

// Address interface based on API response
interface ShippingAddress {
  id: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  isDefault: boolean;
}

// Address component
function AddressForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<{ name: string; state: string }[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch addresses from API
  const { data: addresses = [], isLoading: addressesLoading, error: addressesError } = useQuery({
    queryKey: ["/api/shippingaddress"],
    queryFn: async () => {
      return await apiRequest("/api/shippingaddress");
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

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      recipientName: "",
      recipientEmail: "",
      recipientPhone: "",
      isDefault: false,
    },
  });

  const onSubmit = async (data: AddressFormValues) => {
    try {
      if (editingAddress) {
        // Update existing address
        await apiRequest(`/api/shippingaddress/${editingAddress.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        toast({
          title: "Address updated",
          description: "Your address has been updated successfully.",
        });
      } else {
        // Create new address
        await apiRequest("/api/shippingaddress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
    toast({
      title: "Address added",
      description: "Your new address has been saved successfully.",
    });
      }
    
    // Close the dialog and reset the form
    setIsOpen(false);
    form.reset();
      setEditingAddress(null);
      
      // Invalidate addresses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/shippingaddress"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    }
  };

  const handleEditAddress = (address: ShippingAddress) => {
    setEditingAddress(address);
    form.reset({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      recipientName: address.recipientName,
      recipientEmail: address.recipientEmail,
      recipientPhone: address.recipientPhone,
      isDefault: address.isDefault,
    });
    setSelectedState(address.state);
    setIsOpen(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await apiRequest(`/api/shippingaddress/${addressId}`, {
          method: "DELETE",
        });
        toast({
          title: "Address deleted",
          description: "Address has been removed successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/shippingaddress"] });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete address",
          variant: "destructive",
        });
      }
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await apiRequest(`/api/shippingaddress/${addressId}/default`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true })
      });
      toast({
        title: "Default address updated",
        description: "Your default address has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shippingaddress"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update default address",
        variant: "destructive",
      });
    }
  };

  if (addressesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading addresses...</span>
      </div>
    );
  }

  if (addressesError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-lg text-center">
        <p className="text-red-600 dark:text-red-400">Failed to load addresses. Please try again.</p>
        <Button 
          className="mt-4" 
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/shippingaddress"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      {addresses.length === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-muted-foreground">You don't have any saved addresses.</p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => {
              setEditingAddress(null);
              form.reset({
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                zipCode: "",
                country: "India",
                recipientName: "",
                recipientEmail: "",
                recipientPhone: "",
                isDefault: false,
              });
              setSelectedState("");
              setIsOpen(true);
            }}
          >
            Add New Address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address: ShippingAddress) => (
            <div key={address.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{address.recipientName}</h3>
                  <p className="text-sm">{address.addressLine1}</p>
                  {address.addressLine2 && <p className="text-sm">{address.addressLine2}</p>}
                  <p className="text-sm">
                    {address.city}, {address.state}, {address.zipCode}
                  </p>
                  <p className="text-sm">{address.country}</p>
                  <p className="text-sm">Phone: {address.recipientPhone}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {address.isDefault && <Badge variant="secondary">Default</Badge>}
                    {!address.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Set as Default
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditAddress(address)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive"
                    onClick={() => handleDeleteAddress(address.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setEditingAddress(null);
              form.reset({
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                zipCode: "",
                country: "India",
                recipientName: "",
                recipientEmail: "",
                recipientPhone: "",
                isDefault: false,
              });
              setSelectedState("");
              setIsOpen(true);
            }}
          >
            Add Another Address
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            <div className="text-sm text-muted-foreground">
              {editingAddress ? "Update your delivery address" : "Add a new delivery address to your account"}
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Name</FormLabel>
                    <FormControl>
                      <ClearableInput placeholder="Enter recipient's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <ClearableInput placeholder="Street address, House No." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <ClearableInput placeholder="Apartment, suite, unit, etc." {...field} />
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
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          stateName={selectedState || ""}
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
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <ClearableInput placeholder="ZIP code" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <ClearableInput placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <ClearableInput placeholder="Enter recipient's email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <ClearableInput placeholder="10-digit phone number" maxLength={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
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
                        Set as default address
                      </FormLabel>
                      <FormDescription>
                        This address will be used as your default shipping and billing address
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button type="submit">
                  {editingAddress ? "Update Address" : "Save Address"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Account() {
  const [, setLocation] = useLocation();
  const { currentUser, signOut } = useAuth();

  // Fetch user orders
  const { data: ordersResponse, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["/api/orders/"],
    queryFn: async () => {
      const response = await apiRequest("/api/orders/");
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return response || [];
    },
    enabled: !!currentUser, // Only fetch if user is logged in
  });

  // Extract orders from response
  const orders = React.useMemo(() => {
    if (!ordersResponse) return [];
    
    // Check if response is paginated with new format
    if (ordersResponse && typeof ordersResponse === 'object' && 'results' in ordersResponse) {
      return (ordersResponse as any).results || [];
    }
    
    // Check if response is a direct array
    if (Array.isArray(ordersResponse)) {
      return ordersResponse;
    }
    
    return [];
  }, [ordersResponse]);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  // ProtectedRoute ensures currentUser is not null, but TypeScript doesn't know that
  if (!currentUser) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      processing: "bg-blue-100 text-blue-800 border-blue-300",
      shipped: "bg-green-100 text-green-800 border-green-300",
      delivered: "bg-emerald-100 text-emerald-800 border-emerald-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
    };
    
    const colorClass = statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-300";
    return (
      <Badge variant="outline" className={colorClass}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src="" alt={currentUser.fullName || currentUser.username || "User"} />
                <AvatarFallback className="text-xl">
                  {(currentUser.fullName || currentUser.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{currentUser.fullName || currentUser.username || "User"}</CardTitle>
              <CardDescription>
                {currentUser.email || "No email provided"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Email: </span>
                  {currentUser.email || "Not provided"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Username: </span>
                  {currentUser.username || "Not provided"}
                </div>
                {currentUser.fullName && (
                  <div className="text-sm">
                    <span className="font-medium">Full Name: </span>
                    {currentUser.fullName}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Account Type: </span>
                  {currentUser.isAdmin ? "Administrator" : "Customer"}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Sign Out
              </Button>
            </CardFooter>
          </Card>

          {/* Account Activities */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>View your order history and track deliveries</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading orders...</span>
                  </div>
                ) : ordersError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-lg text-center">
                    <p className="text-red-600 dark:text-red-400">Failed to load orders. Please try again.</p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : !Array.isArray(orders) || orders.length === 0 ? (
                  <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
                    <div className="flex justify-center gap-4">
                      <Button onClick={() => setLocation("/shop")}>
                        Start Shopping
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(orders) && orders.slice(0, 3).map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                            <p className="text-sm">Total: {formatPrice(order.grandTotal)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(order.status)}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setLocation(`/orders/${order.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {Array.isArray(orders) && orders.length > 3 && (
                      <div className="text-center">
                        <Button variant="outline" onClick={() => setLocation("/my-orders")}>
                          View All Orders ({orders.length})
                        </Button>
                      </div>
                    )}
                </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved Addresses</CardTitle>
                <CardDescription>Manage your saved shipping and billing addresses</CardDescription>
              </CardHeader>
              <CardContent>
                <AddressForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
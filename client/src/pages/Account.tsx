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
import { indianStates, getCitiesByState, validatePinCode } from "@/lib/india-states";

// Address form schema
const addressFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  state: z.string().min(2, "State is required"),
  city: z.string().min(2, "City is required"),
  pinCode: z.string().refine(validatePinCode, {
    message: "Please enter a valid 6-digit Indian PIN code",
  }),
  phone: z.string().min(10, "Valid phone number is required").max(10, "Phone number should be 10 digits"),
  isDefault: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

// Address component
function AddressForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [addresses, setAddresses] = useState<AddressFormValues[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<{ name: string; state: string }[]>([]);
  const { toast } = useToast();

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
      name: "",
      addressLine1: "",
      addressLine2: "",
      state: "",
      city: "",
      pinCode: "",
      phone: "",
      isDefault: false,
    },
  });

  const onSubmit = (data: AddressFormValues) => {
    // Add the new address to the addresses list
    setAddresses([...addresses, data]);
    
    // Display success toast
    toast({
      title: "Address added",
      description: "Your new address has been saved successfully.",
    });
    
    // Close the dialog and reset the form
    setIsOpen(false);
    form.reset();
  };

  return (
    <>
      {addresses.length === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
          <p className="text-muted-foreground">You don't have any saved addresses.</p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => setIsOpen(true)}
          >
            Add New Address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{address.name}</h3>
                  <p className="text-sm">{address.addressLine1}</p>
                  {address.addressLine2 && <p className="text-sm">{address.addressLine2}</p>}
                  <p className="text-sm">
                    {address.city}, {indianStates.find(s => s.code === address.state)?.name}, {address.pinCode}
                  </p>
                  <p className="text-sm">Phone: {address.phone}</p>
                  {address.isDefault && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">Default</span>}
                </div>
                <div className="space-x-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                </div>
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsOpen(true)}
          >
            Add Another Address
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Add a new delivery address to your account
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
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
                      <Input placeholder="Street address, House No." {...field} />
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
                      <Input placeholder="Apartment, suite, unit, etc." {...field} />
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
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN Code</FormLabel>
                      <FormControl>
                        <Input placeholder="6-digit PIN code" maxLength={6} {...field} />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="10-digit phone number" maxLength={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                <Button type="submit">Save Address</Button>
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

  useEffect(() => {
    // If user is not logged in, redirect to login page
    if (!currentUser) {
      setLocation("/login");
    }
  }, [currentUser, setLocation]);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  // Return early if user is not logged in
  if (!currentUser) {
    return null;
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src="" alt={currentUser.fullName || "User"} />
                <AvatarFallback className="text-xl">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{currentUser.fullName || "User"}</CardTitle>
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
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">View and track all your recent orders</p>
                  <div className="flex justify-center gap-4">
                    <Button onClick={() => setLocation("/my-orders")}>
                      View My Orders
                    </Button>
                    <Button variant="outline" onClick={() => setLocation("/shop")}>
                      Continue Shopping
                    </Button>
                  </div>
                </div>
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
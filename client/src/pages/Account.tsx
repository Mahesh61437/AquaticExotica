import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
                <AvatarImage src="" alt={currentUser.phoneNumber || "User"} />
                <AvatarFallback className="text-xl">
                  {currentUser.phoneNumber ? currentUser.phoneNumber.slice(-2).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{currentUser.displayName || "User"}</CardTitle>
              <CardDescription>
                {currentUser.email || currentUser.phoneNumber || "No contact info"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Phone: </span>
                  {currentUser.phoneNumber || "Not provided"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Email: </span>
                  {currentUser.email || "Not provided"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Member since: </span>
                  {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : "Unknown"}
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
                  <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                  <Button className="mt-4" onClick={() => setLocation("/shop")}>
                    Start Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saved Addresses</CardTitle>
                <CardDescription>Manage your saved shipping and billing addresses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">You don't have any saved addresses.</p>
                  <Button className="mt-4" variant="outline">
                    Add New Address
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
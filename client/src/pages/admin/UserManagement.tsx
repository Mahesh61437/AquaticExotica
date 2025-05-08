import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Loader2, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface UserWithoutPassword extends Omit<User, 'password'> {}

export default function UserManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithoutPassword | null>(null);

  // Fetch users
  const { data: users, isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Update user admin status mutation - grant admin
  const grantAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/make-admin`, { userId: id });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Admin privileges granted successfully",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to grant admin privileges: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update user admin status mutation - revoke admin
  const revokeAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/revoke-admin`, { userId: id });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Admin privileges revoked successfully",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to revoke admin privileges: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSelectUser = (user: UserWithoutPassword) => {
    setSelectedUser(user);
    setIsOpen(true);
  };

  const handleGrantAdmin = () => {
    if (!selectedUser) return;
    grantAdminMutation.mutate(selectedUser.id);
  };
  
  const handleRevokeAdmin = () => {
    if (!selectedUser) return;
    revokeAdminMutation.mutate(selectedUser.id);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : (
                        <Badge variant="outline">Customer</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSelectUser(user)}
                      >
                        <UserCog className="mr-1 h-4 w-4" /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* User Management Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Management</DialogTitle>
            <DialogDescription>
              Manage user settings and permissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="border rounded-md p-4 space-y-2">
                <h3 className="font-medium text-lg">{selectedUser.fullName}</h3>
                <p className="text-muted-foreground">{selectedUser.email}</p>
                <p className="text-sm">Username: {selectedUser.username}</p>
                <p className="text-sm">Joined: {formatDate(selectedUser.createdAt)}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminStatus">Admin Privileges</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p>{selectedUser.isAdmin ? "Admin Status" : "Grant Administrative Access"}</p>
                    <p className="text-sm text-muted-foreground">
                      Admins can manage products, categories, orders, and other users
                    </p>
                  </div>
                  <Switch
                    id="adminStatus"
                    checked={selectedUser.isAdmin}
                    disabled={false}
                    onCheckedChange={(checked) => checked ? handleGrantAdmin() : handleRevokeAdmin()}
                  />
                </div>
                {selectedUser.isAdmin && (
                  <p className="text-sm italic text-muted-foreground mt-2">
                    This user currently has admin privileges.
                  </p>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
                {!selectedUser.isAdmin ? (
                  <Button 
                    onClick={handleGrantAdmin}
                    disabled={grantAdminMutation.isPending}
                  >
                    {grantAdminMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Grant Admin Access
                  </Button>
                ) : (
                  <Button 
                    onClick={handleRevokeAdmin}
                    disabled={revokeAdminMutation.isPending}
                    variant="destructive"
                  >
                    {revokeAdminMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Revoke Admin Access
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
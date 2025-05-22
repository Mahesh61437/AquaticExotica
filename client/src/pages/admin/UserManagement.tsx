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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Loader2, UserCog, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface UserWithoutPassword extends Omit<User, 'password'> {}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function UserManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithoutPassword | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch users with pagination and search
  const { data: usersResponse, isLoading } = useQuery<PaginatedResponse<UserWithoutPassword>>({
    queryKey: ["/api/admin/users", currentPage, itemsPerPage, searchEmail],
    queryFn: async ({ queryKey }) => {
      const basePath = queryKey[0] as string;
      const page = queryKey[1] as number;
      const limit = queryKey[2] as number;
      const email = queryKey[3] as string;
      
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      
      if (email) {
        params.append('email', email);
      }
      
      const res = await fetch(`${basePath}?${params.toString()}`, {
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
  });

  // Update user admin status mutation - grant admin
  const grantAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch("/api/admin/make-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to grant admin privileges");
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
    onError: (error: Error) => {
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
      const res = await fetch("/api/admin/revoke-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to revoke admin privileges");
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
    onError: (error: Error) => {
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchEmail(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        
        <div className="w-full md:w-auto flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Input 
              type="text" 
              placeholder="Search by email..."
              value={searchEmail}
              onChange={handleSearchChange}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
          </div>
        </div>
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
              {usersResponse && usersResponse.data.length > 0 ? (
                usersResponse.data.map((user) => (
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
          
          {/* Pagination Controls */}
          {usersResponse && usersResponse.pagination && (
            <div className="flex items-center justify-between py-4 px-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="itemsPerPage">Show</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder={itemsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  of {usersResponse.pagination.totalCount} entries
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="mx-2 text-sm">
                  Page {currentPage} of {usersResponse.pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === usersResponse.pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(usersResponse.pagination.totalPages)}
                  disabled={currentPage === usersResponse.pagination.totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
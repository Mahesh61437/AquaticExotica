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
import { User } from "@/types";
import { Loader2, UserCog, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import React from "react";

// Define new user type based on API response
interface ApiUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isAdmin: boolean;
  dateJoined: string;
}

// Define paginated response type
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
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch users with pagination and search
  const { data: usersResponse, isLoading } = useQuery<ApiUser[] | PaginatedResponse<ApiUser>>({
    queryKey: ["/api/users/", currentPage, itemsPerPage, searchEmail],
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
      
      return await apiRequest(`${basePath}?${params.toString()}`);
    },
  });
  
  // Extract users array from response
  const users: ApiUser[] = React.useMemo(() => {
    if (!usersResponse) return [];
    
    // Check if response is paginated
    if (usersResponse && typeof usersResponse === 'object' && 'data' in usersResponse) {
      return (usersResponse as PaginatedResponse<ApiUser>).data || [];
    }
    
    // Check if response is a direct array
    if (Array.isArray(usersResponse)) {
      return usersResponse;
    }
    
    return [];
  }, [usersResponse]);

  // Update user admin status mutation - grant admin
  const grantAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("/api/users/make-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/"] });
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
      return await apiRequest("/api/users/revoke-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/"] });
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

  const handleSelectUser = (user: ApiUser) => {
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
              {users.map((user: ApiUser) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.firstName || user.lastName || user.username}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.email || "No email"}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{formatDate(user.dateJoined)}</TableCell>
                  <TableCell>
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {user.isAdmin ? "Admin" : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectUser(user)}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {users.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select value={String(itemsPerPage)} onValueChange={(value) => handleItemsPerPageChange({ target: { value } } as any)}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {(usersResponse as PaginatedResponse<ApiUser>)?.pagination?.totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === ((usersResponse as PaginatedResponse<ApiUser>)?.pagination?.totalPages || 1)}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange((usersResponse as PaginatedResponse<ApiUser>)?.pagination?.totalPages || 1)}
              disabled={currentPage === ((usersResponse as PaginatedResponse<ApiUser>)?.pagination?.totalPages || 1)}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User Management Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedUser.firstName && selectedUser.lastName 
                    ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                    : selectedUser.firstName || selectedUser.lastName || selectedUser.username}</p>
                  <p><strong>Email:</strong> {selectedUser.email || "No email"}</p>
                  <p><strong>Username:</strong> {selectedUser.username}</p>
                  <p><strong>Phone:</strong> {selectedUser.phone || "No phone"}</p>
                  <p><strong>Joined:</strong> {formatDate(selectedUser.dateJoined)}</p>
                  <p><strong>Current Role:</strong> {selectedUser.isAdmin ? "Admin" : "User"}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedUser && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="admin-status"
                  checked={selectedUser.isAdmin}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleGrantAdmin();
                    } else {
                      handleRevokeAdmin();
                    }
                  }}
                  disabled={grantAdminMutation.isPending || revokeAdminMutation.isPending}
                />
                <Label htmlFor="admin-status">
                  {selectedUser.isAdmin ? "Revoke Admin" : "Grant Admin"} privileges
                </Label>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={grantAdminMutation.isPending || revokeAdminMutation.isPending}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
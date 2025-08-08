import { useState } from "react";
import { DataTable, PaginationProps } from "@/components/admin/DataTable";
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

export default function UserManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [debouncedSearchEmail, setDebouncedSearchEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
  const [fetchedPages, setFetchedPages] = useState<Set<number>>(new Set());
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchEmail(searchEmail);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchEmail]);

  // Build API endpoint for users
  const buildUsersEndpoint = (page: number) => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(itemsPerPage)
    });
    
    if (debouncedSearchEmail) {
      params.append('email', debouncedSearchEmail);
    }
    
    return `/api/users/?${params.toString()}`;
  };

  // Fetch current page of users
  const { data: currentPageData, isLoading } = useQuery({
    queryKey: ["/api/users/", currentPage, itemsPerPage, debouncedSearchEmail],
    queryFn: async () => {
      console.log('👥 UserManagement API call:', buildUsersEndpoint(currentPage));
      const response = await apiRequest(buildUsersEndpoint(currentPage));
      
      // Handle new pagination format: { count, next, previous, results }
      if (response && typeof response === 'object' && 'results' in response) {
        return response.results || [];
      }
      
      // Fallback to array format
      return response || [];
    },
  });
  
  // Update all users when current page data changes
  React.useEffect(() => {
    if (currentPageData && currentPageData.length > 0) {
      setAllUsers(prev => {
        const newUsers = [...prev];
        const startIndex = (currentPage - 1) * itemsPerPage;
        
        // Replace users for this page
        currentPageData.forEach((user: ApiUser, index: number) => {
          newUsers[startIndex + index] = user;
        });
        
        return newUsers;
      });
      
      setFetchedPages(prev => new Set(Array.from(prev).concat([currentPage])));
      
      // Check if we have more pages
      if (currentPageData.length < itemsPerPage) {
        setHasMorePages(false);
      }
    } else if (currentPageData && currentPageData.length === 0) {
      // No more data
      setHasMorePages(false);
    }
  }, [currentPageData, currentPage, itemsPerPage]);

  // Reset pagination when search changes
  const prevSearchEmailRef = React.useRef(debouncedSearchEmail);
  React.useEffect(() => {
    // Only reset if the search query actually changed to a different value
    if (prevSearchEmailRef.current !== debouncedSearchEmail) {
      setAllUsers([]);
      setFetchedPages(new Set());
      setHasMorePages(true);
      setCurrentPage(1);
      prevSearchEmailRef.current = debouncedSearchEmail;
    }
  }, [debouncedSearchEmail]);

  // Function to fetch a specific page
  const fetchPage = async (page: number) => {
    if (fetchedPages.has(page)) return;
    
    setIsLoadingMore(true);
    try {
      const response = await apiRequest(buildUsersEndpoint(page));
      
      // Handle new pagination format: { count, next, previous, results }
      let pageData;
      if (response && typeof response === 'object' && 'results' in response) {
        pageData = response.results || [];
      } else {
        pageData = response || [];
      }
      
      setAllUsers(prev => {
        const newUsers = [...prev];
        const startIndex = (page - 1) * itemsPerPage;
        
        // Replace users for this page
        pageData.forEach((user: ApiUser, index: number) => {
          newUsers[startIndex + index] = user;
        });
        
        return newUsers;
      });
      
      setFetchedPages(prev => new Set(Array.from(prev).concat([page])));
      
      // Check if we have more pages
      if (pageData.length < itemsPerPage) {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Error fetching page:', page, error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Calculate total pages based on fetched data
  const totalPages = Math.max(
    Math.ceil(allUsers.length / itemsPerPage),
    Math.max(...Array.from(fetchedPages), 0)
  );

  // Get users for current page
  const users: ApiUser[] = allUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ).filter(Boolean);

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

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    
    // Fetch the page if not already fetched
    if (!fetchedPages.has(page)) {
      await fetchPage(page);
    }
    
    // Pre-fetch next page if available
    if (hasMorePages && !fetchedPages.has(page + 1)) {
      fetchPage(page + 1);
    }
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setAllUsers([]);
    setFetchedPages(new Set());
    setHasMorePages(true);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>
      </div>

      {users && (
        <DataTable 
          data={users}
          searchField={{
            placeholder: "Search by email...",
            value: searchEmail,
            onChange: setSearchEmail
          }}
          columns={[
            {
              header: "Name",
              accessor: (user: ApiUser) => (
                <div className="flex flex-col">
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                  <span className="text-sm text-muted-foreground">@{user.username}</span>
                </div>
              )
            },
            {
              header: "Email",
              accessor: "email"
            },
            {
              header: "Phone",
              accessor: (user: ApiUser) => user.phone || "N/A"
            },
            {
              header: "Joined",
              accessor: (user: ApiUser) => formatDate(user.dateJoined)
            },
            {
              header: "Role",
              accessor: (user: ApiUser) => (
                <Badge variant={user.isAdmin ? "default" : "outline"}>
                  {user.isAdmin ? "Admin" : "User"}
                </Badge>
              )
            },
            {
              header: "Actions",
              accessor: (user: ApiUser) => (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectUser(user)}
                  >
                    <UserCog className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </div>
              ),
              className: "text-right"
            }
          ]}
          pagination={{
            page: currentPage,
            limit: itemsPerPage,
            totalCount: allUsers.length,
            totalPages: totalPages
          }}
          isLoading={isLoading}
          emptyMessage="No users found."
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User: {selectedUser?.firstName} {selectedUser?.lastName}</DialogTitle>
            <DialogDescription>
              Manage admin privileges for this user.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Admin Status</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {selectedUser?.isAdmin ? "Admin privileges granted" : "Regular user"}
                </span>
                <Switch 
                  checked={selectedUser?.isAdmin || false}
                  disabled={grantAdminMutation.isPending || revokeAdminMutation.isPending}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>User Details</Label>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {selectedUser?.firstName} {selectedUser?.lastName}</div>
                <div><strong>Email:</strong> {selectedUser?.email}</div>
                <div><strong>Username:</strong> @{selectedUser?.username}</div>
                <div><strong>Phone:</strong> {selectedUser?.phone || "N/A"}</div>
                <div><strong>Joined:</strong> {selectedUser ? formatDate(selectedUser.dateJoined) : ""}</div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            {selectedUser?.isAdmin ? (
              <Button 
                variant="destructive"
                onClick={handleRevokeAdmin}
                disabled={revokeAdminMutation.isPending}
              >
                {revokeAdminMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Revoke Admin
              </Button>
            ) : (
              <Button 
                onClick={handleGrantAdmin}
                disabled={grantAdminMutation.isPending}
              >
                {grantAdminMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Grant Admin
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
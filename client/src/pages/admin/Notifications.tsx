import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Bell, Filter, Search, Check, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/use-notifications';
import { getNotificationTypeInfo, formatNotificationTime } from '@/lib/notifications-api';
import { Notification } from '@/types/notifications';
import { Link } from 'wouter';

export default function Notifications() {
  console.log('🔔 Notifications page loaded');
  
  const [filters, setFilters] = useState({
    type: '',
    is_read: undefined as boolean | undefined,
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const {
    notifications,
    totalCount,
    hasNext,
    hasPrevious,
    unreadCount,
    isLoading,
    isError,
    error,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refresh,
    isMarkingAsRead,
    isMarkingAsUnread,
    isMarkingAllAsRead,
    isDeleting
  } = useNotifications({
    filters: {
      ...filters,
      page: currentPage,
      page_size: 20
    },
    autoRefresh: true
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    } else {
      setSelectedNotifications(new Set());
    }
  };

  const toggleNotificationSelection = (notificationId: number) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
    
    // Update select all state
    setSelectAll(newSelected.size === notifications.length && notifications.length > 0);
  };

  const handleMarkSelectedAsRead = () => {
    selectedNotifications.forEach(id => {
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        markAsRead(id);
      }
    });
    setSelectedNotifications(new Set());
    setSelectAll(false);
  };

  const handleMarkSelectedAsUnread = () => {
    selectedNotifications.forEach(id => {
      const notification = notifications.find(n => n.id === id);
      if (notification && notification.is_read) {
        markAsUnread(id);
      }
    });
    setSelectedNotifications(new Set());
    setSelectAll(false);
  };

  const handleDeleteSelected = () => {
    selectedNotifications.forEach(id => {
      deleteNotification(id);
    });
    setSelectedNotifications(new Set());
    setSelectAll(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setSelectedNotifications(new Set());
    setSelectAll(false);
  };

  const getNotificationLink = (notification: Notification): string => {
    switch (notification.type) {
      case 'user_signup':
        return '/admin/users';
      case 'order_created':
      case 'order_status_change':
        return notification.data.order_id ? `/admin/orders/${notification.data.order_id}` : '/admin/orders';
      case 'stock_notification':
      case 'low_stock':
        return notification.data.product_id ? `/admin/products/${notification.data.product_id}` : '/admin/products';
      default:
        return '/admin';
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <>
      <Helmet>
        <title>Notifications - Admin Dashboard</title>
        <meta name="description" content="Manage admin notifications" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">
                {totalCount} total notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type filter */}
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="user_signup">User Signup</SelectItem>
                  <SelectItem value="order_created">Order Created</SelectItem>
                  <SelectItem value="stock_notification">Stock Notification</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="order_status_change">Order Status Change</SelectItem>
                </SelectContent>
              </Select>

              {/* Read status filter */}
              <Select 
                value={filters.is_read === undefined ? '' : filters.is_read.toString()} 
                onValueChange={(value) => handleFilterChange('is_read', value === '' ? undefined : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All status</SelectItem>
                  <SelectItem value="false">Unread only</SelectItem>
                  <SelectItem value="true">Read only</SelectItem>
                </SelectContent>
              </Select>

              {/* Bulk actions */}
              {selectedNotifications.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkSelectedAsRead}
                    disabled={isMarkingAsRead}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkSelectedAsUnread}
                    disabled={isMarkingAsUnread}
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Mark Unread
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notifications...</p>
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">Error loading notifications: {error?.message}</p>
                <Button onClick={refresh}>Try Again</Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-600">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <>
                {/* Select all header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select all ({selectedNotifications.size} selected)
                    </span>
                  </div>
                </div>

                {/* Notifications */}
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => {
                    const typeInfo = getNotificationTypeInfo(notification.type);
                    const isSelected = selectedNotifications.has(notification.id);
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.is_read ? 'bg-blue-50/30' : ''
                        } ${isSelected ? 'bg-blue-100' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Selection checkbox */}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleNotificationSelection(notification.id)}
                          />
                          
                          {/* Notification icon */}
                          <div className={`w-10 h-10 rounded-full ${typeInfo.bgColor} ${typeInfo.borderColor} border flex items-center justify-center shrink-0`}>
                            <span className="text-lg">{typeInfo.icon}</span>
                          </div>
                          
                          {/* Notification content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {notification.title}
                                  </h3>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-2">{notification.message}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span>{formatNotificationTime(notification.created_at || notification.createdAt || '')}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {notification.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex items-center gap-2 shrink-0">
                                {notification.is_read ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsUnread(notification.id)}
                                    disabled={isMarkingAsUnread}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="Mark as unread"
                                  >
                                    <EyeOff className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    disabled={isMarkingAsRead}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Mark as read"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Link href={getNotificationLink(notification)}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="View details"
                                  >
                                    View
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  disabled={isDeleting}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete notification"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} notifications
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={!hasPrevious || isLoading}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={!hasNext || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

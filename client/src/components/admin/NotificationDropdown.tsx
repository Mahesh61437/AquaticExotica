import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2, ExternalLink, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/use-notifications';
import { getNotificationTypeInfo, formatNotificationTime } from '@/lib/notifications-api';
import { Notification } from '@/types/notifications';
import { Link } from 'wouter';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());
  const [processingNotification, setProcessingNotification] = useState<number | null>(null);

  // Fetch recent notifications (last 10)
  const {
    notifications,
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
    filters: { page_size: 10 },
    autoRefresh: true
  });


  // Use real notifications
  const displayNotifications = notifications;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setSelectedNotifications(new Set());
  };

  const handleDeleteSelected = () => {
    selectedNotifications.forEach(id => {
      deleteNotification(id);
    });
    setSelectedNotifications(new Set());
  };

  const toggleNotificationSelection = (notificationId: number) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
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

  return (
    <div 
      ref={dropdownRef}
      className={`absolute top-full right-0 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-2 ${
        isOpen ? 'block' : 'hidden'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Refresh notifications"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {selectedNotifications.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllAsRead}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading notifications...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-red-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-red-300" />
            <p>Error loading notifications</p>
            <p className="text-xs text-gray-500 mt-2">{error?.message || 'Unknown error'}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {displayNotifications.map((notification, index) => {
                const typeInfo = getNotificationTypeInfo(notification.type);
                const isSelected = selectedNotifications.has(notification.id);
                
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    } ${isSelected ? 'bg-blue-100' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox for selection */}
                      <div className="flex items-center pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleNotificationSelection(notification.id)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {/* Notification icon */}
                      <div className={`w-8 h-8 rounded-full ${typeInfo.bgColor} ${typeInfo.borderColor} border flex items-center justify-center shrink-0`}>
                        <span className="text-sm">{typeInfo.icon}</span>
                      </div>
                      
                      {/* Notification content */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatNotificationTime(notification.created_at || notification.createdAt || '')}
                        </p>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.is_read ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setProcessingNotification(notification.id);
                              try {
                                await markAsRead(notification.id);
                              } finally {
                                setProcessingNotification(null);
                              }
                            }}
                            disabled={processingNotification === notification.id}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Mark as read"
                          >
                            {processingNotification === notification.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setProcessingNotification(notification.id);
                              try {
                                await markAsUnread(notification.id);
                              } finally {
                                setProcessingNotification(null);
                              }
                            }}
                            disabled={processingNotification === notification.id}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Mark as unread"
                          >
                            {processingNotification === notification.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setProcessingNotification(notification.id);
                            try {
                              await deleteNotification(notification.id);
                            } finally {
                              setProcessingNotification(null);
                            }
                          }}
                          disabled={processingNotification === notification.id}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete notification"
                        >
                          {processingNotification === notification.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {displayNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-100">
          <Link href="/admin/notifications">
            <button
              className="w-full text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => {
                console.log('🔔 View All Notifications clicked');
                onClose();
              }}
            >
              View All Notifications
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

import { apiRequest } from './queryClient';
import { NotificationsResponse, UnreadCountResponse, Notification, NotificationFilters } from '@/types/notifications';

export class NotificationsAPI {
  /**
   * Get paginated list of notifications
   */
  static async getNotifications(filters: NotificationFilters = {}): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.is_read !== undefined) params.append('is_read', filters.is_read.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    
    const endpoint = `/api/app_notifications/?${params.toString()}`;
    console.log('🔔 NotificationsAPI: Fetching notifications from:', endpoint);
    
    const response = await apiRequest(endpoint);
    
    if (response && typeof response === 'object') {
      // Handle different response formats
      let results = [];
      
      if ('results' in response) {
        // Standard paginated response
        results = response.results;
      } else if (Array.isArray(response)) {
        // Direct array response
        results = response;
      } else if ('data' in response && Array.isArray(response.data)) {
        // Alternative format with data field
        results = response.data;
      }
      
      if (Array.isArray(results)) {
        // Normalize the response format
        const normalizedResponse = {
          count: response.count || results.length,
          next: response.next || null,
          previous: response.previous || null,
          results: results.map((notification: any) => ({
            ...notification,
            is_read: notification.is_read ?? notification.isRead ?? false,
            created_at: notification.created_at ?? notification.createdAt ?? '',
            read_at: notification.read_at ?? notification.readAt ?? null
          }))
        };
        return normalizedResponse as NotificationsResponse;
      }
    }
    
    throw new Error('Invalid notifications API response format');
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(): Promise<number> {
    const response = await apiRequest('/api/app_notifications/unread-count/') as UnreadCountResponse;
    return response.unread_count || response.unreadCount || 0;
  }

  /**
   * Mark a specific notification as read
   */
  static async markAsRead(notificationId: number): Promise<Notification> {
    const response = await apiRequest(`/api/app_notifications/${notificationId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: true })
    });
    
    // Normalize the response format
    return {
      ...response,
      is_read: response.is_read ?? response.isRead ?? false,
      created_at: response.created_at ?? response.createdAt ?? '',
      read_at: response.read_at ?? response.readAt ?? null
    } as Notification;
  }

  /**
   * Mark a specific notification as unread
   */
  static async markAsUnread(notificationId: number): Promise<Notification> {
    const response = await apiRequest(`/api/app_notifications/${notificationId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: false })
    });
    
    // Normalize the response format
    return {
      ...response,
      is_read: response.is_read ?? response.isRead ?? false,
      created_at: response.created_at ?? response.createdAt ?? '',
      read_at: response.read_at ?? response.readAt ?? null
    } as Notification;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    await apiRequest('/api/app_notifications/mark-all-read/', {
      method: 'POST'
    });
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: number): Promise<void> {
    await apiRequest(`/api/app_notifications/${notificationId}/`, {
      method: 'DELETE'
    });
  }
}

/**
 * Get notification type display info
 */
export const getNotificationTypeInfo = (type: string) => {
  const typeMap = {
    user_signup: {
      icon: '👤',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    order_created: {
      icon: '🛒',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    stock_notification: {
      icon: '📦',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    low_stock: {
      icon: '⚠️',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    order_status_change: {
      icon: '📋',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  };
  
  return typeMap[type as keyof typeof typeMap] || {
    icon: '🔔',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  };
};

/**
 * Format notification time
 */
export const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationsAPI } from '@/lib/notifications-api';
import { Notification, NotificationFilters } from '@/types/notifications';

interface UseNotificationsOptions {
  filters?: NotificationFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  console.log('🔔 useNotifications hook called with options:', options);
  
  const {
    filters = {},
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const queryClient = useQueryClient();
  console.log('🔔 useNotifications: QueryClient initialized');

  // Fetch notifications
  console.log('🔔 useNotifications: Setting up notifications query with filters:', filters);
  const {
    data: notificationsResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-notifications', filters],
    queryFn: () => {
      console.log('🔔 useNotifications: Executing query function');
      return NotificationsAPI.getNotifications(filters);
    },
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: false,
  });
  
  console.log('🔔 useNotifications: Query result:', {
    notificationsResponse,
    isLoading,
    isError,
    error: error?.message
  });


  // Fetch unread count
  console.log('🔔 useNotifications: Setting up unread count query');
  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: ['admin-notifications-unread-count'],
    queryFn: () => {
      console.log('🔔 useNotifications: Executing unread count query');
      return NotificationsAPI.getUnreadCount();
    },
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: false,
  });
  
  console.log('🔔 useNotifications: Unread count result:', unreadCount);

  // Mark as read mutation
  console.log('🔔 useNotifications: Setting up markAsRead mutation');
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => {
      console.log('🔔 useNotifications: Marking notification as read:', id);
      return NotificationsAPI.markAsRead(id);
    },
    onSuccess: (data, id) => {
      console.log('🔔 useNotifications: Mark as read success for ID:', id);
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
    },
    onError: (error, id) => {
      console.error('🔔 useNotifications: Mark as read error for ID:', id, error);
    },
  });

  // Mark as unread mutation
  const markAsUnreadMutation = useMutation({
    mutationFn: NotificationsAPI.markAsUnread,
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: NotificationsAPI.markAllAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: NotificationsAPI.deleteNotification,
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
    },
  });

  // Helper functions
  const markAsRead = (notificationId: number) => {
    return markAsReadMutation.mutateAsync(notificationId);
  };

  const markAsUnread = (notificationId: number) => {
    return markAsUnreadMutation.mutateAsync(notificationId);
  };

  const markAllAsRead = () => {
    return markAllAsReadMutation.mutateAsync();
  };

  const deleteNotification = (notificationId: number) => {
    return deleteNotificationMutation.mutateAsync(notificationId);
  };

  const refresh = () => {
    refetch();
    refetchUnreadCount();
  };


  return {
    // Data
    notifications: notificationsResponse?.results || [],
    totalCount: notificationsResponse?.count || 0,
    hasNext: !!notificationsResponse?.next,
    hasPrevious: !!notificationsResponse?.previous,
    unreadCount,
    
    // Loading states
    isLoading,
    isError,
    error,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAsUnread: markAsUnreadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    
    // Actions
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
}

/**
 * Hook for unread count only (lightweight)
 */
export function useUnreadCount() {
  const {
    data: unreadCount = 0,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['admin-notifications-unread-count'],
    queryFn: NotificationsAPI.getUnreadCount,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: false,
  });

  return {
    unreadCount,
    isLoading,
    refetch,
  };
}

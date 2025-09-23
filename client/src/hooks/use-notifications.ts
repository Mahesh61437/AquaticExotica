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
  const {
    filters = {},
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notificationsResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-notifications', filters],
    queryFn: () => NotificationsAPI.getNotifications(filters),
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: false,
  });

  // Fetch unread count
  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: ['admin-notifications-unread-count'],
    queryFn: NotificationsAPI.getUnreadCount,
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: autoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: false,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: NotificationsAPI.markAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
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
    markAsReadMutation.mutate(notificationId);
  };

  const markAsUnread = (notificationId: number) => {
    markAsUnreadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const deleteNotification = (notificationId: number) => {
    deleteNotificationMutation.mutate(notificationId);
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

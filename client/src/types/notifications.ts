export interface Notification {
  id: number;
  type: 'user_signup' | 'order_created' | 'stock_notification' | 'low_stock' | 'order_status_change';
  title: string;
  message: string;
  data: Record<string, any>;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
  read_at?: string | null;
  readAt?: string | null;
}

export interface NotificationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

export interface UnreadCountResponse {
  unread_count?: number;
  unreadCount?: number;
}

export interface NotificationFilters {
  type?: string;
  is_read?: boolean;
  page?: number;
  page_size?: number;
}

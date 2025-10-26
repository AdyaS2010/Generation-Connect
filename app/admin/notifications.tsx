import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Bell, UserCheck, MessageSquare, AlertCircle, Clock } from 'lucide-react-native';

interface AdminNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  read_at: string | null;
  created_at: string;
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await supabase
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    fetchNotifications();
  };

  const handleNotificationPress = (notification: AdminNotification) => {
    handleMarkAsRead(notification.id);

    if (notification.related_type === 'student_profile') {
      router.push('/admin/students');
    } else if (notification.related_type === 'support_ticket') {
      router.push('/admin/tickets');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_student':
        return <UserCheck size={24} color="#2563eb" />;
      case 'new_ticket':
        return <MessageSquare size={24} color="#10b981" />;
      case 'urgent_ticket':
        return <AlertCircle size={24} color="#ef4444" />;
      default:
        return <Bell size={24} color="#6c757d" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_student':
        return '#eff6ff';
      case 'new_ticket':
        return '#f0fdf4';
      case 'urgent_ticket':
        return '#fee2e2';
      default:
        return '#f8f9fa';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#dee2e6" />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>
              You'll receive notifications here when students sign up or support tickets are
              submitted
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <Pressable
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read_at && styles.notificationCardUnread,
                { backgroundColor: getNotificationColor(notification.notification_type) },
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationIcon}>
                {getNotificationIcon(notification.notification_type)}
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.read_at && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <View style={styles.notificationFooter}>
                  <Clock size={12} color="#6c757d" />
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.created_at)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  notificationCardUnread: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6c757d',
  },
});

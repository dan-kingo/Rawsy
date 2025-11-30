import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Appbar, List, Surface, ActivityIndicator, Text, Badge, Button, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const BASE_URL = 'http://10.184.150.42:4000';

type NotificationType = 'all' | 'order' | 'quote' | 'maintenance';

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationType>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.log('Fetch notifications failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.log('Mark as read failed:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${BASE_URL}/api/notifications/read/all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.log('Mark all as read failed:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'order') return n.type?.startsWith('order');
    if (filter === 'quote') return n.type?.startsWith('quote');
    if (filter === 'maintenance') return ['ticket_created', 'ticket_resolved', 'message'].includes(n.type);
    return true;
  });

  const getNotificationIcon = (type: string, read: boolean) => {
    const iconColor = read ? '#6B7280' : '#3B82F6';
    
    if (type?.startsWith('order')) return { icon: 'package-variant', color: iconColor };
    if (type?.startsWith('quote')) return { icon: 'currency-usd', color: iconColor };
    if (['ticket_created', 'ticket_resolved', 'message'].includes(type)) return { icon: 'tools', color: iconColor };
    
    return { icon: read ? 'bell-outline' : 'bell', color: iconColor };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header 
        elevated 
        style={styles.header}
        mode="center-aligned"
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content 
          title="Notifications" 
          titleStyle={styles.headerTitle}
        />
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <Badge style={styles.headerBadge}>{unreadCount}</Badge>
          )}
          {filteredNotifications.length > 0 && (
            <Appbar.Action 
              icon="check-all" 
              onPress={markAllAsRead}
              size={24}
            />
          )}
        </View>
      </Appbar.Header>

      {/* Filter Chips - Fixed to stay at top */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {(['all', 'order', 'quote', 'maintenance'] as NotificationType[]).map((type) => (
            <Chip
              key={type}
              selected={filter === type}
              onPress={() => setFilter(type)}
              style={[
                styles.filterChip,
                filter === type && styles.filterChipActive
              ]}
              textStyle={[
                styles.filterChipText,
                filter === type && styles.filterChipTextActive
              ]}
              showSelectedOverlay
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Area - Takes remaining space */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? "You're all caught up!" 
                : `No ${filter} notifications`
              }
            </Text>
            <Button 
              mode="outlined" 
              onPress={fetchNotifications}
              style={styles.retryButton}
            >
              Refresh
            </Button>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#3B82F6']}
                tintColor="#3B82F6"
              />
            }
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const { icon, color } = getNotificationIcon(item.type, item.read);
              return (
                <Surface
                  style={[
                    styles.card,
                    item.read ? styles.readCard : styles.unreadCard
                  ]}
                  elevation={2}
                >
                  <List.Item
                    title={item.title}
                    titleNumberOfLines={2}
                    titleStyle={[
                      styles.title,
                      item.read ? styles.readText : styles.unreadText
                    ]}
                    description={item.message}
                    descriptionNumberOfLines={3}
                    descriptionStyle={styles.description}
                    left={(props) => (
                      <View style={styles.iconContainer}>
                        <List.Icon
                          {...props}
                          icon={icon}
                          color={color}
                          style={styles.icon}
                        />
                        {!item.read && <View style={styles.unreadDot} />}
                      </View>
                    )}
                    right={() => (
                      <View style={styles.rightContent}>
                        <Text style={styles.timeText}>
                          {formatTime(item.createdAt)}
                        </Text>
                        {!item.read && (
                          <Badge 
                            size={8} 
                            style={styles.newBadge}
                          />
                        )}
                      </View>
                    )}
                    onPress={() => markAsRead(item._id)}
                    style={styles.listItem}
                  />
                </Surface>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBadge: { 
    backgroundColor: '#EF4444', 
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 60, // Fixed height for filter section
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
    height: 36,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1, // Takes all remaining space
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    borderColor: '#3B82F6',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8, // Reduced top padding to bring notifications closer to filters
    paddingBottom: 24,
  },
  card: {
    marginVertical: 4, // Reduced vertical margin
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E1EFFE',
    borderWidth: 1,
  },
  readCard: {
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  listItem: {
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginRight: 0,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  unreadText: {
    color: '#1F2937',
  },
  readText: {
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 4,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: '#EF4444',
    marginTop: 4,
  },
});
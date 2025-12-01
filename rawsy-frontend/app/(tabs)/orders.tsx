import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
  Surface,
  Menu,
  Searchbar,
  Snackbar,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect,useCallback } from 'react';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../../services/api';
import PaymentUploadDialog from '../../components/PaymentUploadDialog';
import PaymentProofViewer from '../../components/PaymentProofViewer';
 import { useFocusEffect } from '@react-navigation/native';

export default function OrdersScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarError, setSnackbarError] = useState(false);
const [reviewedOrders, setReviewedOrders] = useState<string[]>([]);

 useFocusEffect(
  useCallback(() => {
    // refetch orders and reviewed orders whenever screen is focused
    fetchOrders();
    fetchMyReviews();
  }, [])
);
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'supplier' ? '/orders/supplier-orders' : '/orders/my-orders';
      const response = await api.get(endpoint);
      const fetchedOrders = response.data.orders || [];

      // Sort by newest first (for suppliers, show new orders at top)
      const sortedOrders = [...fetchedOrders].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(sortedOrders);
      applyFilters(sortedOrders, selectedFilter, searchQuery);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchMyReviews = async () => {
  try {
    const res = await api.get('/reviews/my');
    const reviewed = res.data.map((r: any) => r.order);
    setReviewedOrders(reviewed);
  } catch (err) {
    console.log("Could not fetch user reviews");
  }
};

  const applyFilters = (orderList: any[], filter: string, search: string) => {
    let filtered = [...orderList];

    // Filter by status
    if (filter === 'placed') {
      filtered = filtered.filter(o => o.status === 'placed');
    } else if (filter === 'confirmed') {
      filtered = filtered.filter(o => o.status === 'confirmed');
    } else if (filter === 'in_transit') {
      filtered = filtered.filter(o => o.status === 'in_transit');
    } else if (filter === 'delivered') {
      filtered = filtered.filter(o => o.status === 'delivered');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(o => o.status === 'rejected' || o.status === 'cancelled');
    }

    // Search by reference, buyer/supplier name, or product name
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(o => {
        const ref = o.reference?.toLowerCase() || '';
        const buyerName = o.buyer?.name?.toLowerCase() || '';
        const supplierName = o.supplier?.name?.toLowerCase() || '';
        const productNames = o.items?.map((item: any) => item.name?.toLowerCase()).join(' ') || '';

        return ref.includes(lowerSearch) ||
               buyerName.includes(lowerSearch) ||
               supplierName.includes(lowerSearch) ||
               productNames.includes(lowerSearch);
      });
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    applyFilters(orders, selectedFilter, searchQuery);
  }, [selectedFilter, searchQuery]);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setFilterMenuVisible(false);
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setActioningOrderId(orderId);
      await api.put(`/orders/${orderId}/accept`);
      Alert.alert('Success', 'Order accepted successfully');
      await fetchOrders();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to accept order');
    } finally {
      setActioningOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setActioningOrderId(orderId);
              await api.put(`/orders/${orderId}/reject`);
              Alert.alert('Success', 'Order rejected');
              await fetchOrders();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to reject order');
            } finally {
              setActioningOrderId(null);
            }
          },
        },
      ]
    );
  };

  const handleMarkShipped = async (orderId: string) => {
    try {
      setActioningOrderId(orderId);
      await api.put(`/orders/${orderId}/ship`, {});
      Alert.alert('Success', 'Order marked as shipped');
      await fetchOrders();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to mark as shipped');
    } finally {
      setActioningOrderId(null);
    }
  };
const handleCancelOrder = async (orderId: string) => {
  Alert.alert(
    'Cancel Order',
    'Are you sure you want to cancel this order?',
    [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            setActioningOrderId(orderId); // show loading state on this order
            await api.put(`/orders/${orderId}/cancel`); // call backend cancel endpoint
              setSnackbarMessage('Order cancelled successfully');
              setSnackbarError(false);
              setSnackbarVisible(true);
              await fetchOrders(); // refresh orders list
          } catch (error: any) {
              const msg = error?.response?.data?.error || 'Failed to cancel order';
              setSnackbarMessage(msg);
              setSnackbarError(true);
              setSnackbarVisible(true);
          } finally {
            setActioningOrderId(null);
          }
        },
      },
    ]
  );
};

  const handleMarkDelivered = async (orderId: string) => {
    try {
      setActioningOrderId(orderId);
      await api.put(`/orders/${orderId}/deliver`);
      Alert.alert('Success', 'Order marked as delivered');
      await fetchOrders();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to mark as delivered');
    } finally {
      setActioningOrderId(null);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleUploadPayment = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowPaymentDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
        return '#f59e0b';
      case 'confirmed':
        return '#3b82f6';
      case 'in_transit':
        return '#8b5cf6';
      case 'delivered':
        return '#10b981';
      case 'rejected':
      case 'cancelled':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'placed':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending_review':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Orders" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  const displayOrders = filteredOrders.length > 0 ? filteredOrders : orders;
  const isSupplier = user?.role === 'supplier';
  const isManufacturer = user?.role === 'manufacturer';
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={isSupplier ? 'Supplier Orders' : 'My Orders'} />
        {user?.role === 'manufacturer' && (
          <Appbar.Action icon="file-document" onPress={() => router.push('/invoices')} />
        )}
        {(isSupplier || isManufacturer) && (
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="filter-variant"
                onPress={() => setFilterMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => handleFilterChange('all')}
              title="All Orders"
              leadingIcon={selectedFilter === 'all' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => handleFilterChange('placed')}
              title="New Orders"
              leadingIcon={selectedFilter === 'placed' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => handleFilterChange('confirmed')}
              title="Confirmed"
              leadingIcon={selectedFilter === 'confirmed' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => handleFilterChange('in_transit')}
              title="In Transit"
              leadingIcon={selectedFilter === 'in_transit' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => handleFilterChange('delivered')}
              title="Delivered"
              leadingIcon={selectedFilter === 'delivered' ? 'check' : undefined}
            />
            <Menu.Item
              onPress={() => handleFilterChange('rejected')}
              title="Rejected"
              leadingIcon={selectedFilter === 'rejected' ? 'check' : undefined}
            />
          </Menu>
        )}
      </Appbar.Header>

      {isSupplier && (
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search orders, products..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {displayOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="shopping-bag" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              No orders found
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              {user?.role === 'supplier'
                ? 'Orders from buyers will appear here'
                : 'Place your first order to get started'}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {displayOrders.map((order: any) => (
              <Card key={order._id} style={styles.orderCard}>
                <Card.Content>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text variant="titleMedium" style={styles.orderReference}>
                        {order.reference}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {user?.role === 'supplier' ? 'From' : 'Supplier'}:{' '}
                        {user?.role === 'supplier' ? order.buyer?.name : order.supplier?.name}
                      </Text>
                    </View>
                    <Chip
                      style={{ backgroundColor: getStatusColor(order.status) }}
                      textStyle={{ color: '#fff', fontSize: 11 }}
                    >
                      {getStatusLabel(order.status)}
                    </Chip>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.orderItems}>
                    {order.items?.map((item: any, index: number) => (
                      <View key={index} style={styles.itemRow}>
                        <Text variant="bodyMedium" style={styles.itemName}>
                          {item.name}
                        </Text>
                        <Text variant="bodyMedium" style={styles.itemQty}>
                          {item.quantity} {item.unit}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Surface style={[styles.paymentInfo, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                    <View style={styles.paymentRow}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Payment Method:
                      </Text>
                      <Text variant="bodyMedium" style={{ textTransform: 'capitalize' }}>
                        {order.paymentMethod?.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Payment Status:
                      </Text>
                      <Chip
                        style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus), height: 34 }}
                        textStyle={{ color: '#fff', fontSize: 14 }}
                      >
                        {order.paymentStatus}
                      </Chip>
                    </View>
                  </Surface>

                  <View style={styles.totalRow}>
                    <Text variant="titleMedium">Total:</Text>
                    <Text
                      variant="headlineSmall"
                      style={{ color: "#fff", fontWeight: 'bold' }}
                    >
                      {order.total} ETB
                    </Text>
                  </View>

                  <View style={styles.dateRow}>
                    <MaterialIcons name="schedule" size={14} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Placed {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {(() => {
                    const showUpload = user?.role === 'manufacturer' && order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' &&  order.status === 'confirmed';
                    const showCancel = user?.role === 'manufacturer' && String(order.status || '').trim().toLowerCase() === 'placed';

                    if (showUpload && showCancel) {
                      return (
                        <View style={styles.actionRow}>
                          <Button
                            mode="contained"
                            onPress={() => handleUploadPayment(order._id)}
                            style={[styles.actionBtnHalf, { marginRight: 8 }]}
                            icon="upload"
                          >
                            Upload Proof
                          </Button>

                          <Button
                            mode="contained"
                            onPress={() => handleCancelOrder(order._id)}
                            style={[styles.actionBtnHalf, { backgroundColor: '#ef4444' }]}
                            icon="cancel"
                            loading={actioningOrderId === order._id}
                            disabled={actioningOrderId === order._id}
                            textColor="#fff"
                          >
                            Cancel
                          </Button>
                        </View>
                      );
                    }

                    if (showUpload) {
                      return (
                        <Button
                          mode="contained"
                          onPress={() => handleUploadPayment(order._id)}
                          style={styles.uploadButton}
                          icon="upload"
                        >
                          Upload Payment Proof
                        </Button>
                      );
                    }

                    if (showCancel) {
                      return (
                        <Button
                          mode="contained"
                          onPress={() => handleCancelOrder(order._id)}
                          style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                          icon="cancel"
                          loading={actioningOrderId === order._id}
                          disabled={actioningOrderId === order._id}
                        >
                          Cancel Order
                        </Button>
                      );
                    }

                    return null;
                  })()}
                  {/* WRITE REVIEW BUTTON */}
{user?.role === 'manufacturer' &&
 order.status === 'delivered' &&
 !reviewedOrders.includes(order._id) && (
  <Button
    mode="contained"
    icon="star"
    style={[styles.actionButton, { marginTop: 8 }]}
    onPress={() =>
      router.push({
        pathname: "/ReviewForm",
        params: { orderId: String(order._id) },
      })
    }
  >
    Write Review
  </Button>
)}

                  {order.paymentProof && (
                    <View style={styles.paymentProofSection}>
                      <View style={[styles.proofHeader, { backgroundColor: theme.colors.primaryContainer }]}>
                        <MaterialIcons name="receipt" size={18} color={theme.colors.primary} />
                        <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}>
                          Payment Proof
                        </Text>
                      </View>
                      <PaymentProofViewer imageUrl={order.paymentProof} compact={true} />
                    </View>
                  )}

                  {isSupplier && (
                    <View style={styles.supplierActions}>
                      {order.status === 'placed' && (
                        <View style={styles.actionButtons}>
                          <Button
                            mode="outlined"
                            onPress={() => handleRejectOrder(order._id)}
                            loading={actioningOrderId === order._id}
                            disabled={actioningOrderId === order._id}
                            style={[styles.actionButton, { borderColor: theme.colors.error }]}
                            textColor={theme.colors.error}
                            icon="close"
                          >
                            Reject
                          </Button>
                          <Button
                            mode="contained"
                            onPress={() => handleAcceptOrder(order._id)}
                            loading={actioningOrderId === order._id}
                            disabled={actioningOrderId === order._id}
                            style={styles.actionButton}
                            icon="check"
                          >
                            Accept
                          </Button>
                        </View>
                      )}

                      {order.status === 'confirmed' && (
                        <Button
                          mode="contained"
                          onPress={() => handleMarkShipped(order._id)}
                          loading={actioningOrderId === order._id}
                          disabled={actioningOrderId === order._id}
                          style={styles.statusButton}
                          icon="truck"
                        >
                          Mark as Shipped
                        </Button>
                      )}

                      {order.status === 'in_transit' && (
                        <Button
                          mode="contained"
                          onPress={() => handleMarkDelivered(order._id)}
                          loading={actioningOrderId === order._id}
                          disabled={actioningOrderId === order._id}
                          style={styles.statusButton}
                          icon="check-circle"
                        >
                          Mark as Delivered
                        </Button>
                      )}
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {selectedOrderId && (
        <PaymentUploadDialog
          visible={showPaymentDialog}
          onDismiss={() => {
            setShowPaymentDialog(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
          onSuccess={() => {
            setShowPaymentDialog(false);
            setSelectedOrderId(null);
            fetchOrders();
          }}
        />
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: snackbarError ? '#b91c1c' : undefined }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderReference: {
    fontWeight: '600',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
  },
  itemQty: {
    fontWeight: '600',
  },
  paymentInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  uploadButton: {
    marginTop: 8,
  },
  paymentProofSection: {
    marginTop: 12,
  },
  proofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  proofSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  supplierActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnHalf: {
    flex: 1,
    paddingVertical: 6,
  },
  statusButton: {
    marginTop: 4,
  },
});

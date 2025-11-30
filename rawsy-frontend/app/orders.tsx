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
  Snackbar,
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../services/api';
import PaymentUploadDialog from '../components/PaymentUploadDialog';

export default function OrdersScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarError, setSnackbarError] = useState(false);

  // calling fetchOrders once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'supplier' ? '/orders/supplier-orders' : '/orders/my-orders';
      const response = await api.get(endpoint);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setActioningOrderId(orderId);
              await api.put(`/orders/${orderId}/cancel`);
              setSnackbarMessage('Order cancelled successfully');
              setSnackbarError(false);
              setSnackbarVisible(true);
              // refresh orders after cancellation
              await fetchOrders();
            } catch (err: any) {
              const msg = err.response?.data?.error || 'Failed to cancel order';
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="My Orders" />
      </Appbar.Header>

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
        {orders.length === 0 ? (
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
            {orders.map((order: any) => (
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
                        style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus), height: 24 }}
                        textStyle={{ color: '#fff', fontSize: 10 }}
                      >
                        {order.paymentStatus}
                      </Chip>
                    </View>
                  </Surface>

                  <View style={styles.totalRow}>
                    <Text variant="titleMedium">Total:</Text>
                    <Text
                      variant="headlineSmall"
                      style={{ color: theme.colors.primary, fontWeight: 'bold' }}
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

                  {/* Action buttons: upload payment proof and cancel order. Render side-by-side when both available */}
                  {(() => {
                    const showUpload = user?.role === 'manufacturer' && order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending';
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
                          textColor="#fff"
                        >
                          Cancel Order
                        </Button>
                      );
                    }

                    return null;
                  })()}

                  {order.paymentProof && (
                    <View style={[styles.proofSection, { backgroundColor: theme.colors.primaryContainer }]}>
                      <MaterialIcons name="check-circle" size={16} color={theme.colors.primary} />
                      <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                        Payment proof submitted
                      </Text>
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
  actionButton: {
    marginTop: 8,
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
  proofSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});

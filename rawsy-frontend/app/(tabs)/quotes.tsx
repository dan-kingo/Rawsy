import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Chip,
  ActivityIndicator,
  Button,
  Divider,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../../services/api';
import SupplierQuoteResponseDialog from '../../components/SupplierQuoteResponseDialog';
import OrderFromQuoteDialog from '../../components/OrderFromQuoteDialog';

export default function QuotesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    const id = (params as any).createdOrderId as string | undefined;
    if (id) {
      // an order was just created — refresh list and clear the param
      fetchQuotes();
      Alert.alert('Order placed', 'Your order was created successfully');
      router.replace('/(tabs)/quotes');
    }
  }, [params.createdOrderId]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'supplier' ? '/quotes/received' : '/quotes/mine';
      const response = await api.get(endpoint);
      setQuotes(response.data.quotes || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuotes();
    setRefreshing(false);
  };

  const handleSupplierResponse = (quote: any) => {
    setSelectedQuote(quote);
    setShowResponseDialog(true);
  };

  const handleBuyerAccept = (quote: any) => {
    setSelectedQuote(quote);
    setShowOrderDialog(true);
  };

  const handleBuyerDecline = async (quote: any) => {
    try {
      await api.put(`/quotes/${quote._id}/buyer-action`, { action: 'cancel' });
      await fetchQuotes();
    } catch (error: any) {
      console.error('Error declining quote:', error);
    }
  };

  const handleOrderSuccess = (orderId: string) => {
    // keep behavior simple: refresh list after an order is created
    fetchQuotes();
    Alert.alert('Order placed', 'Your order was created successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'supplier_counter':
      case 'supplier_accept':
        return '#3b82f6';
      case 'buyer_accept':
        return '#10b981';
      case 'rejected':
      case 'buyer_cancel':
        return '#ef4444';
      case 'converted':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'supplier_counter':
        return 'Counter Offer';
      case 'supplier_accept':
        return 'Accepted by Supplier';
      case 'buyer_accept':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'buyer_cancel':
        return 'Cancelled';
      case 'converted':
        return 'Converted to Order';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Quote Requests" />
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
        <Appbar.Content title="Quote Requests" />
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
        {quotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="request-quote" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              No quote requests
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              {user?.role === 'supplier'
                ? 'Quote requests from buyers will appear here'
                : 'Request quotes on negotiable products'}
            </Text>
          </View>
        ) : (
          <View style={styles.quotesList}>
            {quotes.map((quote: any) => (
              <Card key={quote._id} style={styles.quoteCard}>
                <Card.Content>
                  <View style={styles.quoteHeader}>
                    <View style={styles.quoteInfo}>
                      <Text variant="titleMedium" style={styles.productName}>
                        {quote.productSnapshot?.name || quote.product?.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {user?.role === 'supplier' ? 'From' : 'To'}:{' '}
                        {user?.role === 'supplier'
                          ? quote.buyer?.name
                          : quote.supplier?.name}
                      </Text>
                    </View>
                    <Chip
                      style={{ backgroundColor: getStatusColor(quote.status) }}
                      textStyle={{ color: '#fff', fontSize: 11 }}
                    >
                      {getStatusLabel(quote.status)}
                    </Chip>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Quantity
                      </Text>
                      <Text variant="titleMedium">
                        {quote?.counterMinimumQty ||quote.quantityRequested } {quote.productSnapshot?.unit}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Original Price
                      </Text>
                      <Text variant="titleMedium">
                        {quote.productSnapshot?.price} ETB
                      </Text>
                    </View>

                    {quote.counterPrice && (
                      <View style={styles.detailItem}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Offered Price
                        </Text>
                        <Text
                          variant="titleMedium"
                          style={{ color: theme.colors.primary, fontWeight: 'bold' }}
                        >
                          {quote.counterPrice} ETB
                        </Text>
                      </View>
                    )}
                  </View>

                  {quote.notes && (
                    <View style={styles.notesSection}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Notes:
                      </Text>
                      <Text variant="bodyMedium" style={styles.notes}>
                        {quote.notes}
                      </Text>
                    </View>
                  )}

                  {quote.supplierMessage && (
                    <View style={styles.messageSection}>
                      <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                        Supplier Message:
                      </Text>
                      <Text variant="bodyMedium" style={styles.message}>
                        {quote.supplierMessage}
                      </Text>
                    </View>
                  )}

                  <View style={styles.dateRow}>
                    <MaterialIcons name="schedule" size={14} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Requested {new Date(quote.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {user?.role === 'manufacturer' &&
                    (quote.status === 'supplier_counter' || quote.status === 'supplier_accept') && (
                      <View style={styles.actionButtons}>
                        <Button
                          mode="outlined"
                          onPress={() => handleBuyerDecline(quote)}
                          style={styles.actionButton}
                        >
                          Decline
                        </Button>
                        <Button
                          mode="contained"
                          onPress={() => handleBuyerAccept(quote)}
                          style={styles.actionButton}
                        >
                          Accept & Order
                        </Button>
                      </View>
                    )}

                  {user?.role === 'supplier' && quote.status === 'pending' && (
                    <View style={styles.actionButtons}>
                      <Button
                        mode="contained"
                        onPress={() => handleSupplierResponse(quote)}
                        style={styles.actionButton}
                        icon="reply"
                      >
                        Respond to Quote
                      </Button>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {selectedQuote && (
        <>
          <SupplierQuoteResponseDialog
            visible={showResponseDialog}
            onDismiss={() => {
              setShowResponseDialog(false);
              setSelectedQuote(null);
            }}
            quote={selectedQuote}
            onSuccess={fetchQuotes}
          />

          <OrderFromQuoteDialog
            visible={showOrderDialog}
            onDismiss={() => {
              setShowOrderDialog(false);
              setSelectedQuote(null);
            }}
            quote={selectedQuote}
            onSuccess={handleOrderSuccess}
          />
        </>
      )}

      {/* payment upload removed — using cash-on-delivery only */}
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
  quotesList: {
    padding: 16,
  },
  quoteCard: {
    marginBottom: 16,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  quoteInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  notesSection: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  notes: {
    marginTop: 4,
    lineHeight: 20,
  },
  messageSection: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  message: {
    marginTop: 4,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
});

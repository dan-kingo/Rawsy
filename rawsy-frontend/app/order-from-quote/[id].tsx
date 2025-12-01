import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, RadioButton, Divider, Surface, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OrderFromQuoteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const quoteId = (params as any).id as string;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!quoteId) return;
    (async () => {
      try {
        setLoading(true);
        try {
          const res = await api.get(`/quotes/${quoteId}`);
          setQuote(res.data.quote || res.data);
        } catch (err: any) {
          if (err.response?.status === 404) {
            // fallback to lists
            const mine = await api.get('/quotes/mine');
            const received = await api.get('/quotes/received');
            const all = [...(mine.data.quotes || []), ...(received.data.quotes || [])];
            const found = all.find((q: any) => q._id === quoteId);
            if (!found) {
              Alert.alert('Error', 'Quote not found');
              router.back();
              return;
            }
            setQuote(found);
          } else {
            throw err;
          }
        }
      } catch (e) {
        console.error('Failed to load quote', e);
        Alert.alert('Error', 'Failed to load quote');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [quoteId]);

  const handlePlaceOrder = async () => {
    try {
      setSubmitting(true);
      const res = await api.post(`/quotes/${quoteId}/convert`, { paymentMethod });
      const orderId = res.data.order?._id;
      Alert.alert('Order Placed', 'Your order was placed successfully', [
        { text: 'OK', onPress: () => {
          // navigate back to quotes and include createdOrderId so listing can show upload dialog
          router.replace(`/(tabs)/quotes?createdOrderId=${orderId}`);
        } }
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to place order';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Place Order" />
        </Appbar.Header>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" /></View>
      </View>
    );
  }

  const finalPrice = quote?.counterPrice || quote?.productSnapshot?.price || 0;
  const total = finalPrice * (quote?.counterMinimumQty || quote?.quantityRequested || 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Place Order from Quote" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={[styles.orderSummary, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Product:</Text>
            <Text variant="bodyMedium">{quote?.productSnapshot?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Supplier:</Text>
            <Text variant="bodyMedium">{quote?.supplier?.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Quantity:</Text>
            <Text variant="bodyMedium">{quote?.counterMinimumQty || quote?.quantityRequested} {quote?.productSnapshot?.unit}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Unit Price:</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>{finalPrice} ETB</Text>
          </View>
          <Divider style={{ marginVertical: 12 }} />
          <View style={styles.summaryRow}>
            <Text variant="titleMedium">Total:</Text>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{total.toFixed(2)} ETB</Text>
          </View>
        </Surface>

        <View style={styles.paymentSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Payment Method</Text>
          <RadioButton.Group onValueChange={setPaymentMethod} value={paymentMethod}>
            <View style={styles.radioOption}>
              <RadioButton.Android value="bank_transfer" />
              <View style={{ marginLeft: 8 }}>
                <Text>Bank Transfer</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Upload payment proof after placing order</Text>
              </View>
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Android value="cash_on_delivery" />
              <View style={{ marginLeft: 8 }}>
                <Text>Cash on Delivery</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Pay when you receive the goods</Text>
              </View>
            </View>
          </RadioButton.Group>
        </View>

        <View style={{ padding: 16 }}>
          <Button mode="outlined" onPress={() => router.back()} disabled={submitting} style={{ marginBottom: 8 }}>Cancel</Button>
          <Button mode="contained" onPress={handlePlaceOrder} loading={submitting} disabled={submitting}>Place Order</Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orderSummary: { padding: 16, borderRadius: 12, marginBottom: 12 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  paymentSection: { marginTop: 8, marginBottom: 12 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 }
});

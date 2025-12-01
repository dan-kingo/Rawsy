import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Appbar, Text, Button, RadioButton, Divider, Surface, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../services/api';
import { useRouter } from 'expo-router';

export default function CheckoutScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<string>('cash_on_delivery');
  const [availableMethods, setAvailableMethods] = useState<string[]>(['cash_on_delivery']);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart/list');
      const cart = response.data.cart || [];
      setCartItems(cart);
      const total = cart.reduce((sum: number, item: any) => {
        const product = item.product;
        const price = product?.discount?.active ? product.finalPrice : product?.price || 0;
        return sum + price * item.quantity;
      }, 0);
      setTotalAmount(total);

      if (cart.length > 0 && cart[0].product) {
        setAvailableMethods(['cash_on_delivery']);
        setPaymentMethod('cash_on_delivery');
      }
    } catch (err) {
      console.error('Error fetching cart', err);
      Alert.alert('Error', 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };


  const formatPaymentMethod = (method: string) => {
    return method.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);

      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);

      await api.post(
        '/cart/checkout',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error('Checkout error:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Checkout" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Checkout" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Surface style={[styles.summarySection, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium">Items:</Text>
            <Text variant="bodyMedium">{cartItems.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="titleLarge">Total:</Text>
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>{totalAmount.toFixed(2)} ETB</Text>
          </View>
        </Surface>

        <Divider style={styles.divider} />

        <View style={styles.paymentSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Payment Method</Text>

          <RadioButton.Group onValueChange={setPaymentMethod} value={paymentMethod}>
            {availableMethods.map((method) => (
              <View key={method} style={styles.radioItem}>
                <RadioButton.Item
                  label={formatPaymentMethod(method)}
                  value={method}
                  disabled={processing}
                  position="leading"
                  style={styles.radioButton}
                />
                {method === 'cash_on_delivery' && (
                  <View style={styles.methodInfo}>
                    <MaterialIcons name="local-shipping" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={[styles.methodInfoText, { color: theme.colors.onSurfaceVariant }]}>Pay when you receive the order</Text>
                  </View>
                )}
              </View>
            ))}
          </RadioButton.Group>
        </View>



        <View style={{ padding: 16 }}>
          <Button mode="contained" onPress={handleCheckout} loading={processing} disabled={processing} icon="check">Place Order</Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 0, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summarySection: { padding: 16, borderRadius: 12, marginBottom: 8 },
  sectionTitle: { fontWeight: '600', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  divider: { marginVertical: 16 },
  paymentSection: { marginBottom: 8, paddingHorizontal: 16 },
  radioItem: { marginBottom: 8 },
  radioButton: { paddingLeft: 0 },
  methodInfo: { flexDirection: 'row', alignItems: 'center', paddingLeft: 56, marginTop: -8, marginBottom: 8, gap: 8 },
  methodInfoText: { flex: 1, lineHeight: 18 },
  uploadSection: { marginBottom: 8, paddingHorizontal: 16 },
  infoBox: { flexDirection: 'row', padding: 12, borderRadius: 8, marginBottom: 16, gap: 12 },
  infoText: { flex: 1, lineHeight: 20 },
  imagePreview: { alignItems: 'center' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12, resizeMode: 'contain' },
  changeButton: { width: '100%' },
  selectButton: { marginVertical: 8 },
  progressContainer: { marginTop: 16, paddingHorizontal: 16 },
  progressText: { marginBottom: 8, textAlign: 'center', color: '#6b7280' },
});

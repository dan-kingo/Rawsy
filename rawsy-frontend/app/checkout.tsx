import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Appbar, Text, Button, RadioButton, ProgressBar, Divider, Surface, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../services/api';
import { useRouter } from 'expo-router';

export default function CheckoutScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [availableMethods, setAvailableMethods] = useState<string[]>(['bank_transfer']);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
        const product = cart[0].product;
        const methods = product.paymentMethod && product.paymentMethod.length > 0
          ? product.paymentMethod
          : ['bank_transfer'];

        setAvailableMethods(methods);
        setPaymentMethod(methods[0]);
      }
    } catch (err) {
      console.error('Error fetching cart', err);
      Alert.alert('Error', 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload payment proof');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const formatPaymentMethod = (method: string) => {
    return method.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleCheckout = async () => {
    if (paymentMethod === 'bank_transfer' && !selectedImage) {
      Alert.alert('Payment Proof Required', 'Please upload a screenshot of your bank transfer');
      return;
    }

    try {
      setProcessing(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);

      if (paymentMethod === 'bank_transfer' && selectedImage) {
        const imageFile: any = {
          uri: selectedImage,
          type: 'image/jpeg',
          name: `payment_${Date.now()}.jpg`,
        };
        formData.append('paymentProof', imageFile);
      }

      await api.post(
        '/cart/checkout',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              const progress = progressEvent.loaded / progressEvent.total;
              setUploadProgress(progress);
            }
          },
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
                {method === 'bank_transfer' && (
                  <View style={styles.methodInfo}>
                    <MaterialIcons name="account-balance" size={16} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={[styles.methodInfoText, { color: theme.colors.onSurfaceVariant }]}>Upload payment proof after transfer</Text>
                  </View>
                )}
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

        {paymentMethod === 'bank_transfer' && (
          <>
            <Divider style={styles.divider} />

            <View style={styles.uploadSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Payment Proof</Text>

              <View style={[styles.infoBox, { backgroundColor: theme.colors.secondaryContainer }]}> 
                <MaterialIcons name="info" size={20} color={theme.colors.secondary} />
                <Text variant="bodySmall" style={[styles.infoText, { color: theme.colors.onSecondaryContainer }]}>Please complete your bank transfer and upload a screenshot or photo of the payment confirmation</Text>
              </View>

              {selectedImage ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  <Button mode="outlined" onPress={pickImage} disabled={processing} style={styles.changeButton} icon="image">Change Image</Button>
                </View>
              ) : (
                <Button mode="contained-tonal" onPress={pickImage} icon="camera" style={styles.selectButton} disabled={processing}>Upload Payment Proof</Button>
              )}
            </View>
          </>
        )}

        {processing && (
          <View style={styles.progressContainer}>
            <Text variant="bodySmall" style={styles.progressText}>{paymentMethod === 'bank_transfer' ? 'Uploading...' : 'Processing...'} {Math.round(uploadProgress * 100)}%</Text>
            <ProgressBar progress={uploadProgress} color={theme.colors.primary} />
          </View>
        )}

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

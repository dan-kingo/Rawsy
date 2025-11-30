import { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import {
  Dialog,
  Portal,
  Text,
  Button,
  Divider,
  RadioButton,
  Surface,
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

interface OrderFromQuoteDialogProps {
  visible: boolean;
  onDismiss: () => void;
  quote: any;
  onSuccess: (orderId: string) => void;
}

export default function OrderFromQuoteDialog({
  visible,
  onDismiss,
  quote,
  onSuccess,
}: OrderFromQuoteDialogProps) {
  const { theme } = useTheme();
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [loading, setLoading] = useState(false);
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);

  const finalPrice = quote?.counterPrice || quote?.productSnapshot?.price || 0;
  const total = finalPrice * (quote?.counterMinimumQty || quote?.quantityRequested || 0);

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);

      const response = await api.post(`/quotes/${quote._id}/convert`, {
        paymentMethod,
      });

      const orderId = response.data.order?._id;

      Alert.alert(
        'Order Placed',
        'Your order has been placed successfully!',
        [
          {
            text: 'Upload Payment Proof',
            onPress: () => {
              onSuccess(orderId);
              onDismiss();
            },
          },
          {
            text: 'Skip for Now',
            style: 'cancel',
            onPress: () => {
              onSuccess(orderId);
              onDismiss();
            },
          },
        ]
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to place order';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title>Place Order from Quote</Dialog.Title>

        <Dialog.Content>
          <ScrollView>
            <Surface style={[styles.orderSummary, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Order Summary
              </Text>

              <View style={styles.summaryRow}>
                <Text variant="bodyMedium" style={styles.label}>Product:</Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {quote?.productSnapshot?.name}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodyMedium" style={styles.label}>Supplier:</Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {quote?.supplier?.name}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodyMedium" style={styles.label}>Quantity:</Text>
                <Text variant="bodyMedium" style={styles.value}>
                  { quote?.counterMinimumQty || quote?.quantityRequested} {quote?.productSnapshot?.unit}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text variant="bodyMedium" style={styles.label}>Unit Price:</Text>
                <Text variant="bodyMedium" style={[styles.value, { color: theme.colors.primary }]}>
                  {finalPrice} ETB
                </Text>
              </View>

              <Divider style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text variant="titleMedium" style={styles.label}>Total:</Text>
                <Text variant="headlineSmall" style={[styles.value, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                  {total.toFixed(2)} ETB
                </Text>
              </View>
            </Surface>

            <View style={styles.paymentSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Payment Method
              </Text>

              <RadioButton.Group onValueChange={setPaymentMethod} value={paymentMethod}>
                <View style={styles.radioOption}>
                  <RadioButton.Android value="bank_transfer" />
                  <View style={styles.radioLabel}>
                    <Text variant="bodyMedium">Bank Transfer</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Upload payment proof after placing order
                    </Text>
                  </View>
                </View>

                <View style={styles.radioOption}>
                  <RadioButton.Android value="cash_on_delivery" />
                  <View style={styles.radioLabel}>
                    <Text variant="bodyMedium">Cash on Delivery</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Pay when you receive the goods
                    </Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            {paymentMethod === 'bank_transfer' && (
              <View style={[styles.infoBox, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text variant="bodySmall" style={[styles.infoText, { color: theme.colors.onPrimaryContainer }]}>
                  After placing the order, you can upload your payment proof for faster processing.
                </Text>
              </View>
            )}
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handlePlaceOrder}
            loading={loading}
            disabled={loading}
            icon="check"
          >
            Place Order
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '85%',
  },
  orderSummary: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    flex: 1,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    marginVertical: 12,
  },
  paymentSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    lineHeight: 18,
  },
});

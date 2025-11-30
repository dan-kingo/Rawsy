import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Dialog,
  Portal,
  Text,
  TextInput,
  Button,
  HelperText,
  Divider,
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

interface RequestQuoteDialogProps {
  visible: boolean;
  onDismiss: () => void;
  product: any;
}

export default function RequestQuoteDialog({
  visible,
  onDismiss,
  product,
}: RequestQuoteDialogProps) {
  const { theme } = useTheme();
  const [quantity, setQuantity] = useState('');
  const [proposedPrice, setproposedPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(proposedPrice);
    if (!proposedPrice || isNaN(priceNum) || priceNum <= 0) {
  setError('Please enter a valid price');
  return;
}
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (quantityNum > product.stock) {
      setError(`Maximum available quantity is ${product.stock} ${product.unit}`);
      return;
    }

    try {
      setLoading(true);
      await api.post('/quotes/request', {
        productId: product._id,
        quantityRequested: quantityNum,
buyerProposedPrice: parseFloat(proposedPrice),
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Quote Requested',
        'Your quote request has been submitted successfully. The supplier will review and respond soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              setQuantity('');
              setNotes('');
              onDismiss();
            },
          },
        ]
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to submit quote request';
      Alert.alert('Error', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setQuantity('');
    setNotes('');
    setError('');
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title>Request Quote</Dialog.Title>

        <Dialog.Content>
          <View style={styles.productInfo}>
            <Text variant="titleMedium" style={styles.productName}>
              {product?.name}
            </Text>
            <Text variant="bodySmall" style={[styles.productPrice, { color: theme.colors.primary }]}>
              Current Price: {product?.price} ETB/{product?.unit}
            </Text>
            {product?.stock > 0 && (
              <Text variant="bodySmall" style={{ color: '#6b7280' }}>
                Available: {product.stock} {product.unit}
              </Text>
            )}
          </View>

          <Divider style={styles.divider} />

          <TextInput
            label={`Quantity (${product?.unit || 'units'})`}
            value={quantity}
            onChangeText={setQuantity}
            mode="outlined"
            keyboardType="numeric"
            placeholder="Enter quantity"
            style={styles.input}
            error={!!error && error.includes('quantity')}
          />
           <TextInput
  label={`Proposed Price (ETB/${product.unit})`}
  value={proposedPrice}
  onChangeText={setproposedPrice}
  mode="outlined"
  keyboardType="numeric"
  placeholder="Enter your proposed price"
  style={styles.input}
  error={!!error && error.includes('price')}
/>
          <TextInput
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Add any special requirements or questions"
            style={styles.input}
          />

          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}

          <View style={styles.infoBox}>
            <Text variant="bodySmall" style={styles.infoText}>
              The supplier will review your request and may provide a custom quote based on your
              quantity and requirements.
            </Text>
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !quantity}
          >
            Submit Request
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  productInfo: {
    marginBottom: 8,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    color: '#4b5563',
    lineHeight: 18,
  },
});

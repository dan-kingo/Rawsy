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
  RadioButton,
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

interface SupplierQuoteResponseDialogProps {
  visible: boolean;
  onDismiss: () => void;
  quote: any;
  onSuccess: () => void;
}

export default function SupplierQuoteResponseDialog({
  visible,
  onDismiss,
  quote,
  onSuccess,
}: SupplierQuoteResponseDialogProps) {
  const { theme } = useTheme();
  const [action, setAction] = useState<'accept' | 'reject' | 'counter'>('counter');
  const [counterPrice, setcounterPrice] = useState('');
  const [counterMinimumQty, setcounterMinimumQty] = useState('');
  const [supplierMessage, setSupplierMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    if (action === 'counter') {
      const price = parseFloat(counterPrice);
      if (!counterPrice || isNaN(price) || price <= 0) {
        setError('Please enter a valid price');
        return;
      }
    }

    try {
      setLoading(true);
      const payload: any = { action };

      if (action === 'counter') {
payload.supplierProposedPrice = parseFloat(counterPrice);
        if (counterMinimumQty) {
          payload.counterMinimumQty = parseFloat(counterMinimumQty);
        }
      }

      if (supplierMessage.trim()) {
        payload.supplierMessage = supplierMessage.trim();
      }

      await api.put(`/quotes/${quote._id}/respond`, payload);

      const actionLabels = {
        accept: 'accepted',
        reject: 'rejected',
        counter: 'counter offer sent',
      };

      Alert.alert(
        'Success',
        `Quote ${actionLabels[action]} successfully`,
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onDismiss();
              onSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to respond to quote';
      Alert.alert('Error', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAction('counter');
    setcounterPrice('');
    setcounterMinimumQty('');
    setSupplierMessage('');
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title>Respond to Quote</Dialog.Title>

        <Dialog.Content>
          <View style={styles.quoteInfo}>
            <Text variant="titleMedium" style={styles.productName}>
              {quote?.productSnapshot?.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              From: {quote?.buyer?.name}
            </Text>
            <Text variant="bodySmall" style={[styles.requestedQty, { color: theme.colors.primary }]}>
Requested: {quote?.counterMinimumQty || quote?.quantityRequested} {quote?.productSnapshot?.unit} × {quote?.buyerProposedPrice?? quote?.productSnapshot?.price  } ETB
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.actionSelection}>
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Your Response
            </Text>

            <RadioButton.Group onValueChange={(value) => setAction(value as any)} value={action}>
              <View style={styles.radioOption}>
                <RadioButton.Android value="accept" />
                <Text variant="bodyMedium">Accept (Original Price)</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Android value="counter" />
                <Text variant="bodyMedium">Counter Offer (Modify Price)</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Android value="reject" />
                <Text variant="bodyMedium">Reject Request</Text>
              </View>
            </RadioButton.Group>
          </View>

          {action === 'counter' && (
            <View style={styles.counterForm}>
              <TextInput
                label="Counter Price (ETB)"
                value={counterPrice}
                onChangeText={setcounterPrice}
                mode="outlined"
                keyboardType="numeric"
                placeholder="Enter your price"
                style={styles.input}
                error={!!error && error.includes('price')}
              />

              <TextInput
                label={`Minimum Order Quantity (${quote?.productSnapshot?.unit}) - Optional`}
                value={counterMinimumQty}
                onChangeText={setcounterMinimumQty}
                mode="outlined"
                keyboardType="numeric"
                placeholder="Enter minimum quantity"
                style={styles.input}
              />
            </View>
          )}

          <TextInput
            label="Message to Buyer (Optional)"
            value={supplierMessage}
            onChangeText={setSupplierMessage}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Add any notes or requirements"
            style={styles.input}
          />

          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}

          <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodySmall" style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {action === 'accept' && 'The buyer will be notified and can proceed with the order.'}
              {action === 'counter' && 'The buyer will receive your counter offer and can accept or decline.'}
              {action === 'reject' && 'The quote request will be rejected and the buyer will be notified.'}
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
            disabled={loading || (action === 'counter' && !counterPrice)}
          >
            {action === 'accept' ? 'Accept' : action === 'reject' ? 'Reject' : 'Send Counter Offer'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>

    
  );
    

}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  quoteInfo: {
    marginBottom: 8,
  },
  productName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  requestedQty: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  actionSelection: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  counterForm: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
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

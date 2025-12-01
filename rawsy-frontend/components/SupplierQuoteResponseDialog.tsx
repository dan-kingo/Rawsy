import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Text, TextInput, Button, HelperText, Divider, RadioButton } from 'react-native-paper';
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

  const router = useRouter();
  useEffect(() => {
    if (visible && quote?._id) {
      router.push(`/respond-quote/${quote._id}`);
      onDismiss();
    }
  }, [visible, quote?._id]);

  return null;
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

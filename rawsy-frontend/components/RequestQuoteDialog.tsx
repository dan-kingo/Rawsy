import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { useRouter } from 'expo-router';

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
  const [proposedPrice, setProposedPrice] = useState('');
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
              setProposedPrice('');
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
    setProposedPrice('');
    setNotes('');
    setError('');
    onDismiss();
  };

  const router = useRouter();

  useEffect(() => {
    if (visible && product?._id) {
      // redirect to the full-screen request quote route
      router.push(`/request-quote/${product._id}`);
      // dismiss the dialog state in caller
      onDismiss();
    }
  }, [visible, product?._id]);

  return null;
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

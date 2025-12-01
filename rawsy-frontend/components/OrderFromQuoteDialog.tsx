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
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

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
  // convert this component into a small navigation wrapper to the full screen
  const router = useRouter();

  useEffect(() => {
    if (visible && quote?._id) {
      router.push(`/order-from-quote/${quote._id}`);
      onDismiss();
    }
  }, [visible, quote?._id]);

  return null;
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

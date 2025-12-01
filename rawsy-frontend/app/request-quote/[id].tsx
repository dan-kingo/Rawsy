import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Appbar, Text, TextInput, Button, HelperText, Divider } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RequestQuoteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = (params as any).id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${productId}`);
        setProduct(res.data);
      } catch (err) {
        console.error('Failed fetch product', err);
        Alert.alert('Error', 'Failed to load product');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const handleSubmit = async () => {
    setError(null);
    const q = parseFloat(quantity);
    const p = parseFloat(proposedPrice);
    if (!proposedPrice || isNaN(p) || p <= 0) return setError('Please enter a valid price');
    if (!quantity || isNaN(q) || q <= 0) return setError('Please enter a valid quantity');
    if (product && q > product.stock) return setError(`Maximum available quantity is ${product.stock} ${product.unit}`);

    try {
      setSubmitting(true);
      await api.post('/quotes/request', {
        productId: product._id,
        quantityRequested: q,
        buyerProposedPrice: p,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Quote Requested', 'Your request has been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit quote request';
      Alert.alert('Error', msg);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Request Quote" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        {loading || !product ? (
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 8 }}>{product.name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
              Current Price: {product.price} ETB/{product.unit}
            </Text>

            <Divider style={{ marginVertical: 12 }} />

            <TextInput label={`Quantity (${product.unit})`} value={quantity} onChangeText={setQuantity} mode="outlined" keyboardType="numeric" style={{ marginBottom: 12 }} />
            <TextInput label={`Proposed Price (ETB/${product.unit})`} value={proposedPrice} onChangeText={setProposedPrice} mode="outlined" keyboardType="numeric" style={{ marginBottom: 12 }} />
            <TextInput label="Notes (Optional)" value={notes} onChangeText={setNotes} mode="outlined" multiline numberOfLines={4} style={{ marginBottom: 12 }} />

            {error ? <HelperText type="error" visible>{error}</HelperText> : null}

            <View style={{ backgroundColor: theme.colors.surfaceVariant, padding: 12, borderRadius: 8, marginTop: 8 }}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>The supplier will review your request and may provide a custom quote based on your quantity and requirements.</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              <Button onPress={handleCancel} disabled={submitting} textColor={theme.colors.onSurfaceVariant}>Cancel</Button>
              <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} buttonColor={theme.colors.primary} textColor={theme.colors.onPrimary}>Submit Request</Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  loadingContainer: { padding: 24 },
});

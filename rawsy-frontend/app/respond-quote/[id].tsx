import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Appbar, Text, TextInput, Button, HelperText, Divider, RadioButton } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RespondQuoteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const quoteId = (params as any).id as string;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState<'accept' | 'reject' | 'counter'>('counter');
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMinimumQty, setCounterMinimumQty] = useState('');
  const [supplierMessage, setSupplierMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quoteId) return;
    (async () => {
      try {
        setLoading(true);
        // Some backend versions don't expose GET /quotes/:id — fall back to received list
        try {
          const res = await api.get(`/quotes/${quoteId}`);
          // controller may return { quote } or the quote directly
          setQuote(res.data.quote || res.data);
        } catch (err: any) {
          if (err.response?.status === 404) {
            const listRes = await api.get('/quotes/received');
            const quotes = listRes.data?.quotes || [];
            const found = quotes.find((q: any) => q._id === quoteId);
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

  const handleSubmit = async () => {
    setError(null);
    if (action === 'counter') {
      const p = parseFloat(counterPrice as string);
      if (!counterPrice || isNaN(p) || p <= 0) return setError('Please enter a valid price');
    }

    try {
      setSubmitting(true);
      const payload: any = { action };
      if (action === 'counter') {
        payload.supplierProposedPrice = parseFloat(counterPrice);
        if (counterMinimumQty) payload.counterMinimumQty = parseFloat(counterMinimumQty);
      }
      if (supplierMessage.trim()) payload.supplierMessage = supplierMessage.trim();

      await api.put(`/quotes/${quoteId}/respond`, payload);

      Alert.alert('Success', 'Response sent', [ { text: 'OK', onPress: () => router.back() } ]);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to respond to quote';
      Alert.alert('Error', msg);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Respond to Quote" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        {loading || !quote ? (
          <View style={{ padding: 20 }}>
            <Text>Loading...</Text>
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 8 }}>{quote.productSnapshot?.name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{`From: ${quote.buyer?.name}`}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 8, fontWeight: '700' }}>{`Requested: ${quote.counterMinimumQty || quote.quantityRequested} ${quote.productSnapshot?.unit} × ${quote.buyerProposedPrice ?? quote.productSnapshot?.price} ETB`}</Text>

            <Divider style={{ marginVertical: 12 }} />

            <Text variant="labelLarge" style={{ marginBottom: 8 }}>Your Response</Text>
            <RadioButton.Group onValueChange={(v) => setAction(v as any)} value={action}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <RadioButton.Android value="accept" />
                <Text>Accept (Original Price)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <RadioButton.Android value="counter" />
                <Text>Counter Offer (Modify Price)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <RadioButton.Android value="reject" />
                <Text>Reject Request</Text>
              </View>
            </RadioButton.Group>

            {action === 'counter' && (
              <>
                <TextInput label="Counter Price (ETB)" value={counterPrice} onChangeText={setCounterPrice} mode="outlined" keyboardType="numeric" style={{ marginBottom: 12 }} />
                <TextInput label={`Minimum Order Quantity (${quote.productSnapshot?.unit}) `} value={counterMinimumQty} onChangeText={setCounterMinimumQty} mode="outlined" keyboardType="numeric" style={{ marginBottom: 12 }} />
              </>
            )}

            <TextInput label="Message to Buyer (Optional)" value={supplierMessage} onChangeText={setSupplierMessage} mode="outlined" multiline numberOfLines={3} style={{ marginBottom: 12 }} />

            {error ? <HelperText type="error" visible>{error}</HelperText> : null}

            <View style={{ backgroundColor: theme.colors.surfaceVariant, padding: 12, borderRadius: 8, marginTop: 8 }}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{action === 'accept' ? 'The buyer will be notified and can proceed with the order.' : action === 'counter' ? 'The buyer will receive your counter offer and can accept or decline.' : 'The quote request will be rejected and the buyer will be notified.'}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              <Button onPress={() => router.back()} disabled={submitting} textColor={theme.colors.secondary}>Cancel</Button>
              <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting || (action === 'counter' && !counterPrice)} buttonColor={theme.colors.primary} textColor={"#fff"}>{action === 'accept' ? 'Accept' : action === 'reject' ? 'Reject' : 'Send Counter Offer'}</Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
});

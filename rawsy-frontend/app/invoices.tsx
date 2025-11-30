import { View, StyleSheet, ScrollView, RefreshControl, Linking } from 'react-native';
import { Text, Appbar, Card, Button, ActivityIndicator, Chip, Snackbar } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

export default function InvoicesScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const { user } = useAuth();
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message?: string }>({ visible: false });

  useEffect(() => {
    // Wait until auth user is loaded before fetching invoices
    if (user) fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    try {
      if (!user) return;
      setLoading(true);
      // Use order-based invoice endpoints so users only see their invoices
      let res;
      if (user?.role === 'manufacturer') {
        res = await api.get('/orders/invoices/my');
        setInvoices(res.data.invoices || []);
      } else if (user?.role === 'supplier') {
        res = await api.get('/orders/invoices/supplier');
        setInvoices(res.data.invoices || []);
      } else {
        // fallback: admin or others
        res = await api.get('/orders/invoices/admin');
        setInvoices(res.data.invoices || []);
      }
    } catch (err) {
      console.error('Error fetching invoices', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  const openInvoice = async (invoice: any) => {
    const key = invoice.orderId;
    try {
      setLoadingMap((m) => ({ ...m, [key]: true }));

      // If the invoice object already has a URL, open it
      if (invoice.url) {
        Linking.openURL(invoice.url).catch(() => {});
        return;
      }

      // Otherwise request a URL for this order invoice from the server
      let res;
      if (user?.role === 'manufacturer') {
        res = await api.get(`/orders/${invoice.orderId}/invoice/buyer/url`);
      } else if (user?.role === 'supplier') {
        res = await api.get(`/orders/${invoice.orderId}/invoice/supplier/url`);
      } else {
        res = await api.get(`/orders/${invoice.orderId}/invoice/buyer/url`);
      }

      const url = res.data?.url;
      if (url) {
        Linking.openURL(url).catch(() => {});
        return;
      }

      console.warn('No URL returned for invoice', invoice, res.data);
      setSnackbar({ visible: true, message: 'Invoice URL not available' });
    } catch (err: any) {
      console.error('Error opening invoice', err?.response || err);
      setSnackbar({ visible: true, message: err?.response?.data?.error || 'Failed to open invoice' });
    } finally {
      setLoadingMap((m) => ({ ...m, [key]: false }));
    }
  };

  const downloadInvoice = async (invoice: any) => {
    // Same as open but keeps the semantics clear for the UI — open the URL (device will download or view)
    await openInvoice(invoice);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title={t('invoices') || 'Invoices'} subtitle={invoices ? `${invoices.length} invoices` : ''} />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : invoices.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('noInvoices') || 'No invoices found.'}
            </Text>
            <Button mode="contained" onPress={fetchInvoices} style={{ marginTop: 12 }}>
              {t('refresh') || 'Refresh'}
            </Button>
          </View>
        ) : (
          invoices.map((inv: any) => (
            <Card key={inv.orderId} style={[styles.card, { backgroundColor: theme.colors.surface }]}> 
              <Card.Content>
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text variant="titleSmall" style={styles.ref}>{inv.reference || (`#${inv.orderId}`)}</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{new Date(inv.createdAt).toLocaleDateString()}</Text>
                    <Text variant="bodySmall" style={{ marginTop: 6, color: theme.colors.onSurface }}>{inv.total ? `${inv.total} ETB` : ''}</Text>
                  </View>

                  <View style={styles.right}>
                    <View style={styles.statusRow}>
                      <Chip compact>{inv.status || 'unknown'}</Chip>
                    </View>

                    <View style={styles.actionsRow}>
                      {loadingMap[inv.orderId] ? (
                        <ActivityIndicator size={20} color={theme.colors.primary} />
                      ) : (
                        <>
                          <Button mode="contained" onPress={() => openInvoice(inv)} compact style={styles.actionBtn} buttonColor={theme.colors.primary}>
                            {t('open') || 'Open'}
                          </Button>
                          <Button mode="outlined" onPress={() => downloadInvoice(inv)} compact style={[styles.actionBtn, styles.downloadBtn]} textColor={theme.colors.primary}>
                            {t('download') || 'Download'}
                          </Button>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false })}
        duration={4000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 12 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  card: { marginBottom: 12, borderRadius: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { flex: 1 },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  ref: { fontWeight: '600' },
  total: { fontWeight: '700', marginTop: 4 },
  statusRow: { marginBottom: 6, alignItems: 'flex-end' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  actionBtn: { minWidth: 88 },
  downloadBtn: { marginLeft: 8 },
});

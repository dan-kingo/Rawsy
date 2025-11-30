import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Appbar, ActivityIndicator, Card, Button, Chip, Badge, Surface, Avatar } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function SupplierProfile() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params: any = useLocalSearchParams();

  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
const [reviewSummary, setReviewSummary] = useState<any>(null);

  useEffect(() => {
    const idParam = params?.id;
    const supplierParam = params?.supplier;

    if (idParam) {
      // prefer fetching full supplier by id to guarantee complete data
      fetchSupplier(String(idParam));
      return;
    }

    if (supplierParam) {
      try {
        const parsed = JSON.parse(String(supplierParam));
        setSupplier(parsed);
      } catch (e) {
        console.warn('Failed to parse supplier param', e);
      }
    }

    setLoading(false);
  }, [params?.id, params?.supplier]);

  const fetchSupplier = async (id: string) => {
    try {
      setLoading(true);
      // backend exposes public user profile at /api/auth/profile/:id
      const res = await api.get(`/auth/profile/${id}`);
      // response shape: { user, products }
      const payload = res.data || {};
      setSupplier(payload.user || payload);
      setProducts(payload.products || []);
      fetchReviews(id);
      fetchRatingSummary(id);
    } catch (err: any) {
      console.warn('Failed to fetch supplier', err?.response?.data || err.message || err);
      Alert.alert('Error', 'Failed to load supplier details');
      router.back();
    } finally {
      setLoading(false);
    }
  };
const fetchReviews = async (supplierId: string) => {
  try {
    const res = await api.get(`/reviews/supplier/${supplierId}`);
    setReviews(res.data.reviews || []);
  } catch (e) {
    console.warn('Failed to fetch reviews');
  }
};

const fetchRatingSummary = async (supplierId: string) => {
  try {
    const res = await api.get(`/reviews/supplier/${supplierId}/summary`);
    setReviewSummary({
      averageRating: res.data.averageRating,
      totalReviews: res.data.reviewCount, // <- map reviewCount here
    });
  } catch (e) {
    console.warn('Failed to fetch rating summary');
  }
};

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Supplier" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!supplier) return null;

  const verified = Boolean(supplier.verifiedSupplier || supplier.verified || supplier.isVerified);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={supplier.name || 'Supplier'} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <View style={styles.headerRow}> 
              <View style={styles.avatarWrap}>
                {supplier.profileImage ? (
                  <Avatar.Image size={80} source={{ uri: supplier.profileImage }} />
                ) : (
                  <Avatar.Text size={80} label={supplier.name?.charAt(0).toUpperCase() || 'S'} />
                )}
              </View>

              <View style={styles.headerInfoLarge}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text variant="headlineLarge" style={styles.name}>{supplier.name}</Text>
                  {verified && <Badge style={styles.verifiedBadge}>Verified</Badge>}
                </View>
                {supplier.companyName && <Text variant="bodyMedium" style={styles.company}>{supplier.companyName}</Text>}
                {reviewSummary && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
              ⭐ {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.reviewCount} reviews)
               </Text>
               )}
                <View style={styles.actionRow}>
                  {supplier.phone && <Button icon="phone" mode="contained" compact onPress={() => Linking.openURL(`tel:${supplier.phone}`)} style={styles.actionBtn}>Call</Button>}
                  {supplier.email && <Button icon="email" mode="outlined" compact onPress={() => Linking.openURL(`mailto:${supplier.email}`)} style={styles.actionBtn}>Email</Button>}
                  {products && products.length > 0 && <Button icon="view-grid" mode="text" compact onPress={() => { /* scroll to products section */ }} style={styles.actionBtn}>Products</Button>}
                </View>
              </View>
            </View>

            {supplier.businessLocation?.address && (
              <View style={styles.row}><MaterialIcons name="location-on" size={16} color={theme.colors.onSurfaceVariant} /><Text variant="bodySmall" style={styles.rowText}>{supplier.businessLocation.address}</Text></View>
            )}

            {supplier.factoryLocation?.address && (
              <View style={styles.row}><MaterialIcons name="factory" size={16} color={theme.colors.onSurfaceVariant} /><Text variant="bodySmall" style={styles.rowText}>Factory: {supplier.factoryLocation.address}</Text></View>
            )}

            {supplier.description && (
              <View style={{ marginTop: 12 }}>
                <Text variant="titleMedium">About</Text>
                <Text variant="bodyMedium" style={{ marginTop: 8 }}>{supplier.description}</Text>
              </View>
            )}

            {products && products.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text variant="titleMedium">Products</Text>
                {products.map((p: any) => (
                  <Card key={p._id} style={styles.productCard}>
                    <Card.Content style={styles.productCardContent}>
                      <View style={styles.productRow}>
                        <Card.Cover source={{ uri: p.images?.[0] || p.image || 'https://via.placeholder.com/80' }} style={styles.productThumb} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text variant="titleSmall">{p.name}</Text>
                          <Text variant="bodySmall" style={{ color: '#6b7280' }}>{p.price} ETB / {p.unit}</Text>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}
          </Card.Content>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 12, padding: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { marginRight: 12 },
  headerInfoLarge: { flex: 1 },
  headerInfo: { flex: 1 },
  name: { fontWeight: '700', marginLeft: 6 },
  company: { color: '#6b7280', marginTop: 4 },
  verifiedBadge: { backgroundColor: '#10b981', color: '#fff', marginLeft: 8, height: 24, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  rowText: { marginLeft: 8 },
  actionRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  actionBtn: { marginRight: 8 },
  productCard: { marginTop: 8, borderRadius: 8 },
  productCardContent: { paddingVertical: 8 },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productThumb: { width: 80, height: 64, borderRadius: 8 },
});

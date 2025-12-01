import { View, StyleSheet, ScrollView, RefreshControl, Alert, Dimensions } from 'react-native';
import { Text, Appbar, Card, ActivityIndicator, IconButton, Button, Surface, Chip } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export default function WishlistScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await api.get('/wishlist/list');
      setWishlist(response.data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWishlist();
    setRefreshing(false);
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      setRemovingId(productId);
      await api.post('/wishlist/remove', { productId });
      await fetchWishlist();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to remove from wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (product: any) => {
    if (product.stock === 0) {
      Alert.alert('Out of Stock', 'This product is currently unavailable');
      return;
    }

    try {
      await api.post('/cart/add', {
        productId: product._id,
        quantity: 1,
      });
      Alert.alert('Success', 'Product added to cart');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add to cart');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<MaterialIcons key={i} name="star" size={14} color="#f59e0b" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<MaterialIcons key={i} name="star-half" size={14} color="#f59e0b" />);
      } else {
        stars.push(<MaterialIcons key={i} name="star-border" size={14} color="#d1d5db" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.Content title={t('wishlist')} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            {t('loading')}...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title={t('wishlist')} />
      </Appbar.Header>

      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="favorite-border" size={80} color={theme.colors.onSurfaceVariant} />
          <Text variant="headlineSmall" style={[styles.emptyText, { color: theme.colors.onSurface }]}>
            Your Wishlist is Empty
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
            Add products you like to your wishlist and access them easily
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/products')}
            style={styles.browseButton}
            icon="shopping"
          >
            Browse Products
          </Button>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        >
          <Surface style={[styles.statsBar, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <MaterialIcons name="favorite" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
              {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'} in Wishlist
            </Text>
          </Surface>

          <View style={styles.productGrid}>
            {wishlist.map((product: any) => (
              <Card
                key={product._id}
                style={[styles.productCardFullWidth, { backgroundColor: theme.colors.surface }]}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: product._id } })}
              >
                <View style={styles.imageContainer}>
                  <Card.Cover
                    source={{ uri: product.image || product.images?.[0] || 'https://via.placeholder.com/200' }}
                    style={styles.cardImage}
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    iconColor="#fff"
                    style={styles.removeButton}
                    onPress={() => handleRemoveFromWishlist(product._id)}
                    disabled={removingId === product._id}
                  />
                  {product.stock === 0 && (
                    <View style={styles.outOfStockOverlay}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                  {product.discount?.active && (
                    <Chip style={styles.discountBadge} textStyle={{ color: '#fff', fontSize: 11 }}>
                      {product.discount.percentage}% OFF
                    </Chip>
                  )}
                </View>

                <Card.Content style={styles.cardContent}>
                  <Text variant="titleMedium" numberOfLines={2} style={styles.productName}>
                    {product.name}
                  </Text>
                  <Text variant="bodySmall" style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>
                    {product.category}
                  </Text>

                  {product.rating?.average > 0 && (
                    <View style={styles.ratingRow}>
                      <View style={styles.stars}>{renderStars(product.rating.average)}</View>
                      <Text variant="bodySmall" style={styles.ratingText}>
                        ({product.rating.count})
                      </Text>
                    </View>
                  )}

                  <View style={styles.priceRow}>
                    {product.discount?.active ? (
                      <View>
                        <Text variant="bodySmall" style={styles.originalPrice}>
                          {product.price} ETB
                        </Text>
                        <Text variant="titleLarge" style={[styles.price, { color: "#fff" }]}>
                          {product.finalPrice?.toFixed(2)} ETB
                        </Text>
                      </View>
                    ) : (
                      <Text variant="titleLarge" style={[styles.price, { color:"#fff" }]}>
                        {product.price} ETB
                      </Text>
                    )}
                  </View>

                  <View style={styles.stockRow}>
                    {product.stock > 0 ? (
                      <>
                        <MaterialIcons name="check-circle" size={14} color="#10b981" />
                        <Text variant="bodySmall" style={styles.inStock}>
                          In Stock
                        </Text>
                      </>
                    ) : (
                      <>
                        <MaterialIcons name="cancel" size={14} color="#ef4444" />
                        <Text variant="bodySmall" style={styles.outOfStock}>
                          Out of Stock
                        </Text>
                      </>
                    )}
                  </View>

                  <Button
                    mode="contained"
                    onPress={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    style={styles.addButton}
                    compact
                    icon="cart"
                  >
                    Add to Cart
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: { marginTop: 16, fontWeight: 'bold' },
  browseButton: { marginTop: 24 },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  productGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
    justifyContent: 'space-between',
  },
  productCard: { marginBottom: 8 },
  productCardFullWidth: { width: width - 32, marginBottom: 12, borderRadius: 8, overflow: 'hidden' },
  imageContainer: { position: 'relative' },
  cardImage: { height: 268 },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  discountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#ef4444',
  },
  cardContent: { paddingTop: 12 },
  productName: { fontWeight: '600', minHeight: 44 },
  category: { marginTop: 4, textTransform: 'capitalize' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 4 },
  stars: { flexDirection: 'row', marginRight: 6 },
  ratingText: { color: '#6b7280', fontSize: 12 },
  priceRow: { marginTop: 8, marginBottom: 8 },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 2,
  },
  price: { fontWeight: 'bold' },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  inStock: { color: '#fff' },
  outOfStock: { color: '#ef4444' },
  addButton: { marginTop: 4 },
});

import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { Text, Appbar, Card, Searchbar, Chip, ActivityIndicator, Badge, FAB, Button, Surface, Divider } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../../services/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

interface Product {
  _id: string;
  name: string;
  category: string;
  image?: string;
  images?: string[];
  price: number;
  finalPrice?: number;
discount?: {
  active: boolean;
  percentage: number;
  expiresAt?: string;
};
  stock: number;
  unit: string;
  rating?: { average: number; count: number };
  negotiable?: boolean;
  status?: string;
  rejectionReason?: string;
}

export default function ProductsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const isSupplier = user?.role === 'supplier';

  if (isSupplier) {
    return <SupplierProductsView />;
  }

  return <ManufacturerProductsView />;
}
function ManufacturerProductsView() {
  const { theme } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get<Product[]>('/products');
      const data = response.data;
      setProducts(data);
      const uniqueCategories = Array.from(new Set(data.map((p) => p.category))).filter(Boolean) as string[];
      setCategories(['all', ...uniqueCategories]);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Products" />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <View style={styles.searchSection}>
          <Searchbar placeholder="Search products" onChangeText={setSearchQuery} value={searchQuery} style={styles.searchbar} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <Chip
                key={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={styles.categoryChip}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
              Loading products...
            </Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory-2" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              No products found
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((product) => (
              <TouchableOpacity
                key={product._id}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: product._id } })}
              >
                <Card style={styles.productCardVertical}>
                <View style={styles.imageContainerVertical}>
                  <Card.Cover
                    source={{ uri: product.image || product.images?.[0] || 'https://via.placeholder.com/400x200' }}
                    style={styles.cardImageFullWidth}
                  />
                  {product.discount?.active && (
                    <View style={styles.discountContainer}>
                      <Badge style={styles.discountBadge} size={32}>
                        {`${product.discount.percentage}%`}
                      </Badge>
                      {product.discount?.expiresAt && (
                        <Text style={styles.discountExpireText}>
                          Ends {formatDate(product.discount.expiresAt)}
                        </Text>
                      )}
                    </View>
                  )}
                  {product.stock === 0 && (
                    <View style={styles.outOfStockOverlay}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                </View>

                <Card.Content style={styles.cardContentVertical}>
                  <View style={styles.productHeaderRow}>
                    <View style={styles.productTitleContainer}>
                      <Text variant="titleMedium" numberOfLines={2} style={styles.productName}>
                        {product.name}
                      </Text>
                      <Text variant="bodySmall" style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>
                        {product.category}
                      </Text>
                    </View>
                    {product.negotiable && (
                      <View style={styles.negotiableBadge}>
                        <MaterialIcons name="handshake" size={16} color={theme.colors.secondary} />
                        <Text variant="bodySmall" style={[styles.negotiableText, { color: theme.colors.secondary }]}>
                          Negotiable
                        </Text>
                      </View>
                    )}
                  </View>

                  {product.rating?.average && product.rating.average > 0 && (
                    <View style={styles.ratingRow}>
                      <View style={styles.stars}>
                        {renderStars(product.rating?.average ?? 0)}
                      </View>
                      <Text variant="bodySmall" style={styles.ratingText}>
                        ({product.rating?.count ?? 0})
                      </Text>
                    </View>
                  )}

                  <View style={styles.priceStockRow}>
                    <View style={styles.priceContainer}>
                      {product.discount?.active ? (
                        <View style={styles.discountPriceContainer}>
                          <Text variant="bodySmall" style={styles.originalPrice}>
                            {product.price} ETB
                          </Text>
                          <Text variant="titleLarge" style={[styles.price, { color: theme.colors.primary }]}>
                            {product.finalPrice?.toFixed(2)} ETB
                          </Text>
                        </View>
                      ) : (
                        <Text variant="titleLarge" style={[styles.price, { color: theme.colors.primary }]}>
                          {product.price} ETB
                        </Text>
                      )}
                      <Text variant="bodySmall" style={[styles.unit, { color: theme.colors.onSurfaceVariant }]}>
                        /{product.unit}
                      </Text>
                    </View>

                    <View style={styles.stockContainer}>
                      {product.stock > 0 ? (
                        <View style={styles.stockRow}>
                          <MaterialIcons name="check-circle" size={16} color="#10b981" />
                          <Text variant="bodySmall" style={styles.inStock}>
                            In Stock: {product.stock}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.stockRow}>
                          <MaterialIcons name="cancel" size={16} color="#ef4444" />
                          <Text variant="bodySmall" style={styles.outOfStock}>
                            Out of Stock
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card.Content>
                </Card>
              </TouchableOpacity>

            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
            Showing {filteredProducts.length} of {products.length} products
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SupplierProductsView() {
  const { theme } = useTheme();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/mine');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyProducts();
    setRefreshing(false);
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${productId}`);
              Alert.alert('Success', 'Product deleted successfully');
              await fetchMyProducts();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleEditProduct = (product: Product) => {
    router.push({
      pathname: '/edit-product',
      params: { id: product._id }
    });
  };

  const filteredProducts = products.filter((product) => {
    if (selectedStatus === 'all') return true;
    return product.status === selectedStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const stats = {
    total: products.length,
    approved: products.filter((p) => p.status === 'approved').length,
    pending: products.filter((p) => p.status === 'pending').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="My Products" />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.statsTitle}>
              Product Overview
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {stats.total}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Total
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: '#10b981', fontWeight: 'bold' }}>
                  {stats.approved}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Approved
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                  {stats.pending}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Pending
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                  {stats.rejected}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Rejected
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['all', 'approved', 'pending', 'rejected'].map((status) => (
              <Chip
                key={status}
                selected={selectedStatus === status}
                onPress={() => setSelectedStatus(status)}
                style={styles.filterChip}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory-2" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleMedium" style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              No products found
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              {selectedStatus === 'all' ? 'Add your first product' : `No ${selectedStatus} products`}
            </Text>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((product) => (
              <TouchableOpacity
                key={product._id}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: product._id } })}
              >
                <Card style={styles.supplierProductCardVertical}>
                <View style={styles.imageContainerVertical}>
                  <Card.Cover
                    source={{ uri: product.image || product.images?.[0] || 'https://via.placeholder.com/400x200' }}
                    style={styles.cardImageFullWidth}
                  />
                  {product.stock === 0 && (
                    <View style={styles.outOfStockOverlay}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                </View>

                <Card.Content style={styles.cardContentVertical}>
                  <View style={styles.productHeaderRow}>
                    <View style={styles.productTitleContainer}>
                      <Text variant="titleMedium" numberOfLines={2} style={styles.productName}>
                        {product.name}
                      </Text>
                      <Text variant="bodySmall" style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>
                        {product.category}
                      </Text>
                    </View>
                    <Chip
                      style={{ 
                        backgroundColor: getStatusColor(product.status), 
                        height: 34,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      textStyle={{ 
                        color: '#fff', 
                        fontSize: 11, 
                        fontWeight: 'bold',
                        lineHeight: 16
                      }}
                    >
                      {product.status?.toUpperCase()}
                    </Chip>
                  </View>

                  <View style={styles.priceStockRow}>
                    <View style={styles.priceContainer}>
                      <Text variant="titleLarge" style={[styles.price, { color: theme.colors.primary }]}>
                        {product.price} ETB
                      </Text>
                      <Text variant="bodySmall" style={[styles.unit, { color: theme.colors.onSurfaceVariant }]}>
                        /{product.unit}
                      </Text>
                    </View>

                    <View style={styles.stockContainer}>
                      {product.stock > 0 ? (
                        <View style={styles.stockRow}>
                          <MaterialIcons name="inventory" size={16} color="#10b981" />
                          <Text variant="bodySmall" style={styles.inStock}>
                            Stock: {product.stock}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.stockRow}>
                          <MaterialIcons name="warning" size={16} color="#ef4444" />
                          <Text variant="bodySmall" style={styles.outOfStock}>
                            Out of Stock
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {product.status === 'rejected' && product.rejectionReason && (
                    <Surface style={[styles.rejectionBox, { backgroundColor: '#fee2e2' }]} elevation={0}>
                      <View style={styles.rejectionHeader}>
                        <MaterialIcons name="info" size={16} color="#dc2626" />
                        <Text variant="labelSmall" style={{ color: '#dc2626', fontWeight: 'bold', marginLeft: 6 }}>
                          REJECTION REASON
                        </Text>
                      </View>
                      <Text variant="bodySmall" style={{ color: '#991b1b', marginTop: 4 }}>
                        {product.rejectionReason}
                      </Text>
                    </Surface>
                  )}

                  <Divider style={styles.actionDivider} />

                  <View style={styles.productActions}>
                    {product.status !== 'pending' && (
                      <Button
                        mode="outlined"
                        onPress={() => handleEditProduct(product)}
                        style={styles.actionBtn}
                        icon="pencil"
                        compact
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      mode="outlined"
                      onPress={() => handleDeleteProduct(product._id)}
                      style={[styles.actionBtn, product.status === 'pending' && styles.fullWidthBtn]}
                      buttonColor="#fee2e2"
                      textColor="#dc2626"
                      icon="delete"
                      compact
                    >
                      Delete
                    </Button>
                  </View>
                </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Product"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/add-product')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom:64 },
  content: { flex: 1 },
  searchSection: { padding: 16, paddingBottom: 8 },
  searchbar: { marginBottom: 12 },
  categoryScroll: { marginTop: 8 },
  categoryChip: { marginRight: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16 },
  
  // Vertical card layout
  productList: { padding: 16, gap: 16 },
  productCardVertical: { overflow: 'hidden' },
  supplierProductCardVertical: { overflow: 'hidden' },
  imageContainerVertical: { position: 'relative' },
  cardImageFullWidth: { 
    height: 200, 
    width: '100%',
    borderRadius: 0 
  },
  cardContentVertical: { paddingVertical: 12 },
  
  // Product header row
  productHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 8 
  },
  productTitleContainer: { flex: 1, marginRight: 8 },
  productName: { fontWeight: '600' },
  category: { marginTop: 2, textTransform: 'capitalize' },
  
  // Rating row
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stars: { flexDirection: 'row', marginRight: 6 },
  ratingText: { color: '#6b7280', fontSize: 12 },
  
  // Price and stock row
  priceStockRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 4 
  },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', flex: 1 },
  discountPriceContainer: { flexDirection: 'column' },
  originalPrice: { textDecorationLine: 'line-through', color: '#9ca3af', fontSize: 12 },
  price: { fontWeight: 'bold', marginRight: 4 },
  unit: { fontSize: 12 },
  stockContainer: { alignItems: 'flex-end' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inStock: { color: '#10b981' },
  outOfStock: { color: '#ef4444' },
  
  // Discount styling
  discountContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'center',
  },
  discountBadge: { backgroundColor: '#ef4444' },
  discountExpireText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  
  // Out of stock overlay
  outOfStockOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  outOfStockText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  // Negotiable badge
  negotiableBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(41, 128, 185, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4 
  },
  negotiableText: { fontSize: 11, fontWeight: '600' },
  
  // Footer
  footer: { padding: 16, paddingTop: 8, paddingBottom: 24 },

  // Supplier specific styles
  statsCard: { margin: 16, marginBottom: 8, borderRadius: 12 },
  statsTitle: { fontWeight: 'bold', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1, },
  filterSection: { paddingHorizontal: 16, paddingVertical: 8 },
  filterScroll: {},
  filterChip: { marginRight: 8 },
  
  // Rejection box
  rejectionBox: { 
    marginTop: 12, 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#fca5a5' 
  },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center' },
  
  // Action buttons
  actionDivider: { marginTop: 12, marginBottom: 8 },
  productActions: { 
    flexDirection: 'row', 
    gap: 8, 
    justifyContent: 'flex-end',
    marginTop: 4 
  },
  actionBtn: { minWidth: 80 },
  fullWidthBtn: { flex: 1, maxWidth: '100%' },
  
  // FAB
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
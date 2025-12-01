import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, Alert, Image } from 'react-native';
import { Text, Appbar, Card, Searchbar, Chip, ActivityIndicator, Badge, FAB, Button, Surface, Divider, Avatar } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../../services/api';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const cardWidth = width - 32;

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
  supplier?: {
    companyName?: string;
    profileImage?: string;
  };
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
        stars.push(<MaterialIcons key={i} name="star" size={14} color="#fbbf24" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<MaterialIcons key={i} name="star-half" size={14} color="#fbbf24" />);
      } else {
        stars.push(<MaterialIcons key={i} name="star-border" size={14} color="#d1d5db" />);
      }
    }
    return stars;
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const hasDiscount = product.discount?.active;
    const finalPrice = product.finalPrice || product.price;
    
    return (
      <Card
        style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: product._id } })}
        elevation={2}
      >
        {/* Full Width Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image || product.images?.[0] || 'https://via.placeholder.com/400x300' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          
          {/* Gradient Overlay for better text readability */}
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.2)']}
            style={styles.imageGradient}
          />
          
          {/* Top Row Badges */}
          <View style={styles.topBadgeRow}>
            {/* Supplier Badge */}
            {product.supplier?.companyName && (
              <View style={styles.supplierBadge}>
                <Avatar.Image
                  size={28}
                  source={{ uri: product.supplier.profileImage || 'https://via.placeholder.com/40' }}
                  style={styles.supplierAvatar}
                />
                <View style={styles.supplierText}>
                  <Text variant="labelSmall" style={styles.supplierName} numberOfLines={1}>
                    {product.supplier.companyName}
                  </Text>
                </View>
              </View>
            )}

            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          </View>

          {/* Bottom Row Badges */}
          <View style={styles.bottomBadgeRow}>
            {/* Discount Badge */}
            {hasDiscount && (
              <View style={styles.discountContainer}>
                <View style={styles.discountRibbon}>
                  <Text style={styles.discountPercentage}>
                    {product.discount?.percentage ?? 0}% OFF
                  </Text>
                </View>
                {product.discount?.expiresAt && (
                  <Text style={styles.discountExpireText}>
                    Ends {formatDate(product.discount.expiresAt)}
                  </Text>
                )}
              </View>
            )}

            {/* Out of Stock Badge */}
            {product.stock === 0 && (
              <View style={styles.outOfStockBadge}>
                <MaterialIcons name="block" size={14} color="#fff" />
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>
        </View>

        {/* Card Content Below Image */}
        <Card.Content style={styles.cardContent}>
          {/* Product Name */}
          <Text variant="titleLarge" numberOfLines={2} style={[styles.productName, { color: theme.colors.onSurface }]}>
            {product.name}
          </Text>

          {/* Rating Row */}
          {product.rating?.average && product.rating.average > 0 && (
            <View style={styles.ratingRow}>
              <View style={styles.stars}>
                {renderStars(product.rating.average)}
              </View>
              <Text variant="bodySmall" style={[styles.ratingText, { color: theme.colors.onSurfaceVariant }]}>
                ({product.rating.count || 0} reviews)
              </Text>
            </View>
          )}

          {/* Price Row */}
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              {hasDiscount ? (
                <View style={styles.discountPriceContainer}>
                  <Text variant="bodySmall" style={[styles.originalPrice, { color: theme.colors.onSurfaceVariant }]}>
                    {product.price.toFixed(2)} ETB
                  </Text>
                  <Text variant="headlineSmall" style={[styles.finalPrice, { color: theme.colors.primary }]}>
                    {finalPrice.toFixed(2)} ETB
                  </Text>
                </View>
              ) : (
                <Text variant="headlineSmall" style={[styles.finalPrice, { color: theme.colors.primary }]}>
                  {product.price.toFixed(2)} ETB
                </Text>
              )}
              <Text variant="bodySmall" style={[styles.unit, { color: theme.colors.onSurfaceVariant }]}>
                /{product.unit}
              </Text>
            </View>

            {/* Stock Indicator */}
            <View style={styles.stockIndicator}>
              {product.stock > 0 ? (
                <View style={styles.inStockIndicator}>
                  <MaterialIcons name="check-circle" size={16} color="#10b981" />
                  <Text variant="bodySmall" style={[styles.inStockText, { color: '#10b981' }]}>
                    {product.stock}
                  </Text>
                </View>
              ) : (
                <View style={styles.outOfStockIndicator}>
                  <MaterialIcons name="error" size={16} color="#ef4444" />
                  <Text variant="bodySmall" style={[styles.outOfStockText, { color: '#ef4444' }]}>
                    0
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Additional Info Row */}
          <View style={styles.additionalInfoRow}>
            {/* Negotiable Badge */}
            {product.negotiable && (
              <View style={[styles.negotiableBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
                <MaterialIcons name="handshake" size={14} color={theme.colors.secondary} />
                <Text variant="bodySmall" style={[styles.negotiableText, { color: theme.colors.secondary }]}>
                  Price Negotiable
                </Text>
              </View>
            )}
          </View>

          {/* Action Button */}
          <View style={styles.actionContainer}>
            <Button
              mode="contained"
              style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
              labelStyle={styles.viewButtonLabel}
              icon="arrow-right"
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: product._id } })}
            >
              View Product
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
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
        {/* Search Section */}
        <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
          <Searchbar 
            placeholder="Search products..." 
            onChangeText={setSearchQuery} 
            value={searchQuery} 
            style={[styles.searchbar, { backgroundColor: theme.colors.background }]}
            iconColor={theme.colors.primary}
          />
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => (
              <Chip
                key={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && {
                    backgroundColor: theme.colors.primary,
                  }
                ]}
                textStyle={[
                  styles.categoryChipText,
                  selectedCategory === category && {
                    color: '#fff',
                  }
                ]}
                showSelectedCheck={false}
              >
                {category === 'all' ? 'All Products' : category}
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
            <MaterialIcons name="inventory-2" size={96} color={theme.colors.onSurfaceVariant} />
            <Text variant="titleLarge" style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              No products found
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
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

// Keep the SupplierProductsView mostly the same but with updated styling
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
        return theme.colors.onSurfaceVariant;
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
            <Text variant="titleMedium" style={[styles.statsTitle, { color: theme.colors.onSurface }]}>
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
                style={[
                  styles.filterChip,
                  selectedStatus === status && {
                    backgroundColor: theme.colors.primary,
                  }
                ]}
                textStyle={[
                  selectedStatus === status && {
                    color: '#fff',
                  }
                ]}
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
          <View style={styles.supplierProductsList}>
            {filteredProducts.map((product) => (
              <Card key={product._id} style={[styles.supplierProductCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <View style={styles.productRow}>
                    <View style={styles.productImageThumb}>
                      <Image
                        source={{ uri: product.image || product.images?.[0] || 'https://via.placeholder.com/80' }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={styles.productDetails}>
                      <Text variant="titleMedium" numberOfLines={1} style={[styles.productTitle, { color: theme.colors.onSurface }]}>
                        {product.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {product.category}
                      </Text>

                      <View style={styles.productMeta}>
                        <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                          {product.price} ETB/{product.unit}
                        </Text>
                        <View style={styles.stockBadge}>
                          <MaterialIcons
                            name={product.stock > 0 ? 'inventory' : 'warning'}
                            size={14}
                            color={product.stock > 0 ? '#10b981' : '#ef4444'}
                          />
                          <Text
                            variant="bodySmall"
                            style={{ color: product.stock > 0 ? '#10b981' : '#ef4444', marginLeft: 4 }}
                          >
                            Stock: {product.stock}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.statusRow}>
                        <Chip
                          style={{ backgroundColor: getStatusColor(product.status), alignSelf: 'flex-start' }}
                          textStyle={{ color: '#fff', fontSize: 11 }}
                        >
                          {product.status}
                        </Chip>
                      </View>
                    </View>
                  </View>

                  {product.status === 'rejected' && product.rejectionReason && (
                    <Surface style={[styles.rejectionBox, { backgroundColor: '#fee2e2' }]} elevation={0}>
                      <View style={styles.rejectionHeader}>
                        <MaterialIcons name="info" size={18} color="#dc2626" />
                        <Text variant="labelSmall" style={{ color: '#dc2626', fontWeight: 'bold', marginLeft: 6 }}>
                          REJECTION REASON
                        </Text>
                      </View>
                      <Text variant="bodySmall" style={{ color: '#991b1b', marginTop: 4 }}>
                        {product.rejectionReason}
                      </Text>
                    </Surface>
                  )}

                  <Divider style={[styles.actionDivider, { backgroundColor: theme.colors.outline }]} />

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
  container: { flex: 1 },
  content: { flex: 1 },
  
  // Search Section
  searchSection: {
    padding: 16,
    paddingBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchbar: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 0,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryScrollContent: {
    paddingRight: 16,
  },
  categoryChip: {
    marginRight: 8,
    borderRadius: 20,
    height: 36,
    borderWidth: 0,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Product Card
  productCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  imageContainer: {
    position: 'relative',
    height: 220,
    width: '100%',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // Top Badge Row
  topBadgeRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  supplierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '60%',
  },
  supplierAvatar: {
    marginRight: 6,
  },
  supplierText: {
    flex: 1,
  },
  supplierName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryBadge: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  // Bottom Badge Row
  bottomBadgeRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  discountContainer: {
    alignItems: 'flex-start',
  },
  discountRibbon: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountPercentage: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  discountExpireText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outOfStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Card Content
  cardContent: {
    padding: 20,
    paddingTop: 16,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 20,
    lineHeight: 26,
    color: '#1f2937',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 13,
    color: '#6b7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  priceContainer: {
    flex: 1,
  },
  discountPriceContainer: {
    marginBottom: 2,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    fontSize: 14,
    color: '#9ca3af',
  },
  finalPrice: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#1f2937',
  },
  unit: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  stockIndicator: {
    marginLeft: 16,
  },
  inStockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  outOfStockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  inStockText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Additional Info Row
  additionalInfoRow: {
    marginBottom: 20,
  },
  negotiableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  negotiableText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Action Container
  actionContainer: {
    marginTop: 4,
  },
  viewButton: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  viewButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Product List
  productList: {
    paddingVertical: 16,
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  
  // Footer
  footer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  
  // Supplier View Styles
  statsCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  statsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterScroll: {},
  filterChip: {
    marginRight: 8,
  },
  supplierProductsList: {
    padding: 16,
  },
  supplierProductCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productImageThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbImage: {
    width: 80,
    height: 80,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#1f2937',
  },
  productMeta: {
    marginTop: 8,
    gap: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  rejectionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fee2e2',
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionDivider: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#e5e7eb',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flex: 1,
  },
  fullWidthBtn: {
    flex: 1,
    maxWidth: '100%',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 16,
  },
});
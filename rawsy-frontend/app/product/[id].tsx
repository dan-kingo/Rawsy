import { View, StyleSheet, ScrollView, Alert, Dimensions, TouchableOpacity, Linking } from 'react-native';
import {
  Text,
  Appbar,
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  Badge,
  Surface,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../../services/api';
import RequestQuoteDialog from '../../components/RequestQuoteDialog';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const scrollRef = useRef<any>(null);
  const [supplierY, setSupplierY] = useState<number>(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
const [reviewSummary, setReviewSummary] = useState<any>(null);

  const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
  try {
    setLoading(true);
    const response = await api.get(`/products/${id}`);
    setProduct(response.data);

    const supplierId = response.data?.supplier?._id;

    if (supplierId) {
      fetchReviews(supplierId);
      fetchRatingSummary(supplierId);
    }

  } catch (error) {
    console.error('Error fetching product:', error);
    Alert.alert('Error', 'Failed to load product details');
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
  const handleAddToCart = async () => {
    if (product.stock === 0) {
      Alert.alert('Out of Stock', 'This product is currently unavailable');
      return;
    }

    try {
      setAddingToCart(true);
      await api.post('/cart/add', {
        productId: product._id,
        quantity: 1,
      });
      Alert.alert('Success', 'Product added to cart');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };
const handleBuyNowCheckout = async () => {
  if (!product) {
    Alert.alert('Error', 'Product not found');
    return;
  }

  if (product.stock === 0) {
    Alert.alert('Out of Stock', 'This product is unavailable');
    return;
  }

  const deliveryRequired =
    product?.deliveryAvailable && product?.deliveryAllowed !== false;

  if (deliveryRequired && !user?.factoryLocation?.address) {
    Alert.alert(
      'Delivery Address Required',
      'Please set your factory location in your profile before placing an order.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go to Profile', onPress: () => router.push('/account') },
      ]
    );
    return;
  }

  const availablePaymentMethods =
    product.paymentMethod &&
    Array.isArray(product.paymentMethod) &&
    product.paymentMethod.length > 0
      ? product.paymentMethod
      : ['bank_transfer'];

  const paymentMethod = availablePaymentMethods[0];

  try {
    setCheckingOut(true);

    const checkoutPayload: any = {
      productId: product._id,
      quantity: 1,
      paymentMethod,
    };

    if (deliveryRequired && user?.factoryLocation) {
      checkoutPayload.delivery = {
        address: user.factoryLocation.address,
        contactName: user.factoryLocation.contactName,
        contactPhone: user.factoryLocation.contactPhone,
      };
    }

    const response = await api.post('/cart/checkout-direct', checkoutPayload);

    Alert.alert('Success', 'Order placed successfully!');
  } catch (error: any) {
    console.error('Checkout error:', error);
    Alert.alert('Checkout Error', error.response?.data?.error || 'Checkout failed');
  } finally {
    setCheckingOut(false);
  }
};
  const handleAddToWishlist = async () => {
    try {
      setAddingToWishlist(true);
      await api.post('/wishlist/add', {
        productId: product._id,
      });
      Alert.alert('Success', 'Product added to wishlist');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add to wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<MaterialIcons key={i} name="star" size={18} color="#f59e0b" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<MaterialIcons key={i} name="star-half" size={18} color="#f59e0b" />);
      } else {
        stars.push(<MaterialIcons key={i} name="star-border" size={18} color="#d1d5db" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Product Details" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image || 'https://via.placeholder.com/400'];
  const finalPrice = product.discount?.active ? product.finalPrice : product.price;
  const supplierVerified = Boolean(product.supplier?.verifiedSupplier || product.supplier?.verified || product.supplier?.isVerified);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={product.name} />
        <Appbar.Action icon="store" onPress={() => {
          if (product?.supplier?._id) {
            router.push({ pathname: '/supplier/[id]', params: { id: product.supplier._id, supplier: JSON.stringify(product.supplier) } });
            return;
          }
          try { scrollRef.current?.scrollTo({ y: supplierY - 16, animated: true }); } catch (e) { console.warn('scroll error', e); }
        }} />
        {user?.role === 'manufacturer' && (
          <Appbar.Action
            icon="heart-outline"
            onPress={handleAddToWishlist}
            disabled={addingToWishlist}
          />
        )}
      </Appbar.Header>

      <ScrollView ref={scrollRef} style={styles.content}>
        <View style={styles.imageSection}>
          <View style={styles.mainImageContainer}>
            <Card.Cover
              source={{ uri: images[selectedImage] }}
              style={styles.mainImage}
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

          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
              {images.map((img: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(index)}
                  style={[
                    styles.thumbnail,
                    selectedImage === index && styles.thumbnailSelected,
                  ]}
                >
                  <Card.Cover source={{ uri: img }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <Surface style={styles.infoSection} elevation={1}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text variant="headlineSmall" style={styles.productName}>
                {product.name}
              </Text>
              {product.flagged && (
        <Badge style={styles.flaggedBadge} size={24}>
          FLAGGED
        </Badge>
      )}
              <Chip style={styles.categoryChip} textStyle={{ textTransform: 'capitalize' }}>
                {product.category}
              </Chip>
            </View>
          </View>

          {product.rating?.average > 0 && (
            <View style={styles.ratingRow}>
              <View style={styles.stars}>{renderStars(product.rating.average)}</View>
              <Text variant="bodyMedium" style={styles.ratingText}>
                {product.rating.average.toFixed(1)} ({product.rating.count} reviews)
              </Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.priceSection}>
            {product.discount?.active ? (
              <View>
                <Text variant="bodySmall" style={styles.originalPrice}>
                  {product.price} ETB
                </Text>
                <View style={styles.priceRow}>
                  <Text variant="displaySmall" style={[styles.price, { color: theme.colors.primary }]}>
                    {finalPrice.toFixed(2)} ETB
                  </Text>
                  <Text variant="titleMedium" style={styles.unit}>
                    /{product.unit}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.priceRow}>
                <Text variant="displaySmall" style={[styles.price, { color: theme.colors.primary }]}>
                  {product.price} ETB
                </Text>
                <Text variant="titleMedium" style={styles.unit}>
                  /{product.unit}
                </Text>
              </View>
            )}

            {product.negotiable && (
              <Chip icon="handshake" style={styles.negotiableChip} textStyle={{ color: theme.colors.secondary }}>
                Negotiable Price
              </Chip>
            )}
          </View>

          <View style={styles.stockRow}>
            {product.stock > 0 ? (
              <>
                <MaterialIcons name="check-circle" size={20} color="#10b981" />
                <Text variant="titleMedium" style={styles.inStock}>
                  In Stock: {product.stock} {product.unit}
                </Text>
              </>
            ) : (
              <>
                <MaterialIcons name="cancel" size={20} color="#ef4444" />
                <Text variant="titleMedium" style={styles.outOfStock}>
                  Out of Stock
                </Text>
              </>
            )}
          </View>
        </Surface>

        {product.description && (
          <Surface style={styles.section} elevation={1}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Description
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              {product.description}
            </Text>
          </Surface>
        )}

        <Surface style={styles.section} elevation={1} onLayout={(e) => setSupplierY(e.nativeEvent.layout.y)}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Supplier Information
          </Text>
          <View style={styles.supplierRow}>
            <MaterialIcons name="store" size={28} color={theme.colors.primary} />
            <View style={styles.supplierInfo}>
              <View style={styles.supplierHeaderRow}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  {product.supplier?.name || 'Unknown Supplier'}
                </Text>
                {supplierVerified && (
                  <Badge style={styles.verifiedBadge} size={20}>Verified</Badge>
                )}
              </View>

              {product.supplier?.companyName && (
                <Text variant="bodyMedium" style={styles.supplierText}>
                  {product.supplier.companyName}
                </Text>
              )}
              {reviewSummary && (
  <View style={{ marginTop: 6 }}>
    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
      ⭐ {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews} reviews)
    </Text>
  </View>
)}

{reviews && reviews.length > 0 && (
  <View style={{ marginTop: 16 }}>
    <Text variant="titleMedium">Reviews</Text>
    {reviews.map((review: any) => (
      <Card key={review._id} style={{ marginTop: 8, borderRadius: 8 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text variant="titleSmall" style={{ fontWeight: 'bold', marginRight: 8 }}>
              {review.user?.name || 'Anonymous'}
            </Text>
            <Text style={{ color: '#f59e0b' }}>
              {'⭐'.repeat(Math.round(review.rating))}
            </Text>
          </View>
          <Text variant="bodyMedium">{review.comment}</Text>
          <Text variant="bodySmall" style={{ color: '#6b7280', marginTop: 4 }}>
            {new Date(review.createdAt).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>
    ))}
  </View>
)}

              {product.supplier?.location && (
                <View style={styles.supplierRowInline}>
                  <MaterialIcons name="location-on" size={16} color="#6b7280" />
                  <Text variant="bodySmall" style={styles.supplierText}>
                    {product.supplier.location}
                  </Text>
                </View>
              )}

              {product.supplier?.contact && (
                <TouchableOpacity
                  style={styles.supplierRowInline}
                  onPress={() => Linking.openURL(`tel:${product.supplier.contact}`)}
                >
                  <MaterialIcons name="phone" size={16} color="#6b7280" />
                  <Text variant="bodySmall" style={[styles.supplierText, { color: theme.colors.primary }]}>
                    {product.supplier.contact}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Surface>
      </ScrollView>

      {user?.role === 'manufacturer' && (
        <Surface style={styles.actionBar} elevation={4}>
          <Button
            mode="outlined"
            onPress={handleAddToCart}
            loading={addingToCart}
            disabled={addingToCart || product.stock === 0}
            style={styles.actionButton}
            icon="cart"
          >
            Add to Cart
          </Button>
          {product.negotiable && (
            <Button
              mode="contained"
              onPress={() => setShowQuoteDialog(true)}
              style={styles.actionButton}
              icon="handshake"
            >
              Request Quote
            </Button>
          )}
          {!product.negotiable && (
            <Button
              mode="contained"
              onPress={handleBuyNowCheckout}
              loading={checkingOut}
              disabled={checkingOut || !product || product.stock === 0}
              style={styles.actionButton}
              icon="shopping"
            >
              Buy Now
            </Button>
          )}
        </Surface>
      )}

      <RequestQuoteDialog
        visible={showQuoteDialog}
        onDismiss={() => setShowQuoteDialog(false)}
        product={product}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSection: {
    backgroundColor: '#fff',
  },
  mainImageContainer: {
    position: 'relative',
    width: width,
    height: width,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ef4444',
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
  outOfStockText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
  },
  thumbnailScroll: {
    padding: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: '#2563eb',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    color: '#6b7280',
  },
  divider: {
    marginVertical: 16,
  },
  priceSection: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  price: {
    fontWeight: 'bold',
  },
  unit: {
    marginLeft: 8,
    color: '#6b7280',
  },
  negotiableChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#d1fae5',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inStock: {
    color: '#10b981',
    fontWeight: '600',
  },
  outOfStock: {
    color: '#ef4444',
    fontWeight: '600',
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    lineHeight: 24,
    color: '#4b5563',
  },
  supplierRow: {
    flexDirection: 'row',
    gap: 12,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierText: {
    color: '#4b5563',
    marginTop: 2,
  },
  supplierRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedBadge: {
    marginLeft: 8,
    backgroundColor: '#10b981',
    color: '#fff',
    height: 20,
    alignSelf: 'center',
  },
  supplierHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
  },

  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flaggedBadge: {
    backgroundColor: '#ef4444',
    color: '#fff',
    fontWeight: 'bold',
  },
  discountContainer: {
  position: 'absolute',
  top: 12,
  right: 12,
  alignItems: 'center',
},

discountExpireText: {
  marginTop: 4,
  fontSize: 11,
  color: '#fff',
  backgroundColor: 'rgba(0,0,0,0.6)',
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 6,
},

});

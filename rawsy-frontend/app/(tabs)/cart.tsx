import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Appbar, Button, Card, IconButton, Divider, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import CheckoutDialog from '../../components/CheckoutDialog';

export default function CartScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart/list');
      setCart(response.data.cart || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await api.post('/cart/update', { productId, quantity: newQuantity });
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await api.post('/cart/remove', { productId });
      await fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    const firstProduct = cart[0]?.product;
    if (!firstProduct) {
      Alert.alert('Error', 'Invalid cart data');
      return;
    }

    const deliveryRequired = cart.some((item) => {
      const prod = item.product;
      return prod?.deliveryAvailable && prod?.deliveryAllowed !== false;
    });

    if (deliveryRequired && !user?.factoryLocation?.address) {
      Alert.alert(
        'Delivery Address Required',
        'Please set your factory location in your profile before placing an order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => {} }
        ]
      );
      return;
    }

    setShowCheckoutDialog(true);
  };

  const calculateTotal = () => {
  return cart.reduce((sum, item) => {
    const product = item.product;
    const price = product?.discount?.active
      ? product.finalPrice
      : product?.price || 0;

    return sum + price * item.quantity;
  }, 0);
};


  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.Content title="Cart" />
          <Appbar.Action icon="refresh" onPress={fetchCart} disabled={loading} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Content title="Cart" />
        <Appbar.Action icon="refresh" onPress={fetchCart} disabled={loading} />
      </Appbar.Header>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={64} color={theme.colors.onBackground} />
          <Text variant="headlineSmall" style={styles.emptyText}>
            Your cart is empty
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Add products to get started
          </Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.content}>
            {cart.map((item, index) => (
              <Card key={index} style={styles.cartItem}>
                <Card.Content>
                  <View style={styles.itemRow}>
                    {item.product?.image || item.product?.images?.[0] ? (
                      <Image
                        source={{ uri: item.product.image || item.product.images[0] }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={styles.itemInfo}>
                      <Text variant="titleMedium" numberOfLines={2}>
                        {item.product?.name || 'Unknown Product'}
                      </Text>
                      <Text variant="bodySmall" style={styles.category}>
                        {item.product?.category}
                      </Text>
                      <Text variant="titleMedium" style={styles.itemPrice}>
{(item.product?.discount?.active
  ? item.product.finalPrice
  : item.product?.price)} ETB/{item.product?.unit}
                      </Text>
                    </View>

                    <View style={styles.quantityControls}>
                      <IconButton
                        icon="minus"
                        size={20}
                        onPress={() => updateQuantity(item.product._id, item.quantity - 1)}
                      />
                      <Text variant="titleMedium" style={styles.quantity}>
                        {item.quantity}
                      </Text>
                      <IconButton
                        icon="plus"
                        size={20}
                        onPress={() => updateQuantity(item.product._id, item.quantity + 1)}
                      />
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.itemFooter}>
                    <Text variant="titleMedium" style={styles.subtotal}>
Subtotal: {(
  (item.product?.discount?.active
    ? item.product.finalPrice
    : item.product?.price || 0) * item.quantity
).toFixed(2)} ETB
                    </Text>
                    <IconButton
                      icon="delete"
                      iconColor={theme.colors.error}
                      size={24}
                      onPress={() => removeItem(item.product._id)}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.totalRow}>
              <Text variant="titleLarge">Total:</Text>
              <Text variant="headlineSmall" style={styles.totalAmount}>
                {calculateTotal()} ETB
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={handleCheckout}
              style={styles.checkoutButton}
              icon="shopping"
            >
              Proceed to Checkout
            </Button>
          </View>
        </>
      )}

      <CheckoutDialog
        visible={showCheckoutDialog}
        onDismiss={() => setShowCheckoutDialog(false)}
        cartItems={cart}
        totalAmount={calculateTotal()}
        onSuccess={() => {
          fetchCart();
        }}
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginBottom: 8,
    color: '#fff',
  },
  emptySubtext: {
    color: '#fff',
  },
  cartItem: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  category: {
    color: '#fff',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  itemPrice: {
    color: '#fff',
    marginTop: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  quantity: {
    paddingHorizontal: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotal: {
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#fff',
  },
  checkoutButton: {
    paddingVertical: 8,
  },
});

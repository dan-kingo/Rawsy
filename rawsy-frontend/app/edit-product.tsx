import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Appbar,
  Surface,
  HelperText,
  Chip,
  Switch,
  ActivityIndicator,
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const CATEGORIES = [
  'Agriculture',
  'Cotton',
  'Leather',
  'Fabric',
  'Textile',
  'Wool',
  'Polyester',
  'Silk',
  'Other',
];

const UNITS = ['kg', 'ton', 'meter', 'yard', 'piece', 'roll'];

export default function EditProductScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productStatus, setProductStatus] = useState<string | undefined>(undefined);
const [discountPercentage, setDiscountPercentage] = useState('');
const [discountExpiry, setDiscountExpiry] = useState<Date | null>(null);
const [showDatePicker, setShowDatePicker] = useState(false);
const [savingDiscount, setSavingDiscount] = useState(false);
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      console.log('Product response:', response.data);

      // Handle both response.data and response.data.product structures
      const product = response.data?.product || response.data;

      if (!product || !product._id) {
        throw new Error('Product not found');
      }

      setName(product.name || '');
      setDescription(product.description || '');
      setCategory(product.category || '');
      setPrice(String(product.price || ''));
      setUnit(product.unit || 'kg');
      setStock(String(product.stock || ''));
      setNegotiable(product.negotiable || false);
      setProductStatus(product.status);
       if (product.discount?.active) {
      setDiscountPercentage(String(product.discount.percentage));
      setDiscountExpiry(product.discount.expiresAt ? new Date(product.discount.expiresAt) : null);
    }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load product details';
      Alert.alert('Error', errorMsg);
      router.back();
    } finally {
      setLoading(false);
    }
  };
  // Apply discount
const handleApplyDiscount = async () => {
  if (!discountPercentage || isNaN(Number(discountPercentage)) || Number(discountPercentage) < 1 || Number(discountPercentage) > 90) {
    Alert.alert('Error', 'Discount must be between 1–90%');
    return;
  }

  try {
    setSavingDiscount(true);
    await api.put('/products/discount/add', {
      productId: id,
      percentage: Number(discountPercentage),
      expiresAt: discountExpiry ? discountExpiry.toISOString() : null
    });
    Alert.alert('Success', 'Discount applied successfully');
  } catch (err: any) {
    Alert.alert('Error', err.response?.data?.error || 'Failed to apply discount');
  } finally {
    setSavingDiscount(false);
  }
};

// Remove discount
const handleRemoveDiscount = async () => {
  try {
    setSavingDiscount(true);
    await api.put(`/products/discount/remove/${id}`);
    setDiscountPercentage('');
    setDiscountExpiry(null);
    Alert.alert('Success', 'Discount removed successfully');
  } catch (err: any) {
    Alert.alert('Error', err.response?.data?.error || 'Failed to remove discount');
  } finally {
    setSavingDiscount(false);
  }
};
  const handleSubmit = async () => {
    setError('');

    if (!name || !category || !price || !stock) {
      setError('Please fill in all required fields');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseFloat(stock);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError('Please enter a valid stock quantity');
      return;
    }

    try {
      setSaving(true);

      const productData = {
        name: name.trim(),
        description: description.trim(),
        category,
        price: priceNum,
        unit,
        stock: stockNum,
        negotiable,
      };

      // Preserve existing status when updating: do not demote approved products to pending
      if (productStatus) {
        // include status explicitly so backend can decide to keep it
        (productData as any).status = productStatus;
      }

      await api.put(`/products/${id}`, productData);

      Alert.alert(
        'Success',
        productStatus === 'approved'
          ? 'Product updated successfully.'
          : 'Product updated successfully. It will be reviewed by admin.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Edit Product" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Edit Product" />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.content}>
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Product Information
            </Text>

            <TextInput
              label="Product Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              placeholder="e.g. Premium Cotton Fabric"
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Describe your product..."
            />

            <Text variant="labelLarge" style={styles.label}>
              Category *
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  style={styles.categoryChip}
                >
                  {cat}
                </Chip>
              ))}
            </View>
          </Surface>

          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Pricing & Stock
            </Text>

            <View style={styles.row}>
              <TextInput
                label="Price (ETB) *"
                value={price}
                onChangeText={setPrice}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, styles.halfInput]}
                placeholder="0.00"
              />

              <View style={[styles.input, styles.halfInput]}>
                <Text variant="labelLarge" style={styles.label}>
                  Unit *
                </Text>
                <View style={styles.unitGrid}>
                  {UNITS.map((u) => (
                    <Chip
                      key={u}
                      selected={unit === u}
                      onPress={() => setUnit(u)}
                      style={styles.unitChip}
                    >
                      {u}
                    </Chip>
                  ))}
                </View>
              </View>
            </View>

            <TextInput
              label="Stock Quantity *"
              value={stock}
              onChangeText={setStock}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              placeholder="0"
            />

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text variant="bodyLarge">Negotiable Price</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Allow buyers to request custom quotes
                </Text>
              </View>
              <Switch value={negotiable} onValueChange={setNegotiable} />
            </View>
          </Surface>
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
  <Text variant="titleMedium" style={styles.sectionTitle}>
    Discount
  </Text>

  <TextInput
    label="Discount Percentage (%)"
    value={discountPercentage}
    onChangeText={setDiscountPercentage}
    mode="outlined"
    keyboardType="numeric"
    style={styles.input}
    placeholder="e.g. 10"
  />

  <View style={{ marginBottom: 16 }}>
    <Button
      mode="outlined"
      onPress={() => setShowDatePicker(true)}
    >
      {discountExpiry ? `Expires: ${discountExpiry.toDateString()}` : 'Set Expiry Date (Optional)'}
    </Button>
    {showDatePicker && (
      <DateTimePicker
        value={discountExpiry || new Date()}
        mode="date"
        display="default"
        onChange={(event, date) => {
          setShowDatePicker(false);
          if (date) setDiscountExpiry(date);
        }}
      />
    )}
  </View>

  <View style={{ flexDirection: 'row', gap: 12 }}>
    <Button mode="contained" onPress={handleApplyDiscount} loading={savingDiscount} style={{ flex: 1 }}>
      Apply / Update Discount
    </Button>
    <Button mode="outlined" onPress={handleRemoveDiscount} disabled={!discountPercentage} style={{ flex: 1 }}>
      Remove Discount
    </Button>
  </View>
</Surface>

          {error && (
            <HelperText type="error" visible={!!error} style={styles.error}>
              {error}
            </HelperText>
          )}

          <View style={[styles.infoBox, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
              {productStatus === 'approved'
                ? 'This product is approved — updates will remain approved and appear immediately.'
                : 'After updating, your product will be reviewed by admin before changes appear in the marketplace.'}
            </Text>
          </View>
        </ScrollView>

        <Surface style={[styles.footer, {backgroundColor: theme.colors.surface}]} elevation={4}>
          <Button mode="outlined" onPress={() => router.back()} style={styles.footerButton} disabled={saving}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={saving}
            disabled={saving}
            style={styles.footerButton}
          >
            Update Product
          </Button>
        </Surface>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitChip: {
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
  error: {
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});

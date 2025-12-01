import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Appbar,
  Surface,
  HelperText,
  Chip,
  Switch,
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
const PAYMENT_METHODS = [
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'cash on delivery', value: 'cash' },
];
export default function AddProductScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>(['bank_transfer']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
// Add this inside your component
const togglePaymentMethod = (method: string) => {
  setSelectedPaymentMethods((prev) =>
    prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
  );
};

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((asset) => asset.uri);
      setImages([...images, ...uris].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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
if (selectedPaymentMethods.length === 0) {
      setError('Select at least one payment method');
      return;
    }
    try {
      setLoading(true);

      const productData = {
        name: name.trim(),
        description: description.trim(),
        category,
        price: priceNum,
        unit,
        stock: stockNum,
        negotiable,
        paymentMethods: selectedPaymentMethods,
      };

      const response = await api.post('/products', productData);
      const productId = response.data.product._id;

      if (images.length > 0) {
        for (const imageUri of images) {
          const formData = new FormData();
          const imageFile: any = {
            uri: imageUri,
            type: 'image/jpeg',
            name: `product_${productId}_${Date.now()}.jpg`,
          };
          formData.append('image', imageFile);

          await api.post(`/products/${productId}/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      Alert.alert(
        'Success',
        'Product submitted for admin review',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add New Product" />
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
            <Text variant="titleMedium" style={styles.sectionTitle}>Payment Methods *</Text>
            <View style={styles.categoryGrid}>
              {PAYMENT_METHODS.map((method) => (
                <Chip
                  key={method.value}
                  selected={selectedPaymentMethods.includes(method.value)}
                  onPress={() => togglePaymentMethod(method.value)}
                  style={styles.categoryChip}
                >
                  {method.label}
                </Chip>
              ))}
            </View>
          </Surface>
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Product Images
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
              Add up to 5 images
            </Text>

            <Button
              mode="outlined"
              onPress={pickImage}
              icon="camera"
              style={styles.imageButton}
              disabled={images.length >= 5}
            >
              {images.length === 0 ? 'Add Images' : `Add More (${images.length}/5)`}
            </Button>

            {images.length > 0 && (
              <View style={styles.imagePreviewGrid}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Surface style={styles.imageContainer} elevation={2}>
                      <Image
                        source={{ uri }}
                        accessibilityLabel={`Preview ${index + 1}`}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </Surface>
                    <Button
                      mode="text"
                      icon="close"
                      onPress={() => removeImage(index)}
                      style={styles.removeButton}
                      textColor={theme.colors.error}
                    >
                      Remove
                    </Button>
                  </View>
                ))}
              </View>
            )}
          </Surface>

          {error && (
            <HelperText type="error" visible={!!error} style={styles.error}>
              {error}
            </HelperText>
          )}

          <View style={styles.infoBox}>
            <MaterialIcons name="info" size={20} color={theme.colors.primary} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1, marginLeft: 8 }}>
              Your product will be reviewed by admin before it appears in the marketplace. You will be notified once approved.
            </Text>
          </View>
        </ScrollView>

        <Surface style={[styles.footer, { backgroundColor: theme.colors.background }]} elevation={4}>
          <Button mode="outlined" onPress={() => router.back()} style={styles.footerButton} disabled={loading}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.footerButton}
          >
            Submit for Review
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
  imageButton: {
    marginBottom: 16,
  },
  imagePreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imagePreview: {
    width: 100,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  removeButton: {
    padding: 0,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#3a74e9ff',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    alignItems: 'flex-start',
  },
  error: {
    paddingHorizontal: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 48,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});

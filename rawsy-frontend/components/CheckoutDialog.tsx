import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import {
  Dialog,
  Portal,
  Text,
  Button,
  RadioButton,
  ProgressBar,
  Divider,
  Surface,
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../services/api';

interface CheckoutDialogProps {
  visible: boolean;
  onDismiss: () => void;
  cartItems: any[];
  totalAmount: number;
  onSuccess: () => void;
}

export default function CheckoutDialog({
  visible,
  onDismiss,
  cartItems,
  totalAmount,
  onSuccess,
}: CheckoutDialogProps) {
  const { theme } = useTheme();
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [availableMethods, setAvailableMethods] = useState<string[]>(['bank_transfer']);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (cartItems.length > 0 && cartItems[0].product) {
      const product = cartItems[0].product;
      const methods = product.paymentMethod && product.paymentMethod.length > 0
        ? product.paymentMethod
        : ['bank_transfer'];

      setAvailableMethods(methods);
      setPaymentMethod(methods[0]);
    }
  }, [cartItems]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload payment proof');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCheckout = async () => {
    if (paymentMethod === 'bank_transfer' && !selectedImage) {
      Alert.alert('Payment Proof Required', 'Please upload a screenshot of your bank transfer');
      return;
    }

    try {
      setProcessing(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);

      if (paymentMethod === 'bank_transfer' && selectedImage) {
        const imageFile: any = {
          uri: selectedImage,
          type: 'image/jpeg',
          name: `payment_${Date.now()}.jpg`,
        };
        formData.append('paymentProof', imageFile);
      }

      const response = await api.post(
        '/cart/checkout',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = progressEvent.loaded / progressEvent.total;
              setUploadProgress(progress);
            }
          },
        }
      );

      Alert.alert(
        'Success',
        'Order placed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedImage(null);
              setUploadProgress(0);
              onDismiss();
              onSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Checkout error:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setUploadProgress(0);
    onDismiss();
  };

  const formatPaymentMethod = (method: string) => {
    return method.replace('_', ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancel} style={styles.dialog}>
        <Dialog.Title>Complete Your Order</Dialog.Title>

        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Surface style={[styles.summarySection, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text variant="bodyMedium">Items:</Text>
                <Text variant="bodyMedium">{cartItems.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text variant="titleLarge">Total:</Text>
                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                  {totalAmount.toFixed(2)} ETB
                </Text>
              </View>
            </Surface>

            <Divider style={styles.divider} />

            <View style={styles.paymentSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Payment Method</Text>

              <RadioButton.Group onValueChange={setPaymentMethod} value={paymentMethod}>
                {availableMethods.map((method) => (
                  <View key={method} style={styles.radioItem}>
                    <RadioButton.Item
                      label={formatPaymentMethod(method)}
                      value={method}
                      disabled={processing}
                      position="leading"
                      style={styles.radioButton}
                    />
                    {method === 'bank_transfer' && (
                      <View style={styles.methodInfo}>
                        <MaterialIcons name="account-balance" size={16} color={theme.colors.primary} />
                        <Text variant="bodySmall" style={[styles.methodInfoText, { color: theme.colors.onSurfaceVariant }]}>
                          Upload payment proof after transfer
                        </Text>
                      </View>
                    )}
                    {method === 'cash_on_delivery' && (
                      <View style={styles.methodInfo}>
                        <MaterialIcons name="local-shipping" size={16} color={theme.colors.primary} />
                        <Text variant="bodySmall" style={[styles.methodInfoText, { color: theme.colors.onSurfaceVariant }]}>
                          Pay when you receive the order
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </RadioButton.Group>
            </View>

            {paymentMethod === 'bank_transfer' && (
              <>
                <Divider style={styles.divider} />

                <View style={styles.uploadSection}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>Payment Proof</Text>

                  <View style={[styles.infoBox, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <MaterialIcons name="info" size={20} color={theme.colors.secondary} />
                    <Text variant="bodySmall" style={[styles.infoText, { color: theme.colors.onSecondaryContainer }]}>
                      Please complete your bank transfer and upload a screenshot or photo of the payment confirmation
                    </Text>
                  </View>

                  {selectedImage ? (
                    <View style={styles.imagePreview}>
                      <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                      <Button
                        mode="outlined"
                        onPress={pickImage}
                        disabled={processing}
                        style={styles.changeButton}
                        icon="image"
                      >
                        Change Image
                      </Button>
                    </View>
                  ) : (
                    <Button
                      mode="contained-tonal"
                      onPress={pickImage}
                      icon="camera"
                      style={styles.selectButton}
                      disabled={processing}
                    >
                      Upload Payment Proof
                    </Button>
                  )}
                </View>
              </>
            )}

            {processing && (
              <View style={styles.progressContainer}>
                <Text variant="bodySmall" style={styles.progressText}>
                  {paymentMethod === 'bank_transfer' ? 'Uploading...' : 'Processing...'} {Math.round(uploadProgress * 100)}%
                </Text>
                <ProgressBar progress={uploadProgress} color={theme.colors.primary} />
              </View>
            )}
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions>
          <Button onPress={handleCancel} disabled={processing}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleCheckout}
            loading={processing}
            disabled={processing}
            icon="check"
          >
            Place Order
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  summarySection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  paymentSection: {
    marginBottom: 8,
  },
  radioItem: {
    marginBottom: 8,
  },
  radioButton: {
    paddingLeft: 0,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 56,
    marginTop: -8,
    marginBottom: 8,
    gap: 8,
  },
  methodInfoText: {
    flex: 1,
    lineHeight: 18,
  },
  uploadSection: {
    marginBottom: 8,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
  },
  imagePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  changeButton: {
    width: '100%',
  },
  selectButton: {
    marginVertical: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressText: {
    marginBottom: 8,
    textAlign: 'center',
    color: '#6b7280',
  },
});

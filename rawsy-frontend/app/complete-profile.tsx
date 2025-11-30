import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Appbar,
  Surface,
  Divider,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';

export default function CompleteProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Prefill fields from the current user where available
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [tinNumber, setTinNumber] = useState(user?.tinNumber || '');
  const [description, setDescription] = useState(user?.companyDescription || '');

  // location: supplier -> businessLocation, manufacturer -> factoryLocation
  const existingLocation: any = user?.businessLocation || user?.factoryLocation || {};
  const [address, setAddress] = useState(existingLocation.address || '');
  const [placeName, setPlaceName] = useState(existingLocation.placeName || '');
  const [contactName, setContactName] = useState(existingLocation.contactName || user?.name || '');
  const [contactPhone, setContactPhone] = useState(existingLocation.contactPhone || user?.phone || '');
  const [latitude, setLatitude] = useState(
    existingLocation.coordinates?.lat !== undefined ? String(existingLocation.coordinates.lat) : ''
  );
  const [longitude, setLongitude] = useState(
    existingLocation.coordinates?.lng !== undefined ? String(existingLocation.coordinates.lng) : ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);

  const isSupplier = user?.role === 'supplier';
  const isManufacturer = user?.role === 'manufacturer';

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    setError('');

    // companyName is required for all roles
    if (!companyName) {
      setError('Company name is required');
      return;
    }

    // Require location/contact for suppliers
    if (isSupplier) {
      if (!address || !contactName || !contactPhone) {
        setError('Please fill all required fields for suppliers');
        return;
      }
    }

    try {
      setLoading(true);

      const updates: any = {};
      if (companyName) updates.companyName = companyName;
      if (tinNumber) updates.tinNumber = tinNumber;
      if (description) updates.description = description;

      await api.put('/auth/me', updates);

      // Submit location for either role when provided. Backend will map to factoryLocation or businessLocation based on role.
      if ((isSupplier || isManufacturer) && address && contactName && contactPhone) {
        const lat = parseFloat(latitude) || 9.03;
        const lng = parseFloat(longitude) || 38.74;

        await api.put('/auth/me/location', {
          address,
          placeName,
          contactName,
          contactPhone,
          lat,
          lng,
        });
      }

      if (profileImage) {
        const formData = new FormData();
        const imageFile: any = {
          uri: profileImage,
          type: 'image/jpeg',
          name: `profile_${user?._id}_${Date.now()}.jpg`,
        };
        formData.append('image', imageFile);

        await api.post('/auth/me/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      await refreshUser();

      Alert.alert('Success', 'Profile completed successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Content title="Complete Profile" />
        <Appbar.Action icon="close" onPress={handleSkip} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.content}>
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Company Information
            </Text>

            <TextInput
              label={'Company Name *'}
              value={companyName}
              onChangeText={setCompanyName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="TIN Number"
              value={tinNumber}
              onChangeText={setTinNumber}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Company Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />
          </Surface>

          {(isSupplier || isManufacturer) && (
            <>
              <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  {isManufacturer ? 'Factory Location *' : 'Business Location *'}
                </Text>

                <TextInput
                  label="Address *"
                  value={address}
                  onChangeText={setAddress}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                />

                <TextInput
                  label="Place Name"
                  value={placeName}
                  onChangeText={setPlaceName}
                  mode="outlined"
                  placeholder="e.g. Merkato, Addis Ababa"
                  style={styles.input}
                />

                <View style={styles.row}>
                  <TextInput
                    label="Latitude"
                    value={latitude}
                    onChangeText={setLatitude}
                    mode="outlined"
                    keyboardType="numeric"
                    placeholder="9.03"
                    style={[styles.input, styles.halfInput]}
                  />
                  <TextInput
                    label="Longitude"
                    value={longitude}
                    onChangeText={setLongitude}
                    mode="outlined"
                    keyboardType="numeric"
                    placeholder="38.74"
                    style={[styles.input, styles.halfInput]}
                  />
                </View>
              </Surface>

              <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Contact Person {isSupplier ? '*' : ''}
                </Text>

                <TextInput
                  label="Contact Name"
                  value={contactName}
                  onChangeText={setContactName}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Contact Phone"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </Surface>
            </>
          )}

          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Profile Image
            </Text>

            <Button mode="outlined" onPress={pickImage} icon="camera" style={styles.imageButton}>
              {profileImage ? 'Change Image' : 'Upload Company Logo'}
            </Button>

            {profileImage && (
              <Text variant="bodySmall" style={styles.imageText}>
                Image selected
              </Text>
            )}
          </Surface>

          {error && (
            <HelperText type="error" visible={!!error} style={styles.error}>
              {error}
            </HelperText>
          )}

          <View style={styles.infoBox}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
              {isManufacturer
                ? 'You can complete your profile now or skip and do it later from your account settings.'
                : 'Suppliers must provide business location and contact details to start selling on Rawsy.'}
            </Text>
          </View>
        </ScrollView>

        <Surface style={styles.footer} elevation={4}>
          <Button mode="outlined" onPress={handleSkip} style={styles.footerButton} disabled={loading}>
            {isManufacturer ? 'Skip for Now' : 'Complete Later'}
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.footerButton}
          >
            {isSupplier ? 'Submit for Review' : 'Save Profile'}
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  imageButton: {
    marginBottom: 8,
  },
  imageText: {
    color: '#10b981',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#fff',
  },
  footerButton: {
    flex: 1,
  },
});

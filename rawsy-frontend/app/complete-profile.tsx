import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Appbar,
  Surface,
  Divider,
  HelperText,
  Badge,
  Avatar,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function CompleteProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user is approved, show read-only profile
  if (user?.status === 'approved') {
    return <ApprovedProfileView />;
  }

  // Original profile completion form below
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [tinNumber, setTinNumber] = useState(user?.tinNumber || '');
  const [description, setDescription] = useState(user?.companyDescription || '');

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

  const fillCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Location permission is required to get current location');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      if (loc?.coords) {
        setLatitude(String(loc.coords.latitude));
        setLongitude(String(loc.coords.longitude));
      } else {
        Alert.alert('Location error', 'Unable to get current location');
      }
    } catch (err) {
      console.warn('Failed to get location', err);
      Alert.alert('Location error', 'Failed to fetch current location');
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

                  <IconButton
                    icon="crosshairs-gps"
                    onPress={fillCurrentLocation}
                    style={styles.locButton}
                    accessibilityLabel="Use current location"
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

        <Surface style={[styles.footer, {backgroundColor: theme.colors.background}]} elevation={4}>
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

// Approved Profile View Component
function ApprovedProfileView() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  const isSupplier = user?.role === 'supplier';
  const isManufacturer = user?.role === 'manufacturer';
  const location = user?.businessLocation || user?.factoryLocation || {};

  const handleBack = () => {
    router.back();
  };

 

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title="Company Profile" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Profile Header with Approval Badge */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.profileHeader}>
            {user?.profileImage ? (
              <Avatar.Image 
                source={{ uri: user.profileImage }} 
                size={80}
                style={styles.profileAvatar}
              />
            ) : (
              <Avatar.Text 
                label={user?.companyName?.charAt(0) || 'C'} 
                size={80}
                style={styles.profileAvatar}
              />
            )}
            
            <View style={styles.profileTitleContainer}>
              <Text variant="titleLarge" style={styles.companyName}>
                {user?.companyName || 'Company Name'}
              </Text>
              <Badge 
                style={[styles.approvedBadge, { backgroundColor: theme.colors.primary }]}
                size={24}
              >
                approved
              </Badge>
            </View>
            
            <Text variant="bodyMedium" style={[styles.roleText, { color: theme.colors.onSurfaceVariant }]}>
              {isSupplier ? 'Supplier' : isManufacturer ? 'Manufacturer' : 'Buyer'}
            </Text>
          </View>
        </Surface>

        {/* Company Information */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Company Information
          </Text>
          
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>Company Name:</Text>
            <Text variant="bodyMedium">{user?.companyName || 'Not provided'}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>TIN Number:</Text>
            <Text variant="bodyMedium">{user?.tinNumber || 'Not provided'}</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>Description:</Text>
            <Text variant="bodyMedium" style={styles.descriptionText}>
              {user?.companyDescription || 'No description provided'}
            </Text>
          </View>
        </Surface>

        {/* Location Information */}
        {(isSupplier || isManufacturer) && location && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {isManufacturer ? 'Factory Location' : 'Business Location'}
            </Text>
            
            {location.address && (
              <>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Address:</Text>
                  <Text variant="bodyMedium">{location.address}</Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}
            
            {location.placeName && (
              <>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Place Name:</Text>
                  <Text variant="bodyMedium">{location.placeName}</Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}
            
            {location.contactName && (
              <>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Contact Person:</Text>
                  <Text variant="bodyMedium">{location.contactName}</Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}
            
            {location.contactPhone && (
              <>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Contact Phone:</Text>
                  <Text variant="bodyMedium">{location.contactPhone}</Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}
            
            {location.coordinates && (
              <View style={styles.coordinatesRow}>
                <View style={styles.coordinateItem}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Latitude:</Text>
                  <Text variant="bodyMedium">{location.coordinates.lat?.toFixed(6)}</Text>
                </View>
                <View style={styles.coordinateItem}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Longitude:</Text>
                  <Text variant="bodyMedium">{location.coordinates.lng?.toFixed(6)}</Text>
                </View>
              </View>
            )}
          </Surface>
        )}

        {/* Account Status */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account Status
          </Text>
          
          <View style={styles.statusContainer}>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.infoLabel}>Verification Status:</Text>
              <Badge 
                style={[styles.statusBadge, { 
                  backgroundColor: user?.status === 'approved' ? '#10b981' : '#f59e0b' 
                }]}
              >
                {user?.status === 'approved' ? 'approved' : 'pending'}
              </Badge>
            </View>
            
            <Divider style={styles.divider} />
            
          
          </View>
        </Surface>

        {/* Action Buttons */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
         
          
          <Button 
            mode="outlined" 
            onPress={handleBack}
            style={styles.backButton}
            icon="arrow-left"
          >
            Back to Dashboard
          </Button>
        </Surface>
      </ScrollView>
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
    marginBottom: 48,
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
  locButton: {
    marginLeft: 8,
    alignSelf: 'center',
    height: 48,
  },
  infoBox: {
    backgroundColor: '#2f72f8ff',
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
    marginBottom: 48,
  },
  footerButton: {
    flex: 1,
  },
  
  // Approved Profile Styles
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  profileAvatar: {
    marginBottom: 12,
  },
  profileTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  companyName: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  approvedBadge: {
    marginTop: 2,
  },
  roleText: {
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  infoLabel: {
    fontWeight: '600',
    flex: 1,
  },
  descriptionText: {
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    marginVertical: 8,
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  coordinateItem: {
    flex: 1,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  editButton: {
    marginBottom: 12,
  },
  backButton: {
    marginTop: 4,
    color: "#fff"
  },
});
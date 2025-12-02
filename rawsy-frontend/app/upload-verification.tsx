import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Platform } from 'react-native';
import {
  Text,
  Button,
  Appbar,
  Surface,
  Chip,
  IconButton,
  ActivityIndicator,
  Card,
  Dialog,
  Portal,
  RadioButton,
  ProgressBar,
  Menu,
  Divider as PaperDivider,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../services/api';

export default function UploadVerificationScreen() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDocTypeDialog, setShowDocTypeDialog] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('business_license');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const documentTypes = [
    { value: 'business_license', label: 'Business License' },
    { value: 'tax_document', label: 'Tax Document' },
    { value: 'identification', label: 'Identification (ID/Passport)' },
    { value: 'company_registration', label: 'Company Registration' },
    { value: 'other', label: 'Other Document' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      const userData = response.data.profile;
      setDocuments(userData.verificationDocs || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      // DocumentPicker may return different shapes depending on environment:
      // - In Expo Go / newer versions: { canceled: false, assets: [{ uri, name, mimeType }] }
      // - In standalone or older versions: { type: 'success', uri, name, mimeType }
      let fileObj: any = null;
      if ((result as any).canceled === false && (result as any).assets && (result as any).assets[0]) {
        fileObj = (result as any).assets[0];
      } else if ((result as any).type === 'success' && (result as any).uri) {
        fileObj = {
          uri: (result as any).uri,
          name: (result as any).name || `doc_${Date.now()}`,
          mimeType: (result as any).mimeType || (result as any).type || undefined,
        };
      }

      if (fileObj) {
        setSelectedFile(fileObj);
        setShowDocTypeDialog(true);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to photos to upload verification documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
        setShowDocTypeDialog(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access to take photos of your documents.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
        setShowDocTypeDialog(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setShowDocTypeDialog(false);

      const formData = new FormData();

      let mimeType = selectedFile.mimeType || selectedFile.type || 'application/octet-stream';
      let fileName = selectedFile.name || selectedFile.fileName || `doc_${Date.now()}.jpg`;

      if (selectedFile.uri && !mimeType.includes('/')) {
        const extension = selectedFile.uri.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') {
          mimeType = 'application/pdf';
          if (!fileName.endsWith('.pdf')) {
            fileName = `doc_${Date.now()}.pdf`;
          }
        } else if (['jpg', 'jpeg'].includes(extension || '')) {
          mimeType = 'image/jpeg';
          if (!fileName.match(/\.(jpg|jpeg)$/i)) {
            fileName = `doc_${Date.now()}.jpg`;
          }
        } else if (extension === 'png') {
          mimeType = 'image/png';
          if (!fileName.endsWith('.png')) {
            fileName = `doc_${Date.now()}.png`;
          }
        }
      }

      let fileUri = selectedFile.uri;
      if (Platform.OS === 'ios' && fileUri.startsWith('file://')) {
        fileUri = fileUri;
      } else if (Platform.OS === 'android' && !fileUri.startsWith('file://')) {
        fileUri = 'file://' + fileUri;
      }

      const fileToUpload: any = {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      };

      formData.append('file', fileToUpload);
      formData.append('type', selectedDocType);

      console.log('Uploading file:', {
        uri: fileUri,
        type: mimeType,
        name: fileName,
        docType: selectedDocType,
      });

      await api.post('/auth/me/upload-doc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? (progressEvent.loaded / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      Alert.alert(
        'Success',
        'Document uploaded successfully. Admin will review it shortly.',
        [{ text: 'OK', onPress: () => setSelectedFile(null) }]
      );

      await fetchDocuments();
      await refreshUser();
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Upload error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || 'Failed to upload document. Please try again.';
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadMenuOpen = () => {
    setShowUploadMenu(true);
  };

  const handleUploadMenuClose = () => {
    setShowUploadMenu(false);
  };

  const handleCancelUpload = () => {
    setShowDocTypeDialog(false);
    setSelectedFile(null);
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType?.label || type.replace('_', ' ');
  };

  const deleteDocument = async (docIndex: number) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('Delete functionality to be implemented');
            Alert.alert('Info', 'Document deletion feature coming soon. Contact admin to remove documents.');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Under Review';
    }
  };

  if (user?.role !== 'supplier') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Verification Documents" />
        </Appbar.Header>
        <View style={styles.centeredContainer}>
          <Text variant="titleMedium">This feature is only available for suppliers</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Verification Documents" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Surface style={[styles.infoSection, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.infoTitle, { color: theme.colors.onPrimaryContainer }]}>
            Document Verification
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, lineHeight: 20 }}>
            Upload business license, tax documents, or identification to verify your supplier account.
            Admin will review and approve your documents.
          </Text>
        </Surface>

        <View style={styles.uploadSection}>
          <Surface style={[styles.uploadCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <MaterialIcons name="cloud-upload" size={48} color={theme.colors.primary} style={styles.uploadIcon} />
            <Text variant="titleMedium" style={styles.uploadTitle}>
              Upload Verification Documents
            </Text>
            <Text variant="bodySmall" style={[styles.uploadSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Accepted formats: JPG, PNG, PDF (Max 5MB)
            </Text>

            <View style={styles.uploadButtonsRow}>
              <Button
                mode="contained"
                icon="camera"
                onPress={takePhoto}
                disabled={uploading}
                style={styles.uploadActionButton}
              >
                Take Photo
              </Button>
              <Button
                mode="outlined"
                icon="image"
                onPress={pickImage}
                disabled={uploading}
                style={styles.uploadActionButton}
              >
                Gallery
              </Button>
            </View>
            <Button
              mode="outlined"
              icon="file-document"
              onPress={pickDocument}
              disabled={uploading}
              style={styles.uploadButton}
            >
              Choose Document
            </Button>
          </Surface>
        </View>

        {uploading && (
          <View style={styles.uploadingContainer}>
            <Surface style={[styles.uploadingCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <MaterialIcons name="upload-file" size={48} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.uploadingTitle}>
                Uploading Document...
              </Text>
              <ProgressBar
                progress={uploadProgress}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                {Math.round(uploadProgress * 100)}% complete
              </Text>
            </Surface>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No documents uploaded
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Upload your business documents to get verified
            </Text>
          </View>
        ) : (
          <View style={styles.documentsSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Uploaded Documents
            </Text>

            {documents.map((doc, index) => (
              <Card key={index} style={styles.documentCard}>
                <Card.Content>
                  <View style={styles.documentHeader}>
                    <View style={styles.documentInfo}>
                      <View style={styles.documentTitleRow}>
                        <MaterialIcons
                          name={doc.url?.includes('.pdf') ? 'picture-as-pdf' : 'image'}
                          size={24}
                          color={theme.colors.primary}
                        />
                        <Text variant="titleMedium" style={styles.documentTitle}>
                          {getDocumentTypeLabel(doc.type)}
                        </Text>
                      </View>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.documentActions}>
                      <Chip
                        style={{ backgroundColor: getStatusColor(doc.status), marginBottom: 8 }}
                        textStyle={{ color: '#fff', fontSize: 11 }}
                      >
                        {getStatusLabel(doc.status)}
                      </Chip>
                    </View>
                  </View>

                  {doc.url && doc.url.includes('image') && (
                    <Surface style={styles.imagePreviewContainer} elevation={0}>
                      <Image source={{ uri: doc.url }} style={styles.documentPreview} />
                    </Surface>
                  )}

                  {doc.url && doc.url.includes('.pdf') && (
                    <Surface style={[styles.pdfIndicator, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                      <MaterialIcons name="picture-as-pdf" size={32} color="#dc2626" />
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurface, marginTop: 4 }}>
                        PDF Document
                      </Text>
                    </Surface>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={showDocTypeDialog} onDismiss={handleCancelUpload}>
          <Dialog.Title>Select Document Type</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              What type of document are you uploading?
            </Text>
            <RadioButton.Group
              onValueChange={value => setSelectedDocType(value)}
              value={selectedDocType}
            >
              {documentTypes.map((docType) => (
                <View key={docType.value} style={styles.radioItem}>
                  <RadioButton.Android value={docType.value} />
                  <Text
                    variant="bodyMedium"
                    style={styles.radioLabel}
                    onPress={() => setSelectedDocType(docType.value)}
                  >
                    {docType.label}
                  </Text>
                </View>
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCancelUpload}>Cancel</Button>
            <Button
              mode="contained"
              onPress={uploadDocument}
              disabled={!selectedDocType}
            >
              Upload
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  uploadSection: {
    padding: 16,
  },
  uploadCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadIcon: {
    marginBottom: 16,
  },
  uploadTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    width: '100%',
  },
  uploadActionButton: {
    flex: 1,
    paddingVertical: 4,
  },
  uploadButton: {
    paddingVertical: 4,
    width: '100%',
  },
  uploadingContainer: {
    padding: 16,
  },
  uploadingCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadingTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  documentsSection: {
    padding: 16,
    marginBottom: 32
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  documentCard: {
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
    marginRight: 12,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentTitle: {
    fontWeight: '600',
    flex: 1,
  },
  documentActions: {
    alignItems: 'flex-end',
  },
  imagePreviewContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  documentPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  pdfIndicator: {
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
  },
});

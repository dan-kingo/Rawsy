import { useState } from 'react';
import { View, StyleSheet, Image, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Dialog, Portal, Text, Button, IconButton } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

interface PaymentProofViewerProps {
  imageUrl: string;
  compact?: boolean;
}

export default function PaymentProofViewer({ imageUrl, compact = false }: PaymentProofViewerProps) {
  const { theme } = useTheme();
  const [showFullScreen, setShowFullScreen] = useState(false);

  if (!imageUrl) {
    return null;
  }

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={[styles.compactContainer, { borderColor: theme.colors.primary }]}
          onPress={() => setShowFullScreen(true)}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.compactImage}
            resizeMode="cover"
          />
          <View style={[styles.compactOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <MaterialIcons name="zoom-in" size={24} color="#fff" />
            <Text variant="bodySmall" style={styles.compactText}>
              View Payment Proof
            </Text>
          </View>
        </TouchableOpacity>

        <Modal
          visible={showFullScreen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFullScreen(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackground}
              activeOpacity={1}
              onPress={() => setShowFullScreen(false)}
            >
              <View style={styles.modalContent}>
                <IconButton
                  icon="close"
                  iconColor="#fff"
                  size={28}
                  onPress={() => setShowFullScreen(false)}
                  style={styles.closeButton}
                />
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowFullScreen(true)}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.previewImage}
          resizeMode="cover"
        />
        <View style={styles.overlay}>
          <MaterialIcons name="zoom-in" size={32} color="#fff" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullScreen(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setShowFullScreen(false)}
          >
            <View style={styles.modalContent}>
              <IconButton
                icon="close"
                iconColor="#fff"
                size={28}
                onPress={() => setShowFullScreen(false)}
                style={styles.closeButton}
              />
              <Image
                source={{ uri: imageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  compactContainer: {
    position: 'relative',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    marginTop: 8,
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    color: '#fff',
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
});

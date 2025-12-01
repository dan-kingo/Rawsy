import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Appbar, Surface, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';

const AboutScreen: React.FC = () => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('about') ?? 'About'} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Card Wrapper */}
        <Surface style={[styles.card, { backgroundColor: paperTheme.colors.surface }]} elevation={1}>
          {/* Logo */}
          <Image
            source={require('../assets/images/rawsy.png')}
            style={styles.logo}
          />

          <Text variant="headlineSmall" style={[styles.title, { color: paperTheme.colors.onSurface }]}>
            { 'About Rawsy'}
          </Text>

          {/* Description */}
          <Text variant="bodyMedium" style={[styles.description, { color: paperTheme.colors.onSurfaceVariant }]}>
            Rawsy is a comprehensive B2B marketplace connecting manufacturers with verified
            raw material suppliers across Ethiopia. Our platform streamlines procurement,
            ensures supplier authenticity, and facilitates seamless transactions with
            built-in quality assurance and transparent pricing.
          </Text>
        </Surface>

        {/* Features Section */}
        <Surface style={[styles.card, { backgroundColor: paperTheme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            {t('keyFeatures') ?? 'Key Features'}
          </Text>

          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• Verified Supplier Network - Access to pre-screened and authenticated raw material suppliers</Text>
          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• Quote Management System - Request, negotiate, and manage custom quotes seamlessly</Text>
          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• Order Tracking - Real-time visibility into your order status from placement to delivery</Text>
          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• Secure Payment Processing - Cash on delivery with transaction security</Text>
          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• Product Catalog - Comprehensive listings of raw materials with detailed specifications</Text>
          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• Multi-Language Support - Available in English, Amharic, and Afaan Oromo for local accessibility</Text>
        </Surface>

        {/* Technology Stack Section */}
        <Surface style={[styles.card, { backgroundColor: paperTheme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            Technology Stack
          </Text>

          <Text style={[styles.description, { color: paperTheme.colors.onSurfaceVariant }]}>
            Built with enterprise-grade technologies for reliability and scalability:
          </Text>

          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• React Native & Expo - Cross-platform mobile development framework</Text>
          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• Node.js & Express - High-performance backend infrastructure</Text>
          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• MongoDB - Scalable NoSQL database for efficient data management</Text>
          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• Cloudinary - Cloud-based media storage and optimization</Text>
          <Text style={[styles.listItem, { color: paperTheme.colors.onSurfaceVariant }]}>• Firebase - Real-time notifications and authentication services</Text>
        </Surface>

        {/* Contact & Support Section */}
        <Surface style={[styles.card, { backgroundColor: paperTheme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
            Contact & Support
          </Text>

          <Text style={[styles.description, { color: paperTheme.colors.onSurfaceVariant }]}>
            For inquiries, support, or partnership opportunities, please reach out through our Help & Support center or contact our team directly.
          </Text>
        </Surface>

        {/* Version */}
        <Text style={[styles.version, { color: paperTheme.colors.outline }]}>
          App Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    marginBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 16,
    resizeMode: 'contain',
    borderRadius: 60,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    marginBottom: 6,
  },
  version: {
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
});

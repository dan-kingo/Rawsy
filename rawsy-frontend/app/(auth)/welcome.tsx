import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const features = [
    {
      icon: 'inventory',
      title: 'Browse Products',
      description: 'Discover a wide range of raw materials from trusted suppliers',
    },
    {
      icon: 'request-quote',
      title: 'Request Quotes',
      description: 'Get competitive quotes and negotiate prices directly',
    },
    {
      icon: 'shopping-cart',
      title: 'Easy Ordering',
      description: 'Seamless ordering process with secure payment options',
    },
    {
      icon: 'verified-user',
      title: 'Verified Suppliers',
      description: 'Connect with verified and reliable suppliers',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/rawsy.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text variant="displayMedium" style={styles.title}>
              Welcome to Rawsy
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Your marketplace for raw materials
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={[styles.featureCard, {backgroundColor: theme.colors.surface}]}>
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name={feature.icon as any}
                    size={32}
                    color="#0ea5e9"
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text variant="titleMedium" style={styles.featureTitle}>
                    {feature.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.actionContainer}>
            <Button
              mode="contained"
              onPress={() => router.replace('/login')}
              style={[styles.primaryButton, {backgroundColor: theme.colors.primary}]}
              labelStyle={styles.primaryButtonLabel}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.replace('/register')}
              style={styles.secondaryButton}
              labelStyle={styles.secondaryButtonLabel}
              contentStyle={styles.buttonContent}
            >
              Create Account
            </Button>
          </View>

          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  featureDescription: {
    color: '#fff',
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  primaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderRadius: 12,
    borderColor: '#fff',
    borderWidth: 2,
  },
  secondaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  footer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
});

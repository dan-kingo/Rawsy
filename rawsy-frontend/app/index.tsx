import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { View, ActivityIndicator, Alert } from "react-native";
import { Text } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";

export default function Index() {
  const { isAuthenticated, loading, user } = useAuth();
  const { theme } = useTheme();
  const [shouldCompleteProfile, setShouldCompleteProfile] = useState(false);

  useEffect(() => {
    if (user && isAuthenticated) {
      checkProfileCompletion();
    }
  }, [user, isAuthenticated]);

  const checkProfileCompletion = () => {
    if (!user) return;

    if (user.role === 'admin') {
      return;
    }

    const isSupplier = user.role === 'supplier';

    const hasBasicInfo = user.companyName;
    const hasLocation = isSupplier ? user.businessLocation?.address : true;

    if (isSupplier && (!hasBasicInfo || !hasLocation)) {
      setShouldCompleteProfile(true);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (user?.role === 'admin') {
    Alert.alert(
      'Admin Access',
      'Admin users must use the web portal to access the system.',
      [{ text: 'OK' }]
    );
    return <Redirect href="/(auth)/login" />;
  }

  if (shouldCompleteProfile) {
    return <Redirect href="/complete-profile" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

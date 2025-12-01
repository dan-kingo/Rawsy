import { Stack } from "expo-router";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { LanguageProvider } from "../context/LanguageContext";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";

function RootLayoutInner() {
  const { theme, isDarkMode } = useTheme();
 useEffect(() => {
    // ensure system bars match app surface color
    SystemUI.setBackgroundColorAsync(theme.colors.surface);
  }, []);
  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <AuthProvider>
        <LanguageProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </LanguageProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}

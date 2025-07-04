// app/_layout.tsx
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { StatusBar } from 'expo-status-bar';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { theme, isDarkMode } = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': 'https://rsms.me/inter/font-files/Inter-Regular.woff2?v=3.19',
    'Inter-Medium': 'https://rsms.me/inter/font-files/Inter-Medium.woff2?v=3.19',
    'Inter-SemiBold': 'https://rsms.me/inter/font-files/Inter-SemiBold.woff2?v=3.19',
    'Inter-Bold': 'https://rsms.me/inter/font-files/Inter-Bold.woff2?v=3.19',
  });

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isAuthLoading]);

  if (!fontsLoaded && !fontError) {
    return null;
  }
  
  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(salesman)" options={{ headerShown: false }} />
        <Stack.Screen name="(call_operator)" options={{ headerShown: false }} />
        <Stack.Screen name="(technician)" options={{ headerShown: false }} />
        <Stack.Screen name="(super_admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(team_lead)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <DataProvider>
        <ThemeProvider>
          <NotificationProvider>
            <RootLayout />
          </NotificationProvider>
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  );
}
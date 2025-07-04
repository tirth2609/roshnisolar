import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';

export default function AdminLayout() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace('/login');
        return;
      }

      // Check if user has admin role (team_lead or super_admin)
      if (user.role !== 'team_lead' && user.role !== 'super_admin') {
        // Redirect to appropriate role-based screen
        switch (user.role) {
          case 'salesman':
            router.replace('/(salesman)');
            break;
          case 'call_operator':
            router.replace('/(call_operator)');
            break;
          case 'technician':
            router.replace('/(technician)');
            break;
          default:
            router.replace('/login');
        }
      }
    }
  }, [isAuthenticated, user, isLoading]);

  useEffect(() => {
    // Set loading to false after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
      }}
    >
      <Stack.Screen name="work-tracking" />
      <Stack.Screen name="lead-reassignment" />
    </Stack>
  );
} 
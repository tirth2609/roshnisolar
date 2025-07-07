import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Wrench, 
  BarChart3,
  User,
  GitMerge,
  FileCheck,
  MessageSquare,
  Phone
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function TeamLeadLayout() {
  const { theme } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  useEffect(() => {
    if (!isLoading && user != null) {
      if (isAuthenticated && user) {
        if (user.role !== 'team_lead') {
          setRedirectPath('/login');
          setShouldRedirect(true);
        }
      } else if (!isAuthenticated) {
        setRedirectPath('/login');
        setShouldRedirect(true);
      }
    }
  }, [isAuthenticated, user, isLoading]);

  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      const timer = setTimeout(() => {
        router.replace(redirectPath as any);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, redirectPath, router]);

  if (isLoading || user == null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme?.surface || '#F8FAFC' }}>
        <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: theme?.textSecondary || '#64748B' }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (shouldRedirect) {
    return null;
  }

  if (!isAuthenticated || !user || user.role !== 'team_lead') {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="lead-assign"
        options={{
          title: 'Assign Leads',
          tabBarIcon: ({ color, size }) => <UserPlus color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transit-leads"
        options={{
          title: 'In Transit',
          tabBarIcon: ({ color, size }) => <GitMerge color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="customer-conversion"
        options={{
          title: 'Conversion',
          tabBarIcon: ({ color, size }) => <FileCheck color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="operator-overview"
        options={{
          title: 'Operator Overview',
          href: null,
        }}
      />
      <Tabs.Screen
        name="work-tracking"
        options={{
          title: 'Work Tracking',
          tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} />,
        }}
      />

      <Tabs.Screen
              name="my-leads"
              options={{
                title: 'My Leads',
                tabBarIcon: ({ color, size }) => <Phone color={color} size={size} />,
              }}
      />

      <Tabs.Screen
              name="predefined-messages"
              options={{
                title: 'Messages',
                tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
              }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      
      <Tabs.Screen
        name="lead-info"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
} 
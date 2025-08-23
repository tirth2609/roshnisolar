import { Tabs } from 'expo-router';
import { BarChart3, Users, User, UserPlus, Activity, RefreshCw, MessageSquare, Phone, User2 } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';

export default function SuperAdminLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  // Add logging for debugging
  useEffect(() => {
    console.log('SuperAdminLayout: isLoading', isLoading, 'isAuthenticated', isAuthenticated, 'user', user);
  }, [isLoading, isAuthenticated, user]);

  useEffect(() => {
    // Only check after authentication is loaded and user is not null/undefined
    if (!isLoading && user != null) {
      if (isAuthenticated && user) {
        if (user.role !== 'super_admin' && user.role !== 'team_lead') {
          // Set redirect path instead of immediately navigating
          console.log('SuperAdminLayout: redirecting, user.role =', user.role);
          switch (user.role) {
            case 'salesman':
              setRedirectPath('/(salesman)');
              break;
            case 'call_operator':
              setRedirectPath('/(call_operator)');
              break;
            case 'technician':
              setRedirectPath('/(technician)');
              break;
            default:
              setRedirectPath('/login');
          }
          setShouldRedirect(true);
        }
      } else if (!isAuthenticated) {
        setRedirectPath('/login');
        setShouldRedirect(true);
      }
    }
  }, [isAuthenticated, user, isLoading]);

  useEffect(() => {
    // Navigate only after the component is mounted and we have a redirect path
    if (shouldRedirect && redirectPath) {
      const timer = setTimeout(() => {
        router.replace(redirectPath as any);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, redirectPath, router]);

  // Show loading while checking authentication or user is not yet loaded
  if (isLoading || user == null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <Text style={{ fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#64748B' }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Don't render anything if user should be redirected
  if (shouldRedirect) {
    return null;
  }

  // Don't render if user is not authenticated or doesn't have proper role
  if (!isAuthenticated || !user || (user.role !== 'super_admin' && user.role !== 'team_lead')) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lead-assignment"
        options={{
          title: 'Leads',
          tabBarIcon: ({ size, color }) => (
            <UserPlus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="work-tracking"
        options={{
          title: 'Work Tracking',
          tabBarIcon: ({ size, color }) => (
            <Activity size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lead-reassignment"
        options={{
          title: 'Reassignment',
          tabBarIcon: ({ size, color }) => (
            <RefreshCw size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="duplicate-leads"
        options={{
          title: 'Duplicate Leads',
          tabBarIcon: ({ size, color }) => (
            <User2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
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
              name="customers"
              options={{
                title: 'Customers',
                tabBarIcon: ({ size, color }) => (
                  <Users size={size} color={color} />
                ),
              }}
            />

      <Tabs.Screen
              name="my-leads"
              options={{
                title: 'My Leads',
                tabBarIcon: ({ size, color }) => (
                  <Phone size={size} color={color} />
                ),
              }}
            />


      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lead-info"
        options={{
          href: null,
        }}
      />
       <Tabs.Screen
        name="user/[id]"
        options={{
          href: null,
        }}
      />
    
    </Tabs>
  );
}
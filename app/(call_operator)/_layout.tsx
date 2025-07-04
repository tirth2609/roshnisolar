import { Tabs } from 'expo-router';
import { Phone, List, Headphones, User } from 'lucide-react-native';

export default function CallOperatorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E40AF',
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
          title: 'Leads',
          tabBarIcon: ({ size, color }) => (
            <Phone size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ size, color }) => (
            <Headphones size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-work"
        options={{
          title: 'My Work',
          tabBarIcon: ({ size, color }) => (
            <List size={size} color={color} />
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
    </Tabs>
  );
}
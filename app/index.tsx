import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
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
          case 'team_lead':
            setRedirectPath('/(team_lead)');
            break;
          case 'super_admin':
            setRedirectPath('/(super_admin)');
            break;
          default:
            setRedirectPath('/login');
        }
        setShouldRedirect(true);
      } else {
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
  }, [shouldRedirect, redirectPath]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Image 
              source={require('../assets/images/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text style={styles.loadingText}>Roshni Solar</Text>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    );
  }

  if (shouldRedirect) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBackground}>
            <Image 
              source={require('../assets/images/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text style={styles.loadingText}>Roshni Solar</Text>
        <Text style={styles.subtitle}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBackground}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>
      <Text style={styles.loadingText}>Roshni Solar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 16, // Square with rounded corners
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  loadingText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
});
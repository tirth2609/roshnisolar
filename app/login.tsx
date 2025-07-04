// app/login.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, LogIn, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FadeInView, SlideInView, ScaleInView, PulseView } from '@/components/AnimatedComponents';
import { Easing } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
  const { signIn, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation refs
  const logoScale = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(60)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;

  // Handle successful login redirection
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      // Redirect based on user role
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
        case 'team_lead':
          router.replace('/(team_lead)');
          break;
        case 'super_admin':
          router.replace('/(super_admin)');
          break;
        default:
      }
    }
  }, [isAuthenticated, user, authLoading]);

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      // Don't redirect here - let the useEffect handle it
    } catch (error: any) {
      setError(error.message || 'Please check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const getGradientColors = () => {
    return isDarkMode
      ? ['#18181b', '#27272a', '#334155'] as const
      : ['#e0e7ff', '#c7d2fe', '#6366f1'] as const;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.centeredContainer}>
          {/* Logo and App Name */}
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>  
            <PulseView>
              <View style={[styles.logo, { backgroundColor: isDarkMode ? '#22223b' : '#fff' }]}>  
                <Sparkles size={36} color={theme.primary} />
              </View>
            </PulseView>
            <Text style={[styles.appName, { color: theme.primary }]}>Roshni Solar</Text>
          </Animated.View>

          {/* Card Form */}
          <Animated.View style={[styles.formCard, { transform: [{ translateY: formSlide }] }]}>  
            <Text style={[styles.formTitle, { color: theme.text }]}>Sign in to your account</Text>
            <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>Welcome back! Please enter your details.</Text>

            {/* Error Message */}
            {error ? (
              <FadeInView duration={300}>
                <Text style={styles.errorText}>{error}</Text>
              </FadeInView>
            ) : null}

            {/* Email Input */}
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>  
              <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>  
              <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                {showPassword ? (
                  <EyeOff size={20} color={theme.textSecondary} />
                ) : (
                  <Eye size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 }]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LogIn size={20} color={theme.textInverse} />
                <Text style={[styles.loginButtonText, { color: theme.textInverse }]}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    } : {
      shadowColor: 'rgba(0,0,0,0.08)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    }),
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
    } : {
      shadowColor: 'rgba(0,0,0,0.10)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    }),
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(245,245,245,0.95)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    } : {
      shadowColor: 'rgba(0,0,0,0.10)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    }),
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
});
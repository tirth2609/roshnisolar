import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Fade In Animation
export const FadeInView: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: any;
}> = ({ children, delay = 0, duration = 500, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
};

// Slide In Animation
export const SlideInView: React.FC<{
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  style?: any;
}> = ({ children, direction = 'up', delay = 0, duration = 500, style }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  const getTransform = () => {
    const distance = 50;
    switch (direction) {
      case 'left':
        return { translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }) };
      case 'right':
        return { translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) };
      case 'up':
        return { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) };
      case 'down':
        return { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }) };
      default:
        return { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) };
    }
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [getTransform()],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Scale In Animation
export const ScaleInView: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: any;
}> = ({ children, delay = 0, duration = 500, style }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: duration * 0.6,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Pulse Animation
export const PulseView: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  return (
    <Animated.View style={[{ transform: [{ scale: pulseAnim }] }, style]}>
      {children}
    </Animated.View>
  );
};

// Shake Animation
export const ShakeView: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX: shakeAnim }],
        },
        style,
      ]}
    >
      <TouchableOpacity onPress={shake} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Floating Action Button
export const FloatingActionButton: React.FC<{
  onPress: () => void;
  icon: React.ReactNode;
  style?: any;
}> = ({ onPress, icon, style }) => {
  const { theme } = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = () => {
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start(() => float());
    };
    float();
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.primary,
          justifyContent: 'center',
          alignItems: 'center',
          transform: [
            {
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10],
              }),
            },
          ],
          ...(Platform.OS === 'web' ? {
            boxShadow: `0 4px 12px ${theme.shadow}`,
          } : {
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }),
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={{
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={0.8}
      >
        {icon}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Card
export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  index?: number;
}> = ({ children, onPress, style, index = 0 }) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          transform: [{ scale: scaleAnim }],
          ...(Platform.OS === 'web' ? {
            boxShadow: shadowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0 2px 8px rgba(0,0,0,0.1)', '0 8px 24px rgba(0,0,0,0.2)'],
            }) as any,
          } : {
            shadowColor: theme.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: shadowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.3],
            }),
            shadowRadius: shadowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [4, 12],
            }),
            elevation: shadowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [2, 8],
            }),
          }),
          borderWidth: 1,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <CardComponent
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={{ flex: 1 }}
      >
        {children}
      </CardComponent>
    </Animated.View>
  );
};

// Animated Progress Bar
export const AnimatedProgressBar: React.FC<{
  progress: number; // 0 to 1
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: any;
}> = ({ progress, height = 8, color, backgroundColor, style }) => {
  const { theme } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [progress]);

  return (
    <View
      style={[
        styles.progressContainer,
        {
          height,
          backgroundColor: backgroundColor || theme.borderSecondary,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: color || theme.primary,
          },
        ]}
      />
    </View>
  );
};

// Animated Loading Spinner
export const AnimatedSpinner: React.FC<{
  size?: number;
  color?: string;
  style?: any;
}> = ({ size = 24, color, style }) => {
  const { theme } = useTheme();
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color || theme.primary,
          borderTopColor: 'transparent',
          transform: [
            {
              rotate: spinAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  progressContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
}); 
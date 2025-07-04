import React from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function SkeletonLeadList({ count = 5 }) {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={{ padding: 20 }}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.avatar} />
            <View style={styles.title} />
          </View>
          <View style={styles.row} />
          <View style={styles.row} />
          <View style={styles.row} />
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  title: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  row: {
    width: '100%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    opacity: 0.7,
  },
}); 
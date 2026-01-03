import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

interface LoadingViewProps {
  message?: string;
  showNumbers?: boolean;
}

export default function LoadingView({
  message = 'Loading...',
  showNumbers = true
}: LoadingViewProps) {
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Pulsing animation for the dots
    opacity1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      false
    );
    opacity2.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );
    opacity3.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );

    // Subtle breathing animation for the container
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({ opacity: opacity1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: opacity2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: opacity3.value }));
  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, containerStyle]}>
        {showNumbers && (
          <View style={styles.numbersRow}>
            <Animated.View style={[styles.numberCircle, dot1Style]}>
              <Text style={styles.numberText}>1</Text>
            </Animated.View>
            <Animated.View style={[styles.numberCircle, dot2Style]}>
              <Text style={styles.numberText}>2</Text>
            </Animated.View>
            <Animated.View style={[styles.numberCircle, dot3Style]}>
              <Text style={styles.numberText}>3</Text>
            </Animated.View>
          </View>
        )}
        <Text style={styles.message}>{message}</Text>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>
      </Animated.View>
    </View>
  );
}

// Skeleton loader for list items
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.backgroundSecondary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Skeleton for player list items
export function PlayerListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.skeletonText}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: 'center',
  },
  numbersRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  numberCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  numberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  message: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  skeletonList: {
    width: '100%',
    gap: Spacing.md,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    gap: Spacing.md,
  },
  skeletonText: {
    flex: 1,
  },
});

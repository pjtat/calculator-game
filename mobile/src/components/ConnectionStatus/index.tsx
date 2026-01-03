import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useConnection } from '../../context/ConnectionContext';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

interface ConnectionStatusProps {
  showWhenConnected?: boolean;
}

export default function ConnectionStatus({ showWhenConnected = false }: ConnectionStatusProps) {
  const { canPerformActions, isReconnecting, connectionQuality } = useConnection();
  const opacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (!canPerformActions || showWhenConnected) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }

    // Pulse animation when reconnecting
    if (isReconnecting) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [canPerformActions, isReconnecting, showWhenConnected]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Don't render when connected and showWhenConnected is false
  if (canPerformActions && !showWhenConnected) {
    return null;
  }

  const getStatusColor = () => {
    switch (connectionQuality) {
      case 'good':
        return '#4CAF50';
      case 'poor':
        return '#FFA500';
      case 'offline':
        return '#FF4444';
    }
  };

  const getStatusText = () => {
    switch (connectionQuality) {
      case 'good':
        return 'Connected';
      case 'poor':
        return 'Reconnecting...';
      case 'offline':
        return 'Offline';
    }
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: getStatusColor() },
          indicatorStyle,
        ]}
      />
      <Text style={styles.text}>{getStatusText()}</Text>
    </Animated.View>
  );
}

// Compact version for embedding in headers
export function ConnectionStatusCompact() {
  const { canPerformActions, isReconnecting } = useConnection();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isReconnecting) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isReconnecting]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const color = canPerformActions ? '#4CAF50' : isReconnecting ? '#FFA500' : '#FF4444';

  return (
    <Animated.View
      style={[
        styles.compactIndicator,
        { backgroundColor: color },
        indicatorStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  compactIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

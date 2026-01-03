import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useConnection } from '../../context/ConnectionContext';

interface OfflineBannerProps {
  /** Whether to show a retry button */
  showRetry?: boolean;
}

export function OfflineBanner({ showRetry = true }: OfflineBannerProps) {
  const { connectionQuality, isOnline, isFirebaseConnected, retryConnection } = useConnection();

  // Only show when offline or poor connection
  if (connectionQuality === 'good') {
    return null;
  }

  const getMessage = () => {
    if (!isOnline) {
      return 'No internet connection';
    }
    if (!isFirebaseConnected) {
      return 'Connecting to server...';
    }
    return 'Connection unstable';
  };

  const getBackgroundColor = () => {
    if (!isOnline) {
      return '#dc3545'; // Red for no internet
    }
    return '#ffc107'; // Yellow for reconnecting
  };

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={SlideOutUp.duration(300)}
      style={[styles.container, { backgroundColor: getBackgroundColor() }]}
    >
      <Text style={styles.message}>{getMessage()}</Text>
      {showRetry && !isOnline && (
        <TouchableOpacity onPress={retryConnection} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  message: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  retryButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});

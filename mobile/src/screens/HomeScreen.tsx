import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import NumericRain from '../components/NumericRain';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVersionTap = () => {
    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (newCount === 3) {
      // Activate demo mode
      setTapCount(0);
      Alert.alert(
        'Demo Mode',
        'Start a demo with mock players?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Demo',
            onPress: () => {
              // Navigate to lobby with demo game
              navigation.navigate('Lobby', {
                gameCode: 'DEMO01',
                playerId: 'demo-player-1',
              });
            },
          },
        ]
      );
    } else {
      // Reset count after 1 second if not reached 3
      tapTimeoutRef.current = setTimeout(() => {
        setTapCount(0);
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Numeric Rain Background */}
      <NumericRain />

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Calculator Game</Text>
          <Text style={styles.subtitle}>Don't be furthest away</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('CreateGame')}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Create Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('JoinGame')}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Join Game</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Version - tap 3x for demo mode */}
      <TouchableOpacity
        onPress={handleVersionTap}
        activeOpacity={0.7}
        style={styles.versionContainer}
      >
        <Text style={styles.version}>v1.0.1</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    position: 'relative',
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.2)',
  },
  title: {
    fontSize: 48,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
    }),
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
  versionContainer: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignSelf: 'center',
  },
  version: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});

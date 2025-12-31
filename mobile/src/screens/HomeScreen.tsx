import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import NumericRain from '../components/NumericRain';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      {/* Numeric Rain Background */}
      <NumericRain />

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Calculator Game 🧮</Text>
          <Text style={styles.subtitle}>Multiplayer estimation trivia</Text>
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

        {/* Version */}
        <Text style={styles.version}>v1.0.0</Text>
      </View>
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
  },
  title: {
    fontSize: 48,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  version: {
    position: 'absolute',
    bottom: Spacing.xxl,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});

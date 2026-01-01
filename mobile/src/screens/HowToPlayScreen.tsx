import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';

type HowToPlayScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'HowToPlay'>;
};

export default function HowToPlayScreen({ navigation }: HowToPlayScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>How to Play</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.text}>
            Calculator Game is a multiplayer estimation game where players compete to guess closest to the correct answer.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Flow</Text>
          <Text style={styles.text}>
            1. One player creates a game and shares the code{'\n'}
            2. Other players join using the game code{'\n'}
            3. Each round, one player asks a numeric question{'\n'}
            4. Everyone else guesses the answer{'\n'}
            5. Closest guess wins the round!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scoring</Text>
          <Text style={styles.text}>
            • Closest guess: +1 point{'\n'}
            • Furthest guess: -1 point{'\n'}
            • Don't be last!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontFamily: 'Orbitron_700Bold',
  },
  section: {
    marginBottom: Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  text: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  backButton: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  backButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
});

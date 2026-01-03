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
          <Text style={[styles.text, styles.paragraph]}>
            The game is simple: one person asks a question, everyone else submits their best guess, and the closest wins!
          </Text>
          <Text style={[styles.text, styles.paragraph]}>
            You may not remember the right answers, but you will always remember the time your one friend thought the moon was 300 miles from Earth or that a Ford F-150 weighs 800 pounds.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Flow</Text>

          <Text style={styles.stepTitle}>1. Setup</Text>
          <Text style={styles.text}>
            One player creates a game and shares the code. Other players join using the game code.
          </Text>

          <Text style={styles.stepTitle}>2. Ask a Question</Text>
          <Text style={styles.text}>
            Each round, one player asks a question with a numeric answer. It can be approximate, but it must be possible to confirm the answer.
          </Text>

          <Text style={styles.exampleLabel}>Good questions: ✅</Text>
          <Text style={styles.exampleText}>
            • What year was Abraham Lincoln born?{'\n'}
            • How many Starbucks are there in New York City?{'\n'}
            • On average, how much does a hippo weigh?
          </Text>

          <Text style={styles.exampleLabel}>Bad questions: ❌</Text>
          <Text style={styles.exampleText}>
            • What's the ideal number of pepperonis on a pizza? (subjective, no correct answer){'\n'}
            • How many people are on airline flights right now? (too complex){'\n'}
            • How many Taco Bells have I been to? (impossible to verify)
          </Text>

          <Text style={styles.stepTitle}>3. Calculate Your Guess</Text>
          <Text style={styles.text}>
            Everyone (except the person asking) submits a guess using their calculator. Use the calculator to estimate your answer through logical reasoning:
          </Text>
          <Text style={styles.exampleText}>
            Example: A hippo probably weighs eight times the average person. The average person is probably 160 lbs, so: 8 × 160 = 1,280 lbs
          </Text>

          <Text style={styles.stepTitle}>4. Scoring</Text>
          <Text style={styles.text}>
            The person with the closest guess wins the round, receives points, and asks the next question.
          </Text>

          <Text style={styles.stepTitle}>5. Shame the Loser</Text>
          <Text style={styles.text}>
            Most, most importantly of all—the person with the furthest guess is shamed, relentlessly.
          </Text>
        </View>

        <View style={styles.warningSection}>
          <Text style={styles.warningText}>Don't be furthest away! 💩</Text>
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
  paragraph: {
    marginTop: Spacing.md,
  },
  stepTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  exampleLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  exampleText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
    marginLeft: Spacing.sm,
  },
  warningSection: {
    backgroundColor: 'rgba(255, 200, 100, 0.15)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  warningText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
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

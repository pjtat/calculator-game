import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/theme';
import { RoundResult, Player } from '../../types/game';
import { formatDisplayNumber } from '../../utils/formatting';

interface ShameEntry {
  roundNumber: number;
  playerName: string;
  guess: number;
  correctAnswer: number;
  percentageError: number;
  questionText?: string;
  questionUnits?: string;
  snarkyRemark?: string | null;
}

interface HallOfShameProps {
  roundResults: { [roundId: string]: RoundResult };
  players: { [playerId: string]: Player };
}

const CYCLE_DURATION = 5000; // 5 seconds per entry

export default function HallOfShame({ roundResults, players }: HallOfShameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Collect all shame entries and sort by worst (highest percentage error)
  const shameEntries: ShameEntry[] = Object.entries(roundResults)
    .reduce<ShameEntry[]>((entries, [roundId, result]) => {
      const roundNumber = parseInt(roundId.replace('round_', ''), 10);
      const loserRanking = result.rankings[result.rankings.length - 1];

      if (!loserRanking || loserRanking.guess === null || loserRanking.percentageError === null) {
        return entries;
      }

      entries.push({
        roundNumber,
        playerName: players[loserRanking.playerId]?.nickname || 'Unknown',
        guess: loserRanking.guess,
        correctAnswer: result.correctAnswer,
        percentageError: loserRanking.percentageError,
        questionText: result.questionText,
        questionUnits: result.questionUnits,
        snarkyRemark: result.snarkyRemark,
      });
      return entries;
    }, [])
    .sort((a, b) => b.percentageError - a.percentageError)
    .slice(0, 5); // Top 5 worst

  // Auto-cycle through entries
  useEffect(() => {
    if (shameEntries.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change index
        setCurrentIndex((prev) => (prev + 1) % shameEntries.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, CYCLE_DURATION);

    return () => clearInterval(interval);
  }, [shameEntries.length]);

  if (shameEntries.length === 0) {
    return null;
  }

  const currentEntry = shameEntries[currentIndex];

  const formatPercentOff = (percentError: number): string => {
    if (percentError >= 1000) {
      return `${(percentError / 100).toFixed(0)}x off`;
    }
    return `${percentError.toFixed(1)}% off`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HALL OF SHAME</Text>

      <Animated.View style={[styles.entryCard, { opacity: fadeAnim }]}>
        <Text style={styles.roundLabel}>Round {currentEntry.roundNumber}</Text>

        {currentEntry.questionText && (
          <Text style={styles.questionText} numberOfLines={2}>
            "{currentEntry.questionText}"
          </Text>
        )}

        <View style={styles.guessSection}>
          <Text style={styles.playerName}>{currentEntry.playerName}</Text>
          <Text style={styles.guessedText}>guessed</Text>
          <Text style={styles.guessValue}>
            {formatDisplayNumber(currentEntry.guess, currentEntry.questionText)}
            {currentEntry.questionUnits ? ` ${currentEntry.questionUnits}` : ''}
          </Text>
        </View>

        <View style={styles.answerSection}>
          <Text style={styles.answerLabel}>Answer was</Text>
          <Text style={styles.answerValue}>
            {formatDisplayNumber(currentEntry.correctAnswer, currentEntry.questionText)}
            {currentEntry.questionUnits ? ` ${currentEntry.questionUnits}` : ''}
          </Text>
          <Text style={styles.percentOff}>{formatPercentOff(currentEntry.percentageError)}</Text>
        </View>

        {currentEntry.snarkyRemark && (
          <Text style={styles.snarkyRemark}>"{currentEntry.snarkyRemark}"</Text>
        )}
      </Animated.View>

      {/* Pagination dots */}
      {shameEntries.length > 1 && (
        <View style={styles.pagination}>
          {shameEntries.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#8B451320',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: '#8B4513',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  entryCard: {
    alignItems: 'center',
  },
  roundLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  questionText: {
    fontSize: FontSizes.md,
    fontStyle: 'italic',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  guessSection: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  playerName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: '#FF4444',
  },
  guessedText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  guessValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  answerSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  answerLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  answerValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: '#22C55E',
  },
  percentOff: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: '#FF4444',
    marginTop: Spacing.xs,
  },
  snarkyRemark: {
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 69, 19, 0.3)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
  },
  dotActive: {
    backgroundColor: '#8B4513',
  },
});

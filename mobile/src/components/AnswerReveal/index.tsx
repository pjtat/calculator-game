import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Text, Animated, Dimensions } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/theme';
import type { RoundRanking, Player } from '../../types/game';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCALE_HEIGHT = SCREEN_HEIGHT * 0.68; // Use 68% of screen for scale (leaves room for button)

type RevealPhase = 'drumroll' | 'answer' | 'guesses' | 'identities' | 'complete';

export interface AnswerRevealProps {
  correctAnswer: number;
  questionText: string;
  rankings: RoundRanking[];
  players: { [playerId: string]: Player };
  currentPlayerId: string;
  units?: string;
  onComplete: () => void;
  canContinue: boolean;
  nextAskerName?: string;
}

// Format large numbers compactly
function formatCompact(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return sign + (absValue / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (absValue >= 1_000_000) {
    return sign + (absValue / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (absValue >= 1_000) {
    return sign + (absValue / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return sign + Math.round(absValue).toString();
}

// Get color based on how far off the guess is
function getDistanceColor(guess: number | null, correctAnswer: number): string {
  if (guess === null) return '#666666'; // Gray for no guess

  const percentError = Math.abs((guess - correctAnswer) / correctAnswer) * 100;

  if (percentError <= 10) return '#4CAF50'; // Green - close
  if (percentError <= 50) return '#FF9800'; // Orange - medium
  return '#FF4444'; // Red - far
}

// Shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Calculate spaced label positions to prevent overlap
const MIN_LABEL_SPACING = 44; // Minimum pixels between label centers

function calculateSpacedPositions(
  dotPositions: number[],
  correctPosition: number,
  scaleHeight: number
): { guessPositions: number[] } {
  // Combine all positions with their indices (guesses only)
  const items = dotPositions.map((pos, idx) => ({
    originalIndex: idx,
    dotPosition: pos,
    labelPosition: pos,
  }));

  // Sort by dot position (top to bottom)
  items.sort((a, b) => a.dotPosition - b.dotPosition);

  // Push labels apart if they're too close (considering correct answer as fixed obstacle)
  for (let iteration = 0; iteration < 15; iteration++) {
    let moved = false;

    // First, push guesses away from each other
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1];
      const curr = items[i];
      const gap = curr.labelPosition - prev.labelPosition;

      if (gap < MIN_LABEL_SPACING) {
        const overlap = MIN_LABEL_SPACING - gap;
        const pushEach = overlap / 2;

        prev.labelPosition -= pushEach;
        curr.labelPosition += pushEach;
        moved = true;
      }
    }

    // Then, push guesses away from the fixed correct answer position
    for (const item of items) {
      const gapFromCorrect = Math.abs(item.labelPosition - correctPosition);
      if (gapFromCorrect < MIN_LABEL_SPACING) {
        const overlap = MIN_LABEL_SPACING - gapFromCorrect;
        // Push the guess away from correct answer (correct stays fixed)
        if (item.labelPosition < correctPosition) {
          item.labelPosition -= overlap;
        } else {
          item.labelPosition += overlap;
        }
        moved = true;
      }
    }

    // Keep within bounds
    for (const item of items) {
      item.labelPosition = Math.max(10, Math.min(scaleHeight - 10, item.labelPosition));
    }

    if (!moved) break;
  }

  // Extract positions
  const guessPositions: number[] = new Array(dotPositions.length);
  for (const item of items) {
    guessPositions[item.originalIndex] = item.labelPosition;
  }

  return { guessPositions };
}

export default function AnswerReveal({
  correctAnswer,
  questionText,
  rankings,
  players,
  currentPlayerId,
  units,
  onComplete,
  canContinue,
  nextAskerName,
}: AnswerRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('drumroll');
  const [revealedGuessIndex, setRevealedGuessIndex] = useState(-1);
  const [revealedNameIndex, setRevealedNameIndex] = useState(-1);

  // Random order for guess reveals (memoized so it doesn't change)
  const guessRevealOrder = useMemo(() => {
    return shuffleArray(rankings.map((_, i) => i));
  }, [rankings.length]);

  // Calculate vertical positions for all values
  const scaleData = useMemo(() => {
    const guesses = rankings.map(r => r.guess).filter((g): g is number => g !== null);
    const allValues = [correctAnswer, ...guesses];

    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);

    // Add padding
    const range = maxVal - minVal || 1;
    const paddedMin = Math.max(0.1, minVal - range * 0.15);
    const paddedMax = maxVal + range * 0.15;

    // Use log scale for large ranges
    const useLogScale = paddedMax / paddedMin > 10;

    const getPosition = (value: number): number => {
      let normalized: number;
      if (useLogScale) {
        const logMin = Math.log10(Math.max(paddedMin, 0.1));
        const logMax = Math.log10(paddedMax);
        const logVal = Math.log10(Math.max(value, 0.1));
        normalized = (logVal - logMin) / (logMax - logMin);
      } else {
        normalized = (value - paddedMin) / (paddedMax - paddedMin);
      }
      // Invert so higher values are at top (lower Y position)
      return (1 - normalized) * SCALE_HEIGHT;
    };

    const correctDotPosition = getPosition(correctAnswer);
    const guessDotPositions = rankings.map(r =>
      r.guess !== null ? getPosition(r.guess) : SCALE_HEIGHT / 2
    );

    // Calculate spaced label positions (correct answer stays fixed, guesses space around it)
    const spacedPositions = calculateSpacedPositions(guessDotPositions, correctDotPosition, SCALE_HEIGHT);

    return {
      correctDotPosition,
      guessDotPositions,
      guessLabelPositions: spacedPositions.guessPositions,
    };
  }, [correctAnswer, rankings]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleLineHeight = useRef(new Animated.Value(0)).current;
  const correctMarkerOpacity = useRef(new Animated.Value(0)).current;
  const correctMarkerScale = useRef(new Animated.Value(0.5)).current;
  const guessAnims = useRef(rankings.map(() => ({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
  }))).current;
  const nameAnims = useRef(rankings.map(() => new Animated.Value(0))).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Drumroll pulse animation
  useEffect(() => {
    if (phase === 'drumroll') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [phase]);

  // Answer phase - scale line grows, correct answer appears
  useEffect(() => {
    if (phase === 'answer') {
      // Grow the scale line
      Animated.timing(scaleLineHeight, {
        toValue: SCALE_HEIGHT,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      // Pop in the correct answer marker
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(correctMarkerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(correctMarkerScale, {
            toValue: 1,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
          }),
        ]).start();
      }, 800);
    }
  }, [phase]);

  // Guesses phase - reveal guesses one by one in random order
  useEffect(() => {
    if (phase === 'guesses' && revealedGuessIndex >= 0) {
      const actualIndex = guessRevealOrder[revealedGuessIndex];
      Animated.parallel([
        Animated.timing(guessAnims[actualIndex].opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(guessAnims[actualIndex].scale, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase, revealedGuessIndex]);

  // Identities phase - reveal names best to worst
  useEffect(() => {
    if (phase === 'identities' && revealedNameIndex >= 0) {
      Animated.timing(nameAnims[revealedNameIndex], {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [phase, revealedNameIndex]);

  // Button fade in
  useEffect(() => {
    if (phase === 'complete') {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [phase]);

  // Phase timing (longer durations for dramatic effect)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    switch (phase) {
      case 'drumroll':
        timer = setTimeout(() => setPhase('answer'), 3000);
        break;
      case 'answer':
        timer = setTimeout(() => setPhase('guesses'), 2500);
        break;
      case 'guesses':
        if (revealedGuessIndex < rankings.length - 1) {
          timer = setTimeout(() => {
            setRevealedGuessIndex(prev => prev + 1);
          }, revealedGuessIndex === -1 ? 600 : 800);
        } else {
          timer = setTimeout(() => setPhase('identities'), 3000);
        }
        break;
      case 'identities':
        if (revealedNameIndex < rankings.length - 1) {
          timer = setTimeout(() => {
            setRevealedNameIndex(prev => prev + 1);
          }, revealedNameIndex === -1 ? 800 : 1500);
        } else {
          timer = setTimeout(() => setPhase('complete'), 1000);
        }
        break;
    }

    return () => clearTimeout(timer);
  }, [phase, revealedGuessIndex, revealedNameIndex, rankings.length]);

  // Skip to end
  const handleSkip = useCallback(() => {
    if (phase !== 'complete') {
      setPhase('complete');
      setRevealedGuessIndex(rankings.length - 1);
      setRevealedNameIndex(rankings.length - 1);
      scaleLineHeight.setValue(SCALE_HEIGHT);
      correctMarkerOpacity.setValue(1);
      correctMarkerScale.setValue(1);
      guessAnims.forEach(anim => {
        anim.opacity.setValue(1);
        anim.scale.setValue(1);
      });
      nameAnims.forEach(anim => anim.setValue(1));
      buttonOpacity.setValue(1);
    }
  }, [phase, rankings.length]);

  return (
    <TouchableWithoutFeedback onPress={handleSkip}>
      <View style={styles.container}>
        <Text style={styles.title}>Round Results</Text>

        {phase !== 'complete' && (
          <Text style={styles.skipHint}>Tap anywhere to skip</Text>
        )}

        {/* Phase 1: Drumroll */}
        {phase === 'drumroll' && (
          <View style={styles.drumrollContainer}>
            <Text style={styles.questionText}>{questionText}</Text>
            <Animated.View style={[styles.questionMarkBox, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.questionMark}>?</Text>
            </Animated.View>
            <Text style={styles.suspenseText}>The answer is...</Text>
          </View>
        )}

        {/* Phase 2+: Vertical Scale */}
        {phase !== 'drumroll' && (
          <View style={styles.scaleContainer}>
            {/* Vertical scale line */}
            <Animated.View style={[styles.scaleLine, { height: scaleLineHeight }]} />

            {/* Correct answer dot */}
            <Animated.View
              style={[
                styles.correctDotContainer,
                {
                  top: scaleData.correctDotPosition - 10,
                  opacity: correctMarkerOpacity,
                  transform: [{ scale: correctMarkerScale }],
                },
              ]}
            >
              <View style={styles.correctMarkerDot}>
                <Text style={styles.correctMarkerCheck}>✓</Text>
              </View>
            </Animated.View>

            {/* Correct answer label (aligned with dot) */}
            <Animated.View
              style={[
                styles.correctLabelRow,
                {
                  top: scaleData.correctDotPosition - 14,
                  opacity: correctMarkerOpacity,
                },
              ]}
            >
              <View style={[styles.leaderLine, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.correctAnswerValue}>
                {correctAnswer.toLocaleString()}
              </Text>
              {units && <Text style={styles.correctAnswerUnits}> {units}</Text>}
            </Animated.View>

            {/* Guess markers - dots on the line */}
            {rankings.map((ranking, index) => {
              const color = getDistanceColor(ranking.guess, correctAnswer);
              const dotY = scaleData.guessDotPositions[index];

              return (
                <Animated.View
                  key={`dot-${ranking.playerId}`}
                  style={[
                    styles.guessDotContainer,
                    {
                      top: dotY - 8,
                      opacity: guessAnims[index].opacity,
                      transform: [{ scale: guessAnims[index].scale }],
                    },
                  ]}
                >
                  <View style={[styles.guessMarkerDot, { backgroundColor: color }]} />
                </Animated.View>
              );
            })}

            {/* Guess labels - spaced out with horizontal leader lines */}
            {rankings.map((ranking, index) => {
              const player = players[ranking.playerId];
              const color = getDistanceColor(ranking.guess, correctAnswer);
              const isWinner = index === 0;
              const isLoser = index === rankings.length - 1;
              const dotY = scaleData.guessDotPositions[index];
              const labelY = scaleData.guessLabelPositions[index];
              const verticalOffset = dotY - labelY;
              const needsVerticalTick = Math.abs(verticalOffset) > 4;

              return (
                <Animated.View
                  key={`label-${ranking.playerId}`}
                  style={[
                    styles.guessLabelRow,
                    {
                      top: labelY - 12,
                      opacity: guessAnims[index].opacity,
                    },
                  ]}
                >
                  {/* Small vertical tick pointing toward the dot (forms L with horizontal line) */}
                  {needsVerticalTick && (
                    <View
                      style={[
                        styles.verticalTick,
                        {
                          height: Math.min(Math.abs(verticalOffset) / 2, 12),
                          top: verticalOffset > 0 ? 12 : 12 - Math.min(Math.abs(verticalOffset) / 2, 12),
                          backgroundColor: color,
                        },
                      ]}
                    />
                  )}
                  {/* Horizontal leader line pointing toward scale */}
                  <View style={[styles.leaderLine, { backgroundColor: color }]} />

                  {/* Guess value (full number) */}
                  <Text style={[styles.guessValue, { color }]}>
                    {ranking.guess !== null ? ranking.guess.toLocaleString() : 'No guess'}
                  </Text>

                  {/* Player name + points (revealed later) */}
                  <Animated.View style={[styles.guessNameContainer, { opacity: nameAnims[index] }]}>
                    {isWinner && <Text style={styles.crownIcon}>👑</Text>}
                    <Text style={[
                      styles.playerName,
                      isWinner && styles.playerNameWinner,
                      isLoser && styles.playerNameLoser,
                      ranking.playerId === currentPlayerId && styles.playerNameYou,
                    ]}>
                      {player?.nickname || 'Unknown'}
                      {ranking.playerId === currentPlayerId && ' (You)'}
                    </Text>
                    {(isWinner || isLoser) && (
                      <Text style={[
                        styles.pointsText,
                        isWinner && styles.pointsPositive,
                        isLoser && styles.pointsNegative,
                      ]}>
                        {isWinner ? '+1' : '-1'}
                      </Text>
                    )}
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Continue button */}
        {phase === 'complete' && (
          <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
            {canContinue ? (
              <TouchableOpacity style={styles.button} onPress={onComplete}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.waitingText}>
                Waiting for {nextAskerName || 'host'} to continue...
              </Text>
            )}
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  skipHint: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  // Drumroll phase
  drumrollContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  questionMarkBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  questionMark: {
    fontSize: 48,
    fontWeight: FontWeights.bold,
    color: Colors.background,
  },
  suspenseText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
  },
  // Vertical scale
  scaleContainer: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    marginTop: Spacing.md,
  },
  scaleLine: {
    width: 3,
    backgroundColor: Colors.border,
    borderRadius: 1.5,
    position: 'absolute',
    left: Spacing.md,
    top: 0,
  },
  // Correct answer dot
  correctDotContainer: {
    position: 'absolute',
    left: Spacing.md - 2, // Aligned with guess dots
    zIndex: 10,
  },
  correctMarkerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  correctMarkerCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: FontWeights.bold,
  },
  // Correct answer label (spaced like guesses)
  correctLabelRow: {
    position: 'absolute',
    left: Spacing.md + 24,
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  correctAnswerValue: {
    color: '#3B82F6',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  correctAnswerUnits: {
    color: '#3B82F6',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.normal,
  },
  // Guess dots (on the scale line)
  guessDotContainer: {
    position: 'absolute',
    left: Spacing.md - 2,
    zIndex: 5,
  },
  guessMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // Guess labels (spaced out to prevent overlap)
  guessLabelRow: {
    position: 'absolute',
    left: Spacing.md + 24,
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
  },
  leaderLine: {
    width: 48,
    height: 2,
    marginRight: Spacing.xs,
    opacity: 0.6,
  },
  verticalTick: {
    position: 'absolute',
    left: 0,
    width: 2,
    opacity: 0.6,
  },
  guessValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  guessNameContainer: {
    marginLeft: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  crownIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  playerName: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  playerNameWinner: {
    fontWeight: FontWeights.bold,
  },
  playerNameLoser: {
    // Keep white, no color change
  },
  playerNameYou: {
    fontWeight: FontWeights.bold,
  },
  pointsText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  pointsPositive: {
    color: '#4CAF50',
  },
  pointsNegative: {
    color: '#FF4444',
  },
  // Button
  buttonContainer: {
    paddingTop: Spacing.md,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    padding: Spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.background,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  waitingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

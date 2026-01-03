import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Text, Animated, Dimensions } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/theme';
import type { RoundRanking, Player } from '../../types/game';
import { selection, mediumTap, success } from '../../utils/haptics';

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
  const [slotMachineNumber, setSlotMachineNumber] = useState<number>(correctAnswer);
  const [isSlotMachineSpinning, setIsSlotMachineSpinning] = useState<boolean>(false);

  // Separate actual guesses from non-responders
  const actualGuessRankings = useMemo(() => rankings.filter(r => r.guess !== null), [rankings]);
  const nonResponders = useMemo(() => rankings.filter(r => r.guess === null), [rankings]);

  // Calculate vertical positions for all values
  const scaleData = useMemo(() => {
    const guesses = actualGuessRankings.map(r => r.guess).filter((g): g is number => g !== null);
    const allValues = [correctAnswer, ...guesses];

    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);

    // Add padding (asymmetric: less on bottom, more on top)
    const range = maxVal - minVal || 1;
    const paddedMin = Math.max(0.1, minVal - range * 0.05);
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
    const guessDotPositions = actualGuessRankings.map(r =>
      r.guess !== null ? getPosition(r.guess) : SCALE_HEIGHT / 2
    );

    // Calculate spaced label positions (correct answer stays fixed, guesses space around it)
    const spacedPositions = calculateSpacedPositions(guessDotPositions, correctDotPosition, SCALE_HEIGHT);

    return {
      correctDotPosition,
      guessDotPositions,
      guessLabelPositions: spacedPositions.guessPositions,
    };
  }, [correctAnswer, actualGuessRankings]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleLineHeight = useRef(new Animated.Value(0)).current;
  const correctMarkerOpacity = useRef(new Animated.Value(0)).current;
  const correctMarkerScale = useRef(new Animated.Value(0.5)).current;
  const guessAnims = useRef(actualGuessRankings.map(() => ({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
  }))).current;
  const nameAnims = useRef(actualGuessRankings.map(() => new Animated.Value(0))).current;
  const nonResponderOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Calculate zoom translation to center the correct answer when zoomed in
  const zoomTranslation = useMemo(() => {
    const centerY = SCREEN_HEIGHT * 0.4; // Center in visible area (accounting for header)
    const correctAnswerY = scaleData.correctDotPosition;
    // When zoomed, we need less translation (zoom already magnifies the offset)
    return (centerY - correctAnswerY) * 1.0;
  }, [scaleData.correctDotPosition]);

  // Zoom animations - start zoomed in on correct answer (1.3x ensures full width visible)
  const zoomScale = useRef(new Animated.Value(1.3)).current;
  const zoomTranslateY = useRef(new Animated.Value(0)).current;

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

  // Answer phase - scale line grows, slot machine spins, correct answer appears
  useEffect(() => {
    if (phase === 'answer') {
      // Haptic when answer phase begins
      mediumTap();

      // Ensure zoom is set to zoomed in position
      zoomScale.setValue(1.3);
      zoomTranslateY.setValue(zoomTranslation);

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

      // Slot machine effect - spin numbers at readable speed within 200% of correct answer
      setIsSlotMachineSpinning(true);
      const spinInterval = setInterval(() => {
        // Generate random number within 50% to 200% of correct answer (reasonable range)
        const minValue = Math.max(1, correctAnswer * 0.5);
        const maxValue = correctAnswer * 2;
        const randomNum = minValue + Math.random() * (maxValue - minValue);
        setSlotMachineNumber(Math.round(randomNum));
      }, 150); // Slower for readability

      // Stop spinning and reveal correct answer after 4200ms
      const stopSpinTimeout = setTimeout(() => {
        clearInterval(spinInterval);
        setSlotMachineNumber(correctAnswer);
        setIsSlotMachineSpinning(false);
        success(); // Haptic when correct answer locks in
      }, 4200);

      return () => {
        clearInterval(spinInterval);
        clearTimeout(stopSpinTimeout);
      };
    }
  }, [phase, correctAnswer, zoomTranslation]);

  // Guesses phase - zoom out animation starts when phase begins
  useEffect(() => {
    if (phase === 'guesses') {
      // Calculate total duration for all guess reveals (slower pacing)
      const totalRevealDuration = actualGuessRankings.length > 0
        ? 1500 + (actualGuessRankings.length - 1) * 2000
        : 1500;

      // Zoom out and center simultaneously
      Animated.parallel([
        Animated.timing(zoomScale, {
          toValue: 1,
          duration: totalRevealDuration,
          useNativeDriver: true,
        }),
        Animated.timing(zoomTranslateY, {
          toValue: 0,
          duration: totalRevealDuration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase, actualGuessRankings.length]);

  // Guesses phase - reveal guesses one by one in best-to-worst order
  useEffect(() => {
    if (phase === 'guesses' && revealedGuessIndex >= 0) {
      selection(); // Haptic for each guess reveal
      Animated.parallel([
        Animated.timing(guessAnims[revealedGuessIndex].opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(guessAnims[revealedGuessIndex].scale, {
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
      // Winner gets success haptic, others get selection
      if (revealedNameIndex === 0) {
        success();
      } else {
        selection();
      }
      Animated.timing(nameAnims[revealedNameIndex], {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [phase, revealedNameIndex]);

  // Button fade in and non-responders fade in
  useEffect(() => {
    if (phase === 'complete') {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Fade in non-responders list if there are any
      if (nonResponders.length > 0) {
        Animated.timing(nonResponderOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [phase, nonResponders.length]);

  // Phase timing (longer durations for dramatic effect)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    switch (phase) {
      case 'drumroll':
        timer = setTimeout(() => setPhase('answer'), 3000);
        break;
      case 'answer':
        // Wait for slot machine (4200ms) + pause to appreciate bolded answer (1500ms) before starting guesses
        timer = setTimeout(() => setPhase('guesses'), 5700);
        break;
      case 'guesses':
        if (actualGuessRankings.length === 0) {
          // No actual guesses - skip to complete phase
          timer = setTimeout(() => setPhase('complete'), 1500);
        } else if (revealedGuessIndex < actualGuessRankings.length - 1) {
          timer = setTimeout(() => {
            setRevealedGuessIndex(prev => prev + 1);
          }, revealedGuessIndex === -1 ? 1500 : 2000);
        } else {
          timer = setTimeout(() => setPhase('identities'), 3000);
        }
        break;
      case 'identities':
        if (actualGuessRankings.length === 0) {
          // No actual guesses - skip to complete phase
          timer = setTimeout(() => setPhase('complete'), 500);
        } else if (revealedNameIndex < actualGuessRankings.length - 1) {
          timer = setTimeout(() => {
            setRevealedNameIndex(prev => prev + 1);
          }, revealedNameIndex === -1 ? 800 : 1500);
        } else {
          timer = setTimeout(() => setPhase('complete'), 1000);
        }
        break;
    }

    return () => clearTimeout(timer);
  }, [phase, revealedGuessIndex, revealedNameIndex, actualGuessRankings.length]);

  // Auto-transition after 3.5 seconds when complete and can continue
  useEffect(() => {
    if (phase === 'complete' && canContinue) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [phase, canContinue, onComplete]);

  // Skip to end
  const handleSkip = useCallback(() => {
    if (phase !== 'complete') {
      setPhase('complete');
      setRevealedGuessIndex(actualGuessRankings.length - 1);
      setRevealedNameIndex(actualGuessRankings.length - 1);
      scaleLineHeight.setValue(SCALE_HEIGHT);
      correctMarkerOpacity.setValue(1);
      correctMarkerScale.setValue(1);
      guessAnims.forEach(anim => {
        anim.opacity.setValue(1);
        anim.scale.setValue(1);
      });
      nameAnims.forEach(anim => anim.setValue(1));
      buttonOpacity.setValue(1);
      nonResponderOpacity.setValue(1);
      // Reset zoom animations
      zoomScale.setValue(1);
      zoomTranslateY.setValue(0);
      // Show correct answer (not slot machine number)
      setSlotMachineNumber(correctAnswer);
      setIsSlotMachineSpinning(false);
    }
  }, [phase, actualGuessRankings.length, correctAnswer]);

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
            <Animated.View
              style={{
                flex: 1,
                transform: [
                  { scale: zoomScale },
                  { translateY: zoomTranslateY }
                ]
              }}
            >
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
              <Text style={[
                styles.correctAnswerValue,
                isSlotMachineSpinning && styles.correctAnswerValueSpinning
              ]}>
                {slotMachineNumber.toLocaleString()}
              </Text>
              {units && <Text style={styles.correctAnswerUnits}> {units}</Text>}
            </Animated.View>

            {/* Guess markers - dots on the line (only actual guesses, not non-responders) */}
            {actualGuessRankings.map((ranking, index) => {
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

            {/* Guess labels - spaced out with horizontal leader lines (only actual guesses) */}
            {actualGuessRankings.map((ranking, index) => {
              const player = players[ranking.playerId];
              const color = getDistanceColor(ranking.guess, correctAnswer);
              const isWinner = index === 0;
              const isLoser = index === actualGuessRankings.length - 1 && actualGuessRankings.length > 1;
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
                  </Animated.View>
                </Animated.View>
              );
            })}
            </Animated.View>
          </View>
        )}

        {/* Non-responders list */}
        {phase === 'complete' && nonResponders.length > 0 && (
          <Animated.View style={[styles.nonRespondersContainer, { opacity: nonResponderOpacity }]}>
            <Text style={styles.nonRespondersLabel}>No response:</Text>
            <Text style={styles.nonRespondersNames}>
              {nonResponders
                .map(r => players[r.playerId]?.nickname || 'Unknown')
                .join(', ')}
            </Text>
          </Animated.View>
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
    left: Spacing.md - 8.5, // Centered on the line (line center at Spacing.md + 1.5, dot is 20px wide)
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
  correctAnswerValueSpinning: {
    fontWeight: FontWeights.normal, // Unbold while spinning
  },
  correctAnswerUnits: {
    color: '#3B82F6',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.normal,
  },
  // Guess dots (on the scale line)
  guessDotContainer: {
    position: 'absolute',
    left: Spacing.md - 6.5, // Centered on the line (line center at Spacing.md + 1.5, dot is 16px wide)
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
  // Non-responders
  nonRespondersContainer: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: '#666666',
  },
  nonRespondersLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
  },
  nonRespondersNames: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
  },
});

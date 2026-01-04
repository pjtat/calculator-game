import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Text, Animated } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../constants/theme';
import FloatingEmoji from './FloatingEmoji';
import EmojiPicker from './EmojiPicker';
import { useReactionSync } from './useReactionSync';
import { submitReaction } from '../../services/firebase';
import { FloatingEmoji as FloatingEmojiType } from './types';

type RevealPhase = 'best' | 'worst' | 'snark' | 'complete';

export interface BestWorstRevealProps {
  bestPlayer: { id: string; name: string; guess: number; percentError: number | null };
  worstPlayer: { id: string; name: string; guess: number; percentError: number | null };
  correctAnswer: number;
  questionText: string;
  units?: string;
  snarkyRemark: string | null;
  currentPlayerId: string;
  onComplete: () => void;
  canContinue: boolean;
  nextAskerName?: string;
  gameCode: string;
  currentRound: number;
}

// Calculate accuracy percentage from error percentage
const calculateAccuracy = (percentError: number | null): string => {
  if (percentError === null) return 'No guess';
  const accuracy = Math.max(0, 100 - percentError);
  return `${accuracy.toFixed(1)}% accurate`;
};

// Calculate how far off the guess was
const calculatePercentOff = (percentError: number | null): string => {
  if (percentError === null) return 'No guess';
  return `${percentError.toFixed(1)}% off`;
};

// Fallback snarky messages when Gemini API fails
const FALLBACK_SNARKY_MESSAGES = [
  "Yikes! 😬",
  "Oof... not quite! 👀",
  "Sheesh, that's way off! 💀",
  "Wow... just wow. 🤯",
  "Umm... not even close! 😅",
  "Big swing and a miss! ⚾️💨",
  "That's... ambitious! 🎯❌",
  "Nice try though! 😬✨",
];

const getRandomFallbackSnark = (): string => {
  return FALLBACK_SNARKY_MESSAGES[Math.floor(Math.random() * FALLBACK_SNARKY_MESSAGES.length)];
};

export default function BestWorstReveal({
  bestPlayer,
  worstPlayer,
  correctAnswer,
  questionText,
  units,
  snarkyRemark,
  currentPlayerId,
  onComplete,
  canContinue,
  nextAskerName,
  gameCode,
  currentRound,
}: BestWorstRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('best');
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiType[]>([]);
  const lastReactionTime = useRef<{ [emoji: string]: number }>({});

  // Animations
  const bestSlideAnim = useRef(new Animated.Value(300)).current; // Start off-screen right
  const bestOpacity = useRef(new Animated.Value(0)).current;
  const worstSlideAnim = useRef(new Animated.Value(-300)).current; // Start off-screen left
  const worstOpacity = useRef(new Animated.Value(0)).current;
  const snarkOpacity = useRef(new Animated.Value(0)).current;
  const snarkScale = useRef(new Animated.Value(0.8)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Auto-progression duration in milliseconds
  const AUTO_PROGRESS_DURATION = 8000;

  // Emoji reaction handlers
  const handleEmojiPress = useCallback((emoji: string) => {
    const now = Date.now();
    const lastTime = lastReactionTime.current[emoji] || 0;

    // Throttle: max 1 reaction per emoji per 200ms
    if (now - lastTime < 200) {
      return;
    }

    lastReactionTime.current[emoji] = now;

    submitReaction(gameCode, currentRound, currentPlayerId, emoji);
  }, [gameCode, currentRound, currentPlayerId]);

  const handleEmojiComplete = useCallback((id: string) => {
    setFloatingEmojis(prev => prev.filter(emoji => emoji.id !== id));
  }, []);

  const handleReactionReceived = useCallback((reaction: { playerId: string; emoji: string; timestamp: number }) => {
    const newFloatingEmoji: FloatingEmojiType = {
      id: `${reaction.playerId}-${reaction.timestamp}`,
      emoji: reaction.emoji,
      playerId: reaction.playerId,
      startX: Math.random() * 200 - 100, // Random offset -100 to +100
      timestamp: reaction.timestamp,
    };

    setFloatingEmojis(prev => {
      // Check if this reaction already exists (prevent duplicates)
      if (prev.some(emoji => emoji.id === newFloatingEmoji.id)) {
        return prev;
      }

      // Limit to 15 floating emojis
      if (prev.length >= 15) {
        return [...prev.slice(1), newFloatingEmoji];
      }
      return [...prev, newFloatingEmoji];
    });
  }, []);

  // Listen for emoji reactions from Firebase
  useReactionSync(gameCode, currentRound, handleReactionReceived);

  // Best guess animation
  useEffect(() => {
    if (phase === 'best') {
      Animated.parallel([
        Animated.timing(bestSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bestOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase]);

  // Worst guess animation
  useEffect(() => {
    if (phase === 'worst') {
      Animated.parallel([
        Animated.timing(worstSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(worstOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase]);

  // Snark animation
  useEffect(() => {
    if (phase === 'snark') {
      Animated.parallel([
        Animated.timing(snarkOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(snarkScale, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase]);

  // Button animation
  useEffect(() => {
    if (phase === 'complete') {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [phase]);

  // Phase timing
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    switch (phase) {
      case 'best':
        timer = setTimeout(() => setPhase('worst'), 2000);
        break;
      case 'worst':
        timer = setTimeout(() => setPhase('snark'), 2000);
        break;
      case 'snark':
        timer = setTimeout(() => setPhase('complete'), 3000);
        break;
    }

    return () => clearTimeout(timer);
  }, [phase]);

  // Auto-transition with progress bar when complete and can continue
  useEffect(() => {
    if (phase === 'complete' && canContinue) {
      // Reset and start progress bar animation
      progressAnim.setValue(0);
      const progressAnimation = Animated.timing(progressAnim, {
        toValue: 1,
        duration: AUTO_PROGRESS_DURATION,
        useNativeDriver: false,
      });
      progressAnimation.start();

      const timer = setTimeout(() => {
        onComplete();
      }, AUTO_PROGRESS_DURATION);

      return () => {
        clearTimeout(timer);
        progressAnimation.stop();
      };
    }
  }, [phase, canContinue, onComplete]);

  // Skip to end
  const handleSkip = useCallback(() => {
    if (phase !== 'complete') {
      setPhase('complete');
      bestSlideAnim.setValue(0);
      bestOpacity.setValue(1);
      worstSlideAnim.setValue(0);
      worstOpacity.setValue(1);
      snarkOpacity.setValue(1);
      snarkScale.setValue(1);
      buttonOpacity.setValue(1);
    }
  }, [phase]);

  return (
    <TouchableWithoutFeedback onPress={handleSkip}>
      <View style={styles.container}>
        <Text style={styles.title}>Round Highlights</Text>

        {phase !== 'complete' && (
          <Text style={styles.skipHint}>Tap anywhere to skip</Text>
        )}

        <View style={styles.content}>
          {/* Best Guess */}
          {(phase === 'best' || phase === 'worst' || phase === 'snark' || phase === 'complete') && (
            <Animated.View
              style={[
                styles.card,
                styles.bestCard,
                {
                  opacity: bestOpacity,
                  transform: [{ translateX: bestSlideAnim }],
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.trophy}>🏆</Text>
                <Text style={styles.cardTitle}>BEST GUESS</Text>
              </View>
              <Text style={styles.playerName}>
                {bestPlayer.name}
                {bestPlayer.id === currentPlayerId && ' (You)'}
              </Text>
              <Text style={styles.guessValue}>
                {bestPlayer.guess.toLocaleString()} {units || ''}
              </Text>
              <Text style={styles.accuracy}>
                {calculateAccuracy(bestPlayer.percentError)}
              </Text>
            </Animated.View>
          )}

          {/* Worst Guess */}
          {(phase === 'worst' || phase === 'snark' || phase === 'complete') && (
            <Animated.View
              style={[
                styles.card,
                styles.worstCard,
                {
                  opacity: worstOpacity,
                  transform: [{ translateX: worstSlideAnim }],
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.poop}>💩</Text>
                <Text style={styles.cardTitle}>WORST GUESS</Text>
              </View>
              <Text style={styles.playerName}>
                {worstPlayer.name}
                {worstPlayer.id === currentPlayerId && ' (You)'}
              </Text>
              <Text style={styles.guessValue}>
                {worstPlayer.guess !== null ? `${worstPlayer.guess.toLocaleString()} ${units || ''}` : 'No guess'}
              </Text>
              <Text style={styles.percentOff}>
                {calculatePercentOff(worstPlayer.percentError)}
              </Text>

              {/* Snarky Remark - shown after a delay */}
              {(phase === 'snark' || phase === 'complete') && (
                <Animated.View
                  style={[
                    styles.snarkInlineContainer,
                    {
                      opacity: snarkOpacity,
                      transform: [{ scale: snarkScale }],
                    },
                  ]}
                >
                  <Text style={styles.snarkInlineText}>
                    {snarkyRemark || getRandomFallbackSnark()}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>

        {/* Emoji Picker - shown during complete phase */}
        {phase === 'complete' && (
          <View pointerEvents="box-none">
            <EmojiPicker
              gameCode={gameCode}
              currentRound={currentRound}
              onEmojiPress={handleEmojiPress}
              visible={true}
            />
          </View>
        )}

        {/* Continue button */}
        {phase === 'complete' && (
          <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
            {canContinue ? (
              <>
                <TouchableOpacity style={styles.button} onPress={onComplete}>
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
                {/* Progress bar showing auto-progression countdown */}
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.autoProgressText}>Auto-continuing...</Text>
              </>
            ) : (
              <Text style={styles.waitingText}>
                Waiting for {nextAskerName || 'host'} to continue...
              </Text>
            )}
          </Animated.View>
        )}

        {/* Floating emojis overlay */}
        <View style={styles.floatingEmojiContainer} pointerEvents="none">
          {floatingEmojis.map(emoji => (
            <FloatingEmoji
              key={emoji.id}
              emoji={emoji.emoji}
              startX={emoji.startX}
              onComplete={() => handleEmojiComplete(emoji.id)}
            />
          ))}
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  bestCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  worstCard: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  trophy: {
    fontSize: 24,
  },
  poop: {
    fontSize: 24,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  playerName: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
  },
  guessValue: {
    color: Colors.text,
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  accuracy: {
    color: '#4CAF50',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  percentOff: {
    color: '#FF4444',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  snarkInlineContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 68, 68, 0.3)',
  },
  snarkInlineText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    fontStyle: 'italic',
    textAlign: 'center',
  },
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
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  autoProgressText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  floatingEmojiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    pointerEvents: 'none',
  },
});

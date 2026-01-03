import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { lightTap } from '../../utils/haptics';
import { seededRandom, shuffleWithSeed } from '../../utils/seededRandom';
import { GOOD_EMOJIS, BAD_EMOJIS } from './types';

interface EmojiPickerProps {
  gameCode: string;
  currentRound: number;
  onEmojiPress: (emoji: string) => void;
  visible: boolean;
}

interface EmojiButtonProps {
  emoji: string;
  onPress: () => void;
}

function EmojiButton({ emoji, onPress }: EmojiButtonProps) {
  const handlePress = () => {
    lightTap();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.emojiButton}
      activeOpacity={0.7}
    >
      <Text style={styles.emojiText}>{emoji}</Text>
    </TouchableOpacity>
  );
}

export default function EmojiPicker({
  gameCode,
  currentRound,
  onEmojiPress,
  visible,
}: EmojiPickerProps) {
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const opacity = useRef(new Animated.Value(0)).current;

  // Deterministic emoji selection - all players see the same emojis
  useEffect(() => {
    const seed = `${gameCode}-${currentRound}`;
    const rng = seededRandom(seed);

    const goodPicks = shuffleWithSeed(GOOD_EMOJIS, rng).slice(0, 2);
    const badPicks = shuffleWithSeed(BAD_EMOJIS, rng).slice(0, 2);

    setSelectedEmojis([...goodPicks, ...badPicks]);
  }, [gameCode, currentRound]);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (selectedEmojis.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="box-none">
      <View style={styles.emojiPickerContainer}>
        {selectedEmojis.map((emoji) => (
          <EmojiButton
            key={emoji}
            emoji={emoji}
            onPress={() => onEmojiPress(emoji)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  emojiPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  emojiText: {
    fontSize: 28,
  },
});

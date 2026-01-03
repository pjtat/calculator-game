import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface FloatingEmojiProps {
  emoji: string;
  startX: number; // Horizontal offset from center (-100 to +100)
  onComplete: () => void;
}

export default function FloatingEmoji({ emoji, startX, onComplete }: FloatingEmojiProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate upward 300px over 2 seconds
    Animated.timing(translateY, {
      toValue: -300,
      duration: 2000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Fade out over 2 seconds, call onComplete when finished
    Animated.timing(opacity, {
      toValue: 0,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onComplete();
      }
    });
  }, []);

  return (
    <Animated.Text
      style={[
        styles.floatingEmoji,
        {
          left: SCREEN_WIDTH / 2 - 16 + startX, // Center minus half emoji width, plus random offset
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  floatingEmoji: {
    position: 'absolute',
    fontSize: 32,
    bottom: 120, // Start above emoji picker
  },
});

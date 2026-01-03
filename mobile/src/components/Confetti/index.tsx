import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
  initialX: number;
}

interface ConfettiProps {
  count?: number;
  colors?: string[];
  duration?: number;
  autoStart?: boolean;
}

const DEFAULT_COLORS = ['#FF8C42', '#FFD700', '#4CAF50', '#3B82F6', '#E91E63', '#9C27B0'];

export default function Confetti({
  count = 50,
  colors = DEFAULT_COLORS,
  duration = 3000,
  autoStart = true,
}: ConfettiProps) {
  const pieces = useRef<ConfettiPiece[]>([]);

  // Initialize confetti pieces
  if (pieces.current.length === 0) {
    for (let i = 0; i < count; i++) {
      const initialX = Math.random() * SCREEN_WIDTH;
      pieces.current.push({
        x: new Animated.Value(initialX),
        y: new Animated.Value(-50 - Math.random() * 100),
        rotate: new Animated.Value(0),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        initialX,
      });
    }
  }

  useEffect(() => {
    if (autoStart) {
      startAnimation();
    }
  }, []);

  const startAnimation = () => {
    const animations = pieces.current.map((piece, index) => {
      const delay = Math.random() * 500;
      const horizontalDrift = (Math.random() - 0.5) * 200;

      return Animated.parallel([
        // Fall down with slight horizontal drift
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(piece.y, {
            toValue: SCREEN_HEIGHT + 50,
            duration: duration + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]),
        // Horizontal sway
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(piece.x, {
            toValue: piece.initialX + horizontalDrift,
            duration: duration + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]),
        // Rotation
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(piece.rotate, {
            toValue: 360 * (2 + Math.random() * 3),
            duration: duration + Math.random() * 1000,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.current.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.piece,
            {
              width: piece.size,
              height: piece.size * 0.6,
              backgroundColor: piece.color,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});

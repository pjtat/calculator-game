import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Text } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ToiletPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  emoji: string;
  size: number;
  initialX: number;
}

interface ToiletRainProps {
  count?: number;
  duration?: number;
  autoStart?: boolean;
}

const SHAME_EMOJIS = ['🚽', '🚽', '🚽', '💀', '📉', '🗑️'];

export default function ToiletRain({
  count = 40,
  duration = 4500,
  autoStart = true,
}: ToiletRainProps) {
  const pieces = useRef<ToiletPiece[]>([]);

  // Initialize toilet pieces
  if (pieces.current.length === 0) {
    for (let i = 0; i < count; i++) {
      const initialX = Math.random() * SCREEN_WIDTH;
      pieces.current.push({
        x: new Animated.Value(initialX),
        y: new Animated.Value(-50 - Math.random() * 150),
        rotate: new Animated.Value(0),
        emoji: SHAME_EMOJIS[Math.floor(Math.random() * SHAME_EMOJIS.length)],
        size: 24 + Math.random() * 16,
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
    const animations = pieces.current.map((piece) => {
      const delay = Math.random() * 800;
      const horizontalDrift = (Math.random() - 0.5) * 150;

      return Animated.parallel([
        // Fall down slowly (more dramatic)
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(piece.y, {
            toValue: SCREEN_HEIGHT + 50,
            duration: duration + Math.random() * 1500,
            useNativeDriver: true,
          }),
        ]),
        // Horizontal sway
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(piece.x, {
            toValue: piece.initialX + horizontalDrift,
            duration: duration + Math.random() * 1500,
            useNativeDriver: true,
          }),
        ]),
        // Slow rotation
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(piece.rotate, {
            toValue: 360 * (1 + Math.random() * 2),
            duration: duration + Math.random() * 1500,
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
        >
          <Text style={{ fontSize: piece.size }}>{piece.emoji}</Text>
        </Animated.View>
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
  },
});

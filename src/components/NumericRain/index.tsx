import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { Colors } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface RainDrop {
  x: number;
  y: Animated.Value;
  char: string;
  isEasterEgg: boolean;
  speed: number;
}

const EASTER_EGGS = ['6.9', '8.0085', '420', '69', '42'];
const REGULAR_CHARS = ['0', '1'];
const NUM_DROPS = 30; // Number of falling numbers
const FONT_SIZE = 14;

export default function NumericRain() {
  const dropsRef = useRef<RainDrop[]>([]);

  useEffect(() => {
    // Initialize drops
    dropsRef.current = Array.from({ length: NUM_DROPS }, () => {
      const isEasterEgg = Math.random() > 0.95; // 5% chance
      return {
        x: Math.random() * width,
        y: new Animated.Value(-Math.random() * height),
        char: isEasterEgg
          ? EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)]
          : REGULAR_CHARS[Math.floor(Math.random() * REGULAR_CHARS.length)],
        isEasterEgg,
        speed: 2000 + Math.random() * 3000, // Random speed between 2-5 seconds
      };
    });

    // Animate each drop
    const animations = dropsRef.current.map((drop) => {
      const animate = () => {
        drop.y.setValue(-20);
        Animated.timing(drop.y, {
          toValue: height + 20,
          duration: drop.speed,
          useNativeDriver: false, // Must be false for SVG properties
        }).start(() => {
          // Reset and potentially change to easter egg
          const isEasterEgg = Math.random() > 0.97;
          drop.char = isEasterEgg
            ? EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)]
            : REGULAR_CHARS[Math.floor(Math.random() * REGULAR_CHARS.length)];
          drop.isEasterEgg = isEasterEgg;
          animate();
        });
      };
      animate();
    });

    // Cleanup
    return () => {
      dropsRef.current.forEach((drop) => drop.y.stopAnimation());
    };
  }, []);

  return (
    <Svg style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}>
      {dropsRef.current.map((drop, index) => (
        <AnimatedSvgText
          key={index}
          x={drop.x}
          y={drop.y}
          fontSize={FONT_SIZE}
          fill={drop.isEasterEgg ? Colors.rainEasterEgg : Colors.rainNormal}
          fontFamily="monospace"
          opacity={0.6}
        >
          {drop.char}
        </AnimatedSvgText>
      ))}
    </Svg>
  );
}

// Create animated version of SvgText
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

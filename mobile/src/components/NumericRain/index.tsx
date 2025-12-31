import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '../../constants/theme';

const FONT_SIZE = 12;
const TRAIL_LENGTH = 20;
const REGULAR_CHARS = ['0', '1'];
const TICK_INTERVAL = 80;

interface Column {
  id: number;
  x: number;
  headPosition: number;
  chars: string[];
  speed: number;
}

function getRandomChar(): string {
  return REGULAR_CHARS[Math.floor(Math.random() * REGULAR_CHARS.length)];
}

export default function NumericRain() {
  const { width, height } = useWindowDimensions();
  const [columns, setColumns] = useState<Column[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef(0);

  // Initialize columns
  useEffect(() => {
    if (width === 0) return;

    const numColumns = Math.floor(width / FONT_SIZE);
    const newColumns: Column[] = Array.from({ length: numColumns }, (_, i) => {
      return {
        id: i,
        x: i * FONT_SIZE,
        headPosition: Math.floor(Math.random() * -30),
        chars: Array.from({ length: TRAIL_LENGTH }, () => getRandomChar()),
        speed: Math.floor(Math.random() * 3) + 1,
      };
    });

    setColumns(newColumns);
  }, [width]);

  // Animation loop
  useEffect(() => {
    if (columns.length === 0 || height === 0) return;

    const maxPosition = Math.ceil(height / FONT_SIZE) + TRAIL_LENGTH + 5;

    intervalRef.current = setInterval(() => {
      tickRef.current += 1;

      setColumns((prevColumns) =>
        prevColumns.map((col) => {
          if (tickRef.current % col.speed !== 0) {
            return col;
          }

          let newHeadPosition = col.headPosition + 1;
          let newChars = [...col.chars];

          // Add new character at the head occasionally
          if (Math.random() > 0.7) {
            const newChar = getRandomChar();
            newChars = [newChar, ...newChars.slice(0, TRAIL_LENGTH - 1)];
          }

          // Reset when trail is fully past bottom
          if (newHeadPosition > maxPosition) {
            newHeadPosition = Math.floor(Math.random() * -10);
            newChars = Array.from({ length: TRAIL_LENGTH }, () => getRandomChar());
          }

          return {
            ...col,
            headPosition: newHeadPosition,
            chars: newChars,
          };
        })
      );
    }, TICK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [columns.length, height]);

  if (columns.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {columns.map((col) =>
        col.chars.map((char, trailIndex) => {
          const yPosition = (col.headPosition - trailIndex) * FONT_SIZE;

          if (yPosition < -FONT_SIZE || yPosition > height + FONT_SIZE) return null;

          const trailOpacity = Math.max(0.05, 1 - (trailIndex / TRAIL_LENGTH) * 0.95);

          const isHead = trailIndex === 0;
          const color = isHead ? Colors.rainNormal : Colors.rainNormal;

          return (
            <Text
              key={`${col.id}-${trailIndex}`}
              style={[
                styles.char,
                {
                  left: col.x,
                  top: yPosition,
                  color,
                  opacity: trailOpacity * 0.3,
                },
              ]}
            >
              {char}
            </Text>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  char: {
    position: 'absolute',
    fontSize: FONT_SIZE,
    fontFamily: 'monospace',
  },
});

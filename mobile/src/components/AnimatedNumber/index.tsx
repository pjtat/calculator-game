import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, TextStyle, StyleProp } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  formatter?: (value: number) => string;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 500,
  style,
  formatter = (v) => Math.round(v).toString(),
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    // Only animate if value changed
    if (value !== previousValue.current) {
      // Animate from previous value to new value
      animatedValue.setValue(previousValue.current);

      Animated.timing(animatedValue, {
        toValue: value,
        duration,
        useNativeDriver: false, // Must be false for non-transform/opacity props
      }).start();

      previousValue.current = value;
    }
  }, [value, duration]);

  useEffect(() => {
    // Listen to animated value changes and update display
    const listenerId = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(v);
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, []);

  return (
    <Text style={style}>
      {prefix}{formatter(displayValue)}{suffix}
    </Text>
  );
}

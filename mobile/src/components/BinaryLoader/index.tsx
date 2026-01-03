import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../../constants/theme';

const SEQUENCE = ['=', '+', '-', '×', '÷', '%', '$', '?'];
const DIGIT_DURATION = 900; // ms per symbol

export default function BinaryLoader() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SEQUENCE.length);
    }, DIGIT_DURATION);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    opacity.setValue(0);
    scale.setValue(0.8);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        easing: Easing.back(1.5),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.digit, { opacity, transform: [{ scale }] }]}>
        {SEQUENCE[currentIndex]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    width: 80,
  },
  digit: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: 'monospace',
  },
});

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontSizes, FontWeights } from '../../constants/theme';

interface TimerProps {
  duration: number; // in seconds
  onExpire: () => void;
  onTick?: (remaining: number) => void;
  autoStart?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Timer({
  duration,
  onExpire,
  onTick,
  autoStart = true,
}: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [isExpired, setIsExpired] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    if (autoStart) {
      startTimer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    // Animate the progress circle
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration * 1000,
      useNativeDriver: false, // Must be false for SVG properties
    }).start();

    // Countdown interval
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const newValue = prev - 1;

        if (onTick) {
          onTick(newValue);
        }

        if (newValue <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setIsExpired(true);
          onExpire();
          return 0;
        }

        return newValue;
      });
    }, 1000);
  };

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circumference],
  });

  const getTimerColor = () => {
    const percentage = (remaining / duration) * 100;
    if (percentage > 50) return Colors.primary;
    if (percentage > 20) return '#FFA500'; // Orange
    return '#FF4444'; // Red
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getTimerColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Timer text */}
      <View style={styles.textContainer}>
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {formatTime(remaining)}
        </Text>
        {isExpired && <Text style={styles.expiredText}>Time's up!</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
  },
  expiredText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

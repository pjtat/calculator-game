import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleAmount?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedButton({
  children,
  onPress,
  style,
  disabled = false,
  scaleAmount = 0.96,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    // Subtle opacity change on press for extra feedback
    opacity: interpolate(scale.value, [scaleAmount, 1], [0.85, 1]),
  }));

  const handlePressIn = () => {
    scale.value = withTiming(scaleAmount, { duration: 80 });
  };

  const handlePressOut = () => {
    // Bouncier spring with slight overshoot
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 350,
      mass: 0.8,
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[style, animatedStyle, disabled && { opacity: 0.5 }]}
    >
      {children}
    </AnimatedPressable>
  );
}

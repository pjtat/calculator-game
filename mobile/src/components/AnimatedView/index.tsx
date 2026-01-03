import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
} from 'react-native-reanimated';

// Re-export built-in entering animations for convenience
export { FadeIn, FadeInDown, FadeInUp, SlideInRight, SlideInLeft, ZoomIn };

interface AnimatedViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  animation?: 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'slideInRight' | 'scaleIn';
}

export default function AnimatedView({
  children,
  style,
  delay = 0,
  duration = 400,
  animation = 'fadeIn',
}: AnimatedViewProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(animation === 'fadeInUp' ? 20 : animation === 'fadeInDown' ? -20 : 0);
  const translateX = useSharedValue(animation === 'slideInRight' ? 30 : 0);
  const scale = useSharedValue(animation === 'scaleIn' ? 0.9 : 1);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 200 }));
    translateX.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 200 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 150 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// Staggered list animation helper
interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  style?: StyleProp<ViewStyle>;
  staggerDelay?: number;
}

export function StaggeredItem({
  children,
  index,
  style,
  staggerDelay = 50,
}: StaggeredItemProps) {
  return (
    <AnimatedView
      style={style}
      delay={index * staggerDelay}
      animation="fadeInUp"
    >
      {children}
    </AnimatedView>
  );
}

// Score counter animation
interface AnimatedScoreProps {
  value: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<any>;
}

export function AnimatedScore({ value, style, textStyle }: AnimatedScoreProps) {
  const displayValue = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    displayValue.value = withTiming(value, { duration: 500 });
    // Pulse effect when value changes
    scale.value = withSpring(1.2, { damping: 10, stiffness: 300 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }, 150);
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Animated.Text style={textStyle}>{Math.round(value)}</Animated.Text>
    </Animated.View>
  );
}

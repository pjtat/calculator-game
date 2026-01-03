import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utilities for consistent tactile feedback across the app.
 */

// Light tap for number buttons and standard interactions
export const lightTap = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

// Medium tap for operation buttons and confirmations
export const mediumTap = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

// Heavy tap for important actions (submit, equals)
export const heavyTap = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

// Success feedback for positive outcomes (correct answer, winning)
export const success = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

// Warning feedback for timer warnings
export const warning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

// Error feedback for negative outcomes (wrong answer, time expired)
export const error = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

// Selection change feedback
export const selection = () => {
  Haptics.selectionAsync();
};

/* eslint-disable no-undef */
import '@testing-library/react-native/extend-expect';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          replayAsync: jest.fn(),
          unloadAsync: jest.fn(),
        },
      }),
    },
    setAudioModeAsync: jest.fn(),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: {
      call: () => {},
      createAnimatedComponent: (component) => component,
      View: View,
      Text: require('react-native').Text,
      Image: require('react-native').Image,
      ScrollView: require('react-native').ScrollView,
      FlatList: require('react-native').FlatList,
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedProps: jest.fn(() => ({})),
    useDerivedValue: jest.fn((fn) => ({ value: fn() })),
    useAnimatedGestureHandler: jest.fn(),
    useAnimatedScrollHandler: jest.fn(),
    withTiming: jest.fn((toValue) => toValue),
    withSpring: jest.fn((toValue) => toValue),
    withDecay: jest.fn(),
    withDelay: jest.fn((_, animation) => animation),
    withSequence: jest.fn((...animations) => animations[0]),
    withRepeat: jest.fn((animation) => animation),
    interpolate: jest.fn(),
    Extrapolate: { CLAMP: 'clamp' },
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    createAnimatedComponent: (component) => component,
    FadeIn: { duration: jest.fn().mockReturnThis() },
    FadeOut: { duration: jest.fn().mockReturnThis() },
    SlideInUp: { duration: jest.fn().mockReturnThis() },
    SlideOutUp: { duration: jest.fn().mockReturnThis() },
    FadeInDown: { duration: jest.fn().mockReturnThis() },
    FadeOutDown: { duration: jest.fn().mockReturnThis() },
    Layout: { duration: jest.fn().mockReturnThis() },
  };
});

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
  signInAnonymously: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  onValue: jest.fn(),
  off: jest.fn(),
  push: jest.fn(),
  update: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {},
  },
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    type: 'wifi',
  }),
  refresh: jest.fn(),
}));

// Mock expo-store-review
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  requestReview: jest.fn().mockResolvedValue(undefined),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

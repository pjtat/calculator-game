// Theme constants extracted from v0 designs
export const Colors = {
  // Background
  background: '#0A0E1A',
  backgroundSecondary: '#1A1F2E',

  // Primary accent (Orange)
  primary: '#FF8C42',
  primaryForeground: '#0A0E1A',

  // Cards and inputs (Dark slate)
  card: '#3D4159',
  cardForeground: '#FFFFFF',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#8B92A6',
  textMuted: '#8B92A6',

  // Status colors
  success: '#10B981',
  error: '#EF4444',

  // Borders and inputs
  border: '#3D4159',
  input: '#3D4159',

  // Numeric rain colors
  rainNormal: '#FF8C42', // Orange (matching buttons)
  rainEasterEgg: '#FF8C42',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999, // For pill-shaped buttons
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

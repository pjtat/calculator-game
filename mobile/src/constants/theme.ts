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

// Shadow styles for depth
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

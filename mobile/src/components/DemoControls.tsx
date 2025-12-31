import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { advanceDemoMode } from '../services/firebase';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { DEMO_GAME_CODE } from '../services/demoData';

interface DemoControlsProps {
  gameCode: string;
}

export default function DemoControls({ gameCode }: DemoControlsProps) {
  // Only show in demo mode
  if (gameCode !== DEMO_GAME_CODE) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={advanceDemoMode}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>Next Demo Step →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: Colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
  },
});

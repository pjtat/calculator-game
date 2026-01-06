import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { moveToStandings, advanceToNextRound, calculateAndSubmitResults, moveToBestWorst } from '../services/firebase';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { DEMO_GAME_CODE, DEMO_ASKER, DEMO_PARTICIPANT, PLAY_WITH_BOTS } from '../services/demoData';
import { Game } from '../types/game';

interface DemoControlsProps {
  gameCode: string;
  game: Game | null;
}

export default function DemoControls({ gameCode, game }: DemoControlsProps) {
  // Only show in demo modes
  const isDemoMode = gameCode === DEMO_GAME_CODE || gameCode === DEMO_ASKER || gameCode === DEMO_PARTICIPANT || gameCode === PLAY_WITH_BOTS;
  if (!isDemoMode || !game) {
    return null;
  }

  // Determine demo mode label
  let demoModeLabel = 'Demo';
  if (gameCode === DEMO_ASKER) {
    demoModeLabel = 'Asker Demo';
  } else if (gameCode === DEMO_PARTICIPANT) {
    demoModeLabel = 'Participant Demo';
  } else if (gameCode === DEMO_GAME_CODE) {
    demoModeLabel = 'Legacy Demo';
  } else if (gameCode === PLAY_WITH_BOTS) {
    demoModeLabel = 'Play with Bots';
  }

  const handleNextScreen = async () => {
    try {
      // Determine next screen based on current status
      switch (game.status) {
        case 'guessing':
          // Force calculate results to advance from guessing
          console.log('Force advancing from guessing to results');
          await calculateAndSubmitResults(gameCode, game.currentRound);
          break;
        case 'results':
          // Results → Best/Worst Reveal
          await moveToBestWorst(gameCode);
          break;
        case 'best_worst_reveal':
          // Best/Worst → Standings
          await moveToStandings(gameCode);
          break;
        case 'standings':
          // Standings → End
          await advanceToNextRound(gameCode);
          break;
        default:
          console.log('Next button clicked but no action for status:', game.status);
          break;
      }
    } catch (error) {
      console.error('Error advancing demo:', error);
    }
  };

  // Show button on all screens during active gameplay (not waiting/ended)
  const shouldShowButton =
    game.status !== 'waiting' &&
    game.status !== 'ended' &&
    game.status !== 'question_entry';

  if (!shouldShowButton) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleNextScreen}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonLabel}>(Demo Only)</Text>
      <Text style={styles.buttonText}>Skip Screen {"-->"}</Text>
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
  buttonLabel: {
    color: Colors.primaryForeground,
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
    marginBottom: 2,
  },
  buttonText: {
    color: Colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
  },
});

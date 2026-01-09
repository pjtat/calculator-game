import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Modal } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import NumericRain from '../components/NumericRain';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';
import { initPlayWithBots } from '../services/firebase';
import { playBackgroundMusic } from '../utils/sounds';
import { BotDifficulty, DIFFICULTY_CONFIGS } from '../services/demoEngine';
import { APP_VERSION } from '../../../version.js';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const { width, height } = Dimensions.get('window');

// Responsive font sizes based on screen width
const TITLE_FONT_SIZE = Math.min(width * 0.11, 42);
const SUBTITLE_FONT_SIZE = Math.min(width * 0.045, 18);

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showBotsConfig, setShowBotsConfig] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState(9);
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>('medium');

  const roundOptions = [6, 9, 12, 15];
  const difficultyOptions: BotDifficulty[] = ['easy', 'medium', 'hard'];

  // Play background music when home screen is focused
  // Music continues through Create Game, Join Game, and How to Play screens
  // It stops when entering Lobby (game starts)
  useFocusEffect(
    useCallback(() => {
      playBackgroundMusic();
      // No cleanup - music persists until Lobby screen stops it
    }, [])
  );

  const handleVersionTap = () => {
    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    const newCount = tapCount + 1;
    setTapCount(newCount);

    console.log('Version tap count:', newCount);

    if (newCount === 3) {
      // Activate Play with Bots mode directly
      setTapCount(0);
      setShowBotsConfig(true);
    } else {
      // Reset count after 2.5 seconds if not reached 3
      tapTimeoutRef.current = setTimeout(() => {
        console.log('Resetting tap count');
        setTapCount(0);
      }, 2500);
    }
  };

  const handleStartBotsGame = () => {
    initPlayWithBots(selectedRounds, selectedDifficulty);
    setShowBotsConfig(false);
    navigation.navigate('Lobby', {
      gameCode: 'BOTPLAY',
      playerId: 'demo-user',
    });
  };

  return (
    <View style={styles.container}>
      {/* Numeric Rain Background */}
      <NumericRain />

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Calculator Game</Text>
          <Text style={styles.subtitle}>Don't be furthest away</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('CreateGame')}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Create Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('JoinGame')}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Join Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('HowToPlay')}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>How to Play</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Version - tap 3x for demo mode */}
      <TouchableOpacity
        onPress={handleVersionTap}
        activeOpacity={0.7}
        style={styles.versionContainer}
      >
        <Text style={styles.version}>
          v{APP_VERSION} {tapCount > 0 && `(${tapCount}/3)`}
        </Text>
      </TouchableOpacity>

      {/* Play with Bots Configuration Modal */}
      <Modal
        visible={showBotsConfig}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBotsConfig(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Play with Bots</Text>
            <Text style={styles.modalSubtitle}>
              Compete against 6 AI bots. Win rounds to ask questions!
            </Text>

            <Text style={styles.modalLabel}>Difficulty</Text>
            <View style={styles.roundOptionsContainer}>
              {difficultyOptions.map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.difficultyOption,
                    selectedDifficulty === diff && styles.roundOptionSelected,
                  ]}
                  onPress={() => setSelectedDifficulty(diff)}
                >
                  <Text
                    style={[
                      styles.roundOptionText,
                      selectedDifficulty === diff && styles.roundOptionTextSelected,
                    ]}
                  >
                    {DIFFICULTY_CONFIGS[diff].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.difficultyDescription}>
              {DIFFICULTY_CONFIGS[selectedDifficulty].description}
            </Text>

            <Text style={styles.modalLabel}>Number of Rounds</Text>
            <View style={styles.roundOptionsContainer}>
              {roundOptions.map((rounds) => (
                <TouchableOpacity
                  key={rounds}
                  style={[
                    styles.roundOption,
                    selectedRounds === rounds && styles.roundOptionSelected,
                  ]}
                  onPress={() => setSelectedRounds(rounds)}
                >
                  <Text
                    style={[
                      styles.roundOptionText,
                      selectedRounds === rounds && styles.roundOptionTextSelected,
                    ]}
                  >
                    {rounds}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowBotsConfig(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalStartButton}
                onPress={handleStartBotsGame}
              >
                <Text style={styles.modalStartButtonText}>Start Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    position: 'relative',
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    backgroundColor: 'rgba(10, 14, 26, 0.7)',
    paddingHorizontal: Math.max(Spacing.lg, width * 0.08),
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 10,
    maxWidth: width * 0.9,
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: 1,
    fontFamily: 'Orbitron_900Black',
  },
  subtitle: {
    fontSize: SUBTITLE_FONT_SIZE,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Orbitron_700Bold',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  versionContainer: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minWidth: 100,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  version: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  roundOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  roundOption: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyOption: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  roundOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  roundOptionText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  roundOptionTextSelected: {
    color: Colors.primary,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  modalStartButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalStartButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
});

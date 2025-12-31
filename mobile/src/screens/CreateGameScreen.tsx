import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';
import { createGame, signInAnonymous } from '../services/firebase';

type CreateGameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateGame'>;
};

export default function CreateGameScreen({ navigation }: CreateGameScreenProps) {
  const [nickname, setNickname] = useState('');
  const [roundsOption, setRoundsOption] = useState<'10' | '20' | 'custom'>('10');
  const [customRounds, setCustomRounds] = useState('');
  const [scoreOption, setScoreOption] = useState<'5' | '10' | 'custom'>('10');
  const [customScore, setCustomScore] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGame = async () => {
    // Validation
    if (nickname.trim().length < 2) {
      Alert.alert('Invalid Nickname', 'Nickname must be at least 2 characters long.');
      return;
    }

    if (nickname.trim().length > 15) {
      Alert.alert('Invalid Nickname', 'Nickname must be 15 characters or less.');
      return;
    }

    // Get rounds value
    const roundsValue = roundsOption === 'custom' ? parseInt(customRounds) : parseInt(roundsOption);
    if (isNaN(roundsValue) || roundsValue < 1 || roundsValue > 99) {
      Alert.alert('Invalid Rounds', 'Please enter a valid number of rounds (1-99).');
      return;
    }

    // Get score value
    const scoreValue = scoreOption === 'custom' ? parseInt(customScore) : parseInt(scoreOption);
    if (isNaN(scoreValue) || scoreValue < 1 || scoreValue > 99) {
      Alert.alert('Invalid Score', 'Please enter a valid score target (1-99).');
      return;
    }

    setIsLoading(true);

    try {
      // Sign in anonymously first
      const playerId = await signInAnonymous();

      // Create the game with rounds mode (both values are stored but rounds mode is used)
      const gameCode = await createGame(playerId, nickname.trim(), 'rounds', roundsValue);

      // Navigate to lobby
      navigation.replace('Lobby', { gameCode, playerId });
    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert('Error', 'Failed to create game. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create Game</Text>
      </View>

      {/* Nickname Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Your Nickname</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter nickname"
          placeholderTextColor={Colors.textSecondary}
          value={nickname}
          onChangeText={setNickname}
          maxLength={15}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Rounds Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Rounds</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionButton, roundsOption === '10' && styles.optionButtonActive]}
            onPress={() => setRoundsOption('10')}
          >
            <Text
              style={[
                styles.optionButtonText,
                roundsOption === '10' && styles.optionButtonTextActive,
              ]}
            >
              10
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, roundsOption === '20' && styles.optionButtonActive]}
            onPress={() => setRoundsOption('20')}
          >
            <Text
              style={[
                styles.optionButtonText,
                roundsOption === '20' && styles.optionButtonTextActive,
              ]}
            >
              20
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, roundsOption === 'custom' && styles.optionButtonActive]}
            onPress={() => setRoundsOption('custom')}
          >
            <Text
              style={[
                styles.optionButtonText,
                roundsOption === 'custom' && styles.optionButtonTextActive,
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>
        {roundsOption === 'custom' && (
          <TextInput
            style={[styles.input, styles.customInput]}
            placeholder="Enter number of rounds"
            placeholderTextColor={Colors.textSecondary}
            value={customRounds}
            onChangeText={setCustomRounds}
            keyboardType="number-pad"
            maxLength={2}
          />
        )}
      </View>

      {/* Score Target Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Score Target</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionButton, scoreOption === '5' && styles.optionButtonActive]}
            onPress={() => setScoreOption('5')}
          >
            <Text
              style={[
                styles.optionButtonText,
                scoreOption === '5' && styles.optionButtonTextActive,
              ]}
            >
              5
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, scoreOption === '10' && styles.optionButtonActive]}
            onPress={() => setScoreOption('10')}
          >
            <Text
              style={[
                styles.optionButtonText,
                scoreOption === '10' && styles.optionButtonTextActive,
              ]}
            >
              10
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, scoreOption === 'custom' && styles.optionButtonActive]}
            onPress={() => setScoreOption('custom')}
          >
            <Text
              style={[
                styles.optionButtonText,
                scoreOption === 'custom' && styles.optionButtonTextActive,
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>
        {scoreOption === 'custom' && (
          <TextInput
            style={[styles.input, styles.customInput]}
            placeholder="Enter score target"
            placeholderTextColor={Colors.textSecondary}
            value={customScore}
            onChangeText={setCustomScore}
            keyboardType="number-pad"
            maxLength={2}
          />
        )}
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, isLoading && styles.createButtonDisabled]}
        onPress={handleCreateGame}
        disabled={isLoading}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.primaryForeground} />
        ) : (
          <Text style={styles.createButtonText}>Create Game</Text>
        )}
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        disabled={isLoading}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl * 2,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 36,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customInput: {
    marginTop: Spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  optionButtonTextActive: {
    color: Colors.primaryForeground,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
  backButton: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButtonText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
});

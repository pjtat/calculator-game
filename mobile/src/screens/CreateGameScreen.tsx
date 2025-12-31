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
  const [gameMode, setGameMode] = useState<'rounds' | 'score'>('rounds');
  const [targetValue, setTargetValue] = useState('10');
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

    const targetNum = parseInt(targetValue);
    if (isNaN(targetNum) || targetNum < 1 || targetNum > 99) {
      Alert.alert('Invalid Target', 'Please enter a number between 1 and 99.');
      return;
    }

    setIsLoading(true);

    try {
      // Sign in anonymously first
      const playerId = await signInAnonymous();

      // Create the game
      const gameCode = await createGame(playerId, nickname.trim(), gameMode, targetNum);

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
        <Text style={styles.subtitle}>Set up your multiplayer game</Text>
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
        <Text style={styles.hint}>2-15 characters</Text>
      </View>

      {/* Game Mode Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Game Mode</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, gameMode === 'rounds' && styles.toggleButtonActive]}
            onPress={() => setGameMode('rounds')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                gameMode === 'rounds' && styles.toggleButtonTextActive,
              ]}
            >
              Rounds
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, gameMode === 'score' && styles.toggleButtonActive]}
            onPress={() => setGameMode('score')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                gameMode === 'score' && styles.toggleButtonTextActive,
              ]}
            >
              Score Target
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Target Value Input */}
      <View style={styles.section}>
        <Text style={styles.label}>
          {gameMode === 'rounds' ? 'Number of Rounds' : 'Target Score'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={gameMode === 'rounds' ? 'e.g., 10' : 'e.g., 10'}
          placeholderTextColor={Colors.textSecondary}
          value={targetValue}
          onChangeText={setTargetValue}
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={styles.hint}>
          {gameMode === 'rounds'
            ? 'Play for this many rounds'
            : 'First player to reach this score wins'}
        </Text>
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
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
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
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  toggleButtonTextActive: {
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

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
import { joinGame, signInAnonymous } from '../services/firebase';
import { sanitizeUserInput } from '../utils/sanitize';

type JoinGameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'JoinGame'>;
};

export default function JoinGameScreen({ navigation }: JoinGameScreenProps) {
  const [gameCode, setGameCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinGame = async () => {
    // Validation
    if (gameCode.trim().length !== 6) {
      Alert.alert('Invalid Game Code', 'Game code must be 6 characters.');
      return;
    }

    // Sanitize and validate nickname
    const nicknameResult = sanitizeUserInput(nickname, 'nickname');
    if (!nicknameResult.isValid) {
      Alert.alert('Invalid Nickname', nicknameResult.error || 'Please enter a valid nickname.');
      return;
    }
    const sanitizedNickname = nicknameResult.sanitized;

    setIsLoading(true);

    try {
      // Sign in anonymously first
      const playerId = await signInAnonymous();

      // Join the game
      await joinGame(gameCode.trim().toUpperCase(), playerId, sanitizedNickname);

      // Navigate to lobby
      navigation.replace('Lobby', { gameCode: gameCode.trim().toUpperCase(), playerId });
    } catch (error: any) {
      console.error('Error joining game:', error);

      // Show specific error messages
      if (error.message === 'Game not found') {
        Alert.alert('Game Not Found', 'No game exists with that code. Please check and try again.');
      } else if (error.message === 'Nickname already taken') {
        Alert.alert('Nickname Taken', 'This nickname is already in use. Please choose another.');
      } else {
        Alert.alert('Error', 'Failed to join game. Please try again.');
      }

      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Join Game</Text>
      </View>

      {/* Game Code Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Game Code</Text>
        <TextInput
          style={[styles.input, styles.gameCodeInput]}
          placeholder="ABCD12"
          placeholderTextColor={Colors.textSecondary}
          value={gameCode}
          onChangeText={(text) => setGameCode(text.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Text style={styles.hint}>6-character code from your friend</Text>
      </View>

      {/* Nickname Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Your Nickname</Text>
        <TextInput
          style={styles.input}
          placeholder="Big Numbas Guy"
          placeholderTextColor={Colors.textSecondary}
          value={nickname}
          onChangeText={setNickname}
          maxLength={15}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Join Button */}
      <TouchableOpacity
        style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
        onPress={handleJoinGame}
        disabled={isLoading}
        activeOpacity={0.9}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.primaryForeground} />
        ) : (
          <Text style={styles.joinButtonText}>Join Game</Text>
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
  gameCodeInput: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    letterSpacing: 4,
    textAlign: 'center',
  },
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  joinButton: {
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
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
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

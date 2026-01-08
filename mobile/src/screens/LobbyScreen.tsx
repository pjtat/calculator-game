import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';
import { listenToGame, startGame } from '../services/firebase';
import { Game, Player } from '../types/game';
import DemoControls from '../components/DemoControls';
import { stopBackgroundMusic } from '../utils/sounds';

type LobbyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lobby'>;
  route: RouteProp<RootStackParamList, 'Lobby'>;
};

export default function LobbyScreen({ navigation, route }: LobbyScreenProps) {
  const { gameCode, playerId } = route.params;
  const [game, setGame] = useState<Game | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Stop background music when entering lobby (game is starting)
    stopBackgroundMusic();

    // Listen to game updates
    const unsubscribe = listenToGame(gameCode, (updatedGame) => {
      if (updatedGame) {
        setGame(updatedGame);

        // If game status changed to 'question_entry', navigate to game screen
        if (updatedGame.status === 'question_entry') {
          navigation.replace('Game', { gameCode, playerId });
        }
      } else {
        // Game doesn't exist
        Alert.alert('Game Not Found', 'This game no longer exists.');
        navigation.replace('Home');
      }
    });

    return () => unsubscribe();
  }, [gameCode, playerId, navigation]);

  const handleStartGame = async () => {
    if (!game) return;

    const playerCount = Object.keys(game.players).length;

    if (playerCount < 3) {
      Alert.alert('Not Enough Players', 'You need at least 3 players to start the game.');
      return;
    }

    setIsStarting(true);

    try {
      await startGame(gameCode);
      // Navigation will happen automatically via the listener
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
      setIsStarting(false);
    }
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my Calculator Game! Code: ${gameCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!game) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const players = Object.entries(game.players).map(([id, player]) => ({
    id,
    ...player,
  }));

  const isHost = game.config.hostId === playerId;
  const playerCount = players.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Game Lobby</Text>

        {/* Game Code */}
        <View style={styles.gameCodeContainer}>
          <Text style={styles.gameCodeLabel}>Game Code</Text>
          <TouchableOpacity style={styles.gameCodeBox} onPress={handleShareCode}>
            <Text style={styles.gameCode}>{gameCode}</Text>
          </TouchableOpacity>
          <Text style={styles.gameCodeHint}>Tap to share</Text>
        </View>

        {/* Game Settings */}
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsText}>
            {game.config.gameMode === 'rounds'
              ? `${game.config.targetRounds} Rounds`
              : `First to ${game.config.targetScore}`}
          </Text>
          <Text style={styles.settingsSeparator}>•</Text>
          <Text style={styles.settingsText}>{game.config.timerDuration}s Timer</Text>
        </View>
      </View>

      {/* Players List */}
      <View style={styles.playersContainer}>
        <Text style={styles.playersHeader}>
          Players {playerCount < 3 && '(Need at least 3)'}
        </Text>
        <ScrollView style={styles.playersList} contentContainerStyle={styles.playersListContent}>
          {players.map((player, index) => (
            <View key={player.id} style={styles.playerItem}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerNumber}>{index + 1}</Text>
                <Text style={styles.playerName}>{player.nickname}</Text>
              </View>
              {player.isHost && (
                <View style={styles.hostBadge}>
                  <Text style={styles.hostBadgeText}>HOST</Text>
                </View>
              )}
              {player.id === playerId && !player.isHost && (
                <Text style={styles.youIndicator}>You</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Start Button or Waiting */}
      {isHost ? (
        <TouchableOpacity
          style={[styles.startButton, (isStarting || playerCount < 3) && styles.startButtonDisabled]}
          onPress={handleStartGame}
          disabled={isStarting || playerCount < 3}
          activeOpacity={0.9}
        >
          {isStarting ? (
            <ActivityIndicator color={Colors.primaryForeground} />
          ) : (
            <Text style={styles.startButtonText}>Start Game</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.waitingContainer}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.waitingText}>Waiting for host to start...</Text>
        </View>
      )}

      {/* Demo Controls */}
      <DemoControls gameCode={gameCode} game={game} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    paddingTop: Spacing.xxl * 2,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  gameCodeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  gameCodeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  gameCodeBox: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  gameCode: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    letterSpacing: 6,
  },
  gameCodeHint: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  settingsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingsText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  settingsSeparator: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  playersContainer: {
    flex: 1,
  },
  playersHeader: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  playersList: {
    flex: 1,
  },
  playersListContent: {
    gap: Spacing.sm,
  },
  playerItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  playerNumber: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    width: 24,
  },
  playerName: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: FontWeights.medium,
  },
  hostBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  hostBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.primaryForeground,
  },
  youIndicator: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  startButton: {
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
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
  waitingContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  waitingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});

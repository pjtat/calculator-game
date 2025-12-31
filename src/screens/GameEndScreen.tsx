import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';
import { listenToGame } from '../services/firebase';
import { Game, Player } from '../types/game';

type GameEndScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GameEnd'>;
  route: RouteProp<RootStackParamList, 'GameEnd'>;
};

export default function GameEndScreen({ navigation, route }: GameEndScreenProps) {
  const { gameCode, playerId } = route.params;
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    const unsubscribe = listenToGame(gameCode, (updatedGame) => {
      if (updatedGame) {
        setGame(updatedGame);
      }
    });

    return () => unsubscribe();
  }, [gameCode]);

  if (!game) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  // Get sorted players by score
  const sortedPlayers = Object.entries(game.players)
    .map(([id, player]) => ({
      id,
      ...player,
    }))
    .sort((a, b) => b.score - a.score);

  const winner = sortedPlayers[0];
  const runnerUp = sortedPlayers[1];
  const isCurrentPlayerWinner = winner?.id === playerId;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Winner Announcement */}
        <View style={styles.winnerSection}>
          <Text style={styles.winnerLabel}>🏆 Winner 🏆</Text>
          <Text style={styles.winnerName}>{winner?.nickname}</Text>
          <Text style={styles.winnerScore}>{winner?.score} points</Text>
        </View>

        {/* Runner Up */}
        {runnerUp && (
          <View style={styles.runnerUpSection}>
            <Text style={styles.runnerUpText}>
              🥈 Runner-up: {runnerUp.nickname} ({runnerUp.score} points)
            </Text>
          </View>
        )}

        {/* Game Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Game Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Rounds:</Text>
            <Text style={styles.summaryValue}>{game.currentRound}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Game Mode:</Text>
            <Text style={styles.summaryValue}>
              {game.config.gameMode === 'rounds'
                ? `${game.config.targetRounds} Rounds`
                : `First to ${game.config.targetScore}`}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Players:</Text>
            <Text style={styles.summaryValue}>{Object.keys(game.players).length}</Text>
          </View>
        </View>

        {/* Final Standings */}
        <View style={styles.standingsSection}>
          <Text style={styles.standingsTitle}>Final Standings</Text>
          {sortedPlayers.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.standingItem,
                index === 0 && styles.standingFirst,
                index === 1 && styles.standingSecond,
                index === 2 && styles.standingThird,
                player.id === playerId && styles.standingCurrent,
              ]}
            >
              <View style={styles.standingRank}>
                <Text style={styles.standingRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.standingInfo}>
                <Text style={styles.standingName}>{player.nickname}</Text>
                {player.id === playerId && (
                  <Text style={styles.standingYou}>(You)</Text>
                )}
              </View>
              <Text style={styles.standingScore}>{player.score}</Text>
            </View>
          ))}
        </View>

        {/* Congratulations Message */}
        {isCurrentPlayerWinner && (
          <View style={styles.congratsSection}>
            <Text style={styles.congratsText}>
              🎉 Congratulations! You won! 🎉
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl * 2,
  },
  winnerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  winnerLabel: {
    fontSize: 24,
    marginBottom: Spacing.md,
  },
  winnerName: {
    fontSize: 42,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  winnerScore: {
    fontSize: FontSizes.xl,
    color: Colors.text,
  },
  runnerUpSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  runnerUpText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  summarySection: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text,
  },
  standingsSection: {
    marginBottom: Spacing.xl,
  },
  standingsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  standingItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  standingFirst: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD70020',
  },
  standingSecond: {
    borderColor: '#C0C0C0',
    backgroundColor: '#C0C0C020',
  },
  standingThird: {
    borderColor: '#CD7F32',
    backgroundColor: '#CD7F3220',
  },
  standingCurrent: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  standingRank: {
    width: 40,
    alignItems: 'center',
  },
  standingRankText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
  },
  standingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  standingName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text,
  },
  standingYou: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  standingScore: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  congratsSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  congratsText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    textAlign: 'center',
  },
  buttonsContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  homeButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
});

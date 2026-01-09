import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../constants/theme';
import { listenToGame } from '../services/firebase';
import { Game } from '../types/game';
import Confetti from '../components/Confetti';
import ToiletRain from '../components/ToiletRain';
import AnimatedNumber from '../components/AnimatedNumber';
import HallOfShame from '../components/HallOfShame';
import { playGameEndMusic, stopBackgroundMusic } from '../utils/sounds';

type GameEndScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GameEnd'>;
  route: RouteProp<RootStackParamList, 'GameEnd'>;
};

export default function GameEndScreen({ navigation, route }: GameEndScreenProps) {
  const { gameCode, playerId } = route.params;
  const [game, setGame] = useState<Game | null>(null);

  // Play background music on game end screen
  useFocusEffect(
    useCallback(() => {
      playGameEndMusic();

      return () => {
        stopBackgroundMusic();
      };
    }, [])
  );

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
  const isCurrentPlayerWinner = winner?.id === playerId;

  // Find all players tied for last place (but not if they're also the winner)
  const lastPlaceScore = sortedPlayers[sortedPlayers.length - 1]?.score;
  const losers = sortedPlayers.filter(
    (p) => p.score === lastPlaceScore && p.id !== winner?.id
  );
  const isCurrentPlayerLoser = losers.some((l) => l.id === playerId);

  const handleShareResults = async () => {
    const standingsText = sortedPlayers
      .map((p, i) => `${i + 1}. ${p.nickname}: ${p.score} pts`)
      .join('\n');

    const message = `🎮 Calculator Game Results!\n\n🏆 Winner: ${winner?.nickname} (${winner?.score} pts)\n${losers.length > 0 ? `🚽 Loser${losers.length > 1 ? 's' : ''}: ${losers.map(l => l.nickname).join(', ')}\n` : ''}\n📊 Final Standings:\n${standingsText}\n\nPlay Calculator Game!`;

    try {
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Failed to share results');
    }
  };

  const handlePlayAgain = () => {
    navigation.navigate('CreateGame');
  };

  return (
    <View style={styles.container}>
      {/* Confetti for winner */}
      {isCurrentPlayerWinner && <Confetti count={60} duration={4000} />}
      {/* Toilet rain for the loser - everyone sees it */}
      {losers.length > 0 && <ToiletRain count={40} duration={4500} />}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Winner Announcement */}
        <View style={styles.winnerSection}>
          <Text style={styles.winnerLabel}>🏆 Winner 🏆</Text>
          <Text style={styles.winnerName}>{winner?.nickname}</Text>
          <AnimatedNumber
            value={winner?.score || 0}
            style={styles.winnerScore}
            suffix=" points"
            duration={800}
          />
        </View>

        {/* Last Place - Fun Shaming */}
        {losers.length > 0 && (
          <View style={styles.loserSection}>
            <Text style={styles.loserLabel}>🚽 In the Toilet 🚽</Text>
            <Text style={styles.loserName}>
              {losers.map(p => p.nickname).join(', ')}
            </Text>
            <Text style={styles.loserSubtext}>Certified LOSER{losers.length > 1 ? 'S' : ''}</Text>
            <AnimatedNumber
              value={lastPlaceScore || 0}
              style={styles.loserScore}
              suffix=" points"
              duration={800}
            />
          </View>
        )}

        {/* Congratulations Message */}
        {isCurrentPlayerWinner && (
          <View style={styles.congratsSection}>
            <Text style={styles.congratsText}>
              🎉 Congratulations! You won! 🎉
            </Text>
          </View>
        )}

        {/* Shame Message for Last Place */}
        {isCurrentPlayerLoser && (
          <View style={styles.shameSection}>
            <Text style={styles.shameText}>
              💀 That's YOU. You're the loser. 💀
            </Text>
          </View>
        )}

        {/* Hall of Shame - Worst answers from the game */}
        {game.roundResults && Object.keys(game.roundResults).length > 0 && (
          <HallOfShame
            roundResults={game.roundResults}
            players={game.players}
          />
        )}

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
                losers.some(l => l.id === player.id) && styles.standingLast,
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
              <AnimatedNumber
                value={player.score}
                style={styles.standingScore}
                duration={600}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.playAgainButton}
          onPress={handlePlayAgain}
        >
          <Text style={styles.playAgainButtonText}>Play Again</Text>
        </TouchableOpacity>
        <View style={styles.secondaryButtonsRow}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareResults}
          >
            <Text style={styles.shareButtonText}>Share Results</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: Spacing.lg,
    backgroundColor: '#22C55E20',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  winnerLabel: {
    fontSize: 24,
    marginBottom: Spacing.md,
    color: Colors.text,
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
  loserSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    backgroundColor: '#8B451320',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  loserLabel: {
    fontSize: 24,
    marginBottom: Spacing.sm,
    color: Colors.text,
  },
  loserName: {
    fontSize: 36,
    fontWeight: FontWeights.bold,
    color: '#FF4444',
    marginBottom: Spacing.xs,
  },
  loserSubtext: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: '#FF4444',
    marginBottom: Spacing.sm,
  },
  loserScore: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
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
  standingLast: {
    borderColor: '#8B4513',
    backgroundColor: '#8B451320',
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
  shameSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  shameText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: '#FF4444',
    textAlign: 'center',
  },
  buttonsContainer: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  playAgainButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.md,
  },
  playAgainButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  shareButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text,
  },
  homeButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  homeButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text,
  },
});

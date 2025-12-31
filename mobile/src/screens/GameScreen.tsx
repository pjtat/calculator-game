import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../constants/theme';
import {
  listenToGame,
  submitQuestion,
  submitGuess,
  calculateAndSubmitResults,
  advanceToNextRound,
} from '../services/firebase';
import { validateQuestion } from '../services/gemini';
import { Game, RoundRanking } from '../types/game';
import Calculator from '../components/Calculator';
import Timer from '../components/Timer';
import DemoControls from '../components/DemoControls';

type GameScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

export default function GameScreen({ navigation, route }: GameScreenProps) {
  const { gameCode, playerId } = route.params;
  const [game, setGame] = useState<Game | null>(null);

  // Question Entry state
  const [questionText, setQuestionText] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validatedAnswer, setValidatedAnswer] = useState<number | null>(null);
  const [validatedUnits, setValidatedUnits] = useState<string | undefined>(undefined);

  // Guessing state
  const [guessValue, setGuessValue] = useState<number | null>(null);
  const [guessCalculation, setGuessCalculation] = useState('');
  const [hasSubmittedGuess, setHasSubmittedGuess] = useState(false);

  // Results state
  const [isCalculatingResults, setIsCalculatingResults] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToGame(gameCode, (updatedGame) => {
      if (updatedGame) {
        setGame(updatedGame);

        // Check if game has ended
        if (updatedGame.status === 'ended') {
          navigation.replace('GameEnd', { gameCode, playerId });
        }

        // Auto-calculate results when all players have guessed
        if (updatedGame.status === 'guessing' && shouldAutoCalculateResults(updatedGame)) {
          handleTimerExpire();
        }

        // Reset guess submission state when moving to next round
        if (updatedGame.status === 'question_entry') {
          setHasSubmittedGuess(false);
          setGuessValue(null);
          setGuessCalculation('');
        }
      }
    });

    return () => unsubscribe();
  }, [gameCode, playerId, navigation]);

  const shouldAutoCalculateResults = (g: Game): boolean => {
    const guesses = g.guesses[`round_${g.currentRound}`];
    if (!guesses) return false;

    const playerIds = Object.keys(g.players);
    const guesserIds = playerIds.filter((id) => id !== g.currentQuestion?.askedBy);

    return guesserIds.every((id) => guesses[id] !== undefined);
  };

  // ========== Question Entry Functions ==========

  const handleValidateQuestion = async () => {
    if (questionText.trim().length < 5) {
      Alert.alert('Invalid Question', 'Please enter a longer question.');
      return;
    }

    setIsValidating(true);

    try {
      const result = await validateQuestion(questionText.trim());

      if (result.isValid && result.answer !== undefined) {
        setValidatedAnswer(result.answer);
        setValidatedUnits(result.units);
        const unitsText = result.units ? ` ${result.units}` : '';
        Alert.alert(
          'Question Validated',
          `The answer is: ${result.answer.toLocaleString()}${unitsText}\n\nDoes this look correct?`,
          [
            { text: 'No, Edit Question', style: 'cancel' },
            {
              text: 'Yes, Use This',
              onPress: () => handleConfirmQuestion(result.answer!, result.units),
            },
          ]
        );
      } else {
        Alert.alert(
          'Invalid Question',
          result.errorMessage || 'This question cannot be validated. Please try a different question.'
        );
      }
    } catch (error) {
      console.error('Error validating question:', error);
      Alert.alert('Error', 'Failed to validate question. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmQuestion = async (answer: number, units?: string) => {
    try {
      await submitQuestion(gameCode, playerId, questionText.trim(), answer, units);
      setQuestionText('');
      setValidatedAnswer(null);
      setValidatedUnits(undefined);
    } catch (error) {
      console.error('Error submitting question:', error);
      Alert.alert('Error', 'Failed to submit question. Please try again.');
    }
  };

  // ========== Guessing Functions ==========

  const handleCalculationChange = (value: number | null, calculation: string) => {
    setGuessValue(value);
    setGuessCalculation(calculation);
  };

  const handleSubmitGuess = async () => {
    if (guessValue === null) {
      Alert.alert('No Calculation', 'Please complete a calculation before submitting.');
      return;
    }

    try {
      await submitGuess(gameCode, game!.currentRound, playerId, guessValue, guessCalculation);
      setHasSubmittedGuess(true);
    } catch (error) {
      console.error('Error submitting guess:', error);
      Alert.alert('Error', 'Failed to submit guess. Please try again.');
    }
  };

  const handleTimerExpire = async () => {
    if (!game) return;

    // If player hasn't submitted, submit null guess
    if (!hasSubmittedGuess && game.currentQuestion?.askedBy !== playerId) {
      await submitGuess(gameCode, game.currentRound, playerId, null, '');
      setHasSubmittedGuess(true);
    }

    // Calculate results (only one player should do this)
    if (game.currentQuestion?.askedBy === playerId && !isCalculatingResults) {
      setIsCalculatingResults(true);
      try {
        await calculateAndSubmitResults(gameCode, game.currentRound);
      } catch (error) {
        console.error('Error calculating results:', error);
      } finally {
        setIsCalculatingResults(false);
      }
    }
  };

  // ========== Results Functions ==========

  const handleNextRound = async () => {
    try {
      await advanceToNextRound(gameCode);
    } catch (error) {
      console.error('Error advancing to next round:', error);
      Alert.alert('Error', 'Failed to start next round. Please try again.');
    }
  };

  // ========== Render Functions ==========

  if (!game) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const isAsker = game.currentQuestion?.askedBy === playerId;

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {game.status === 'question_entry' && isAsker && (
          <QuestionEntryView
            questionText={questionText}
            setQuestionText={setQuestionText}
            isValidating={isValidating}
            onValidate={handleValidateQuestion}
          />
        )}

        {game.status === 'question_entry' && !isAsker && (
          <WaitingForQuestionView askerName={game.players[game.nextAsker]?.nickname || 'Player'} />
        )}

        {game.status === 'guessing' && !isAsker && (
          <GuessingView
            question={game.currentQuestion?.text || ''}
            units={game.currentQuestion?.units}
            duration={game.config.timerDuration}
            hasSubmitted={hasSubmittedGuess}
            onCalculationChange={handleCalculationChange}
            onSubmit={handleSubmitGuess}
            onTimerExpire={handleTimerExpire}
          />
        )}

        {game.status === 'guessing' && isAsker && (
          <AskerWaitingView
            question={game.currentQuestion?.text || ''}
            answer={game.currentQuestion?.answer || 0}
            duration={game.config.timerDuration}
            game={game}
            onTimerExpire={handleTimerExpire}
          />
        )}

        {game.status === 'results' && (
          <ResultsView
            game={game}
            playerId={playerId}
            isWinner={game.roundResults[`round_${game.currentRound}`]?.winner === playerId}
            onNextRound={handleNextRound}
          />
        )}
      </ScrollView>

      {/* Demo Controls */}
      <DemoControls gameCode={gameCode} />
    </SafeAreaView>
  );
}

// ========== Sub-Components ==========

function QuestionEntryView({ questionText, setQuestionText, isValidating, onValidate }: any) {
  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>Your Turn - Ask a Question</Text>
      <Text style={styles.phaseSubtitle}>
        Ask a quantifiable question with a numeric answer
      </Text>

      <TextInput
        style={styles.questionInput}
        placeholder="e.g., How many restaurants are in NYC?"
        placeholderTextColor={Colors.textSecondary}
        value={questionText}
        onChangeText={setQuestionText}
        multiline={true}
        maxLength={200}
      />

      <TouchableOpacity
        style={[styles.validateButton, isValidating && styles.buttonDisabled]}
        onPress={onValidate}
        disabled={isValidating}
      >
        {isValidating ? (
          <ActivityIndicator color={Colors.primaryForeground} />
        ) : (
          <Text style={styles.validateButtonText}>Validate Question</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function WaitingForQuestionView({ askerName }: any) {
  return (
    <View style={styles.phaseContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.waitingText}>Waiting for {askerName} to ask a question...</Text>
    </View>
  );
}

function GuessingView({
  question,
  units,
  duration,
  hasSubmitted,
  onCalculationChange,
  onSubmit,
  onTimerExpire,
}: any) {
  return (
    <View style={styles.guessingContainer}>
      <Text style={styles.questionText}>{question}</Text>
      {units && <Text style={styles.unitsText}>{units}</Text>}

      <View style={styles.divider} />

      <View style={styles.timerContainer}>
        <Timer duration={duration} onExpire={onTimerExpire} />
      </View>

      {!hasSubmitted ? (
        <>
          <View style={styles.calculatorWrapper}>
            <Calculator onCalculationChange={onCalculationChange} />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
            <Text style={styles.submitButtonText}>🔒</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.submittedContainer}>
          <Text style={styles.submittedText}>✓ Guess submitted</Text>
          <ActivityIndicator size="large" color={Colors.primary} style={styles.submittedSpinner} />
          <Text style={styles.submittedSubtext}>Waiting for other players...</Text>
        </View>
      )}
    </View>
  );
}

function AskerWaitingView({ question, answer, duration, game, onTimerExpire }: any) {
  const guesses = game.guesses[`round_${game.currentRound}`] || {};
  const totalGuessers = Object.keys(game.players).length - 1;
  const submitted = Object.keys(guesses).length;

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.questionText}>{question}</Text>
      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>Correct Answer:</Text>
        <Text style={styles.answerValue}>{answer.toLocaleString()}</Text>
      </View>

      <View style={styles.timerContainer}>
        <Timer duration={duration} onExpire={onTimerExpire} />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {submitted} / {totalGuessers} players submitted
        </Text>
      </View>
    </View>
  );
}

function ResultsView({ game, playerId, isWinner, onNextRound }: any) {
  const roundResult = game.roundResults[`round_${game.currentRound}`];
  if (!roundResult) return null;

  const canContinue = game.nextAsker === playerId;

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.resultsTitle}>Round Results</Text>

      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>Correct Answer:</Text>
        <Text style={styles.answerValue}>{roundResult.correctAnswer.toLocaleString()}</Text>
      </View>

      <ScrollView style={styles.rankingsList}>
        {roundResult.rankings.map((ranking: RoundRanking, index: number) => {
          const player = game.players[ranking.playerId];
          const isCurrentPlayer = ranking.playerId === playerId;

          return (
            <View
              key={ranking.playerId}
              style={[
                styles.rankingItem,
                index === 0 && styles.rankingWinner,
                index === roundResult.rankings.length - 1 && styles.rankingLoser,
                isCurrentPlayer && styles.rankingCurrent,
              ]}
            >
              <View style={styles.rankingInfo}>
                <Text style={styles.rankingName}>{player.nickname}</Text>
                <Text style={styles.rankingGuess}>
                  {ranking.guess !== null ? ranking.guess.toLocaleString() : 'No guess'}
                </Text>
              </View>
              <View style={styles.rankingPoints}>
                <Text
                  style={[
                    styles.rankingPointsText,
                    ranking.pointsAwarded > 0 && styles.pointsPositive,
                    ranking.pointsAwarded < 0 && styles.pointsNegative,
                  ]}
                >
                  {ranking.pointsAwarded > 0 ? '+' : ''}
                  {ranking.pointsAwarded}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {canContinue ? (
        <TouchableOpacity style={styles.nextButton} onPress={onNextRound}>
          <Text style={styles.nextButtonText}>Next Round</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.waitingNextContainer}>
          <Text style={styles.waitingNextText}>
            Waiting for {game.players[game.nextAsker]?.nickname} to continue...
          </Text>
        </View>
      )}
    </View>
  );
}

// ========== Styles ==========

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
    padding: Spacing.md,
    flexGrow: 1,
  },
  phaseContainer: {
    flex: 1,
  },
  guessingContainer: {
    paddingBottom: Spacing.xl,
  },
  calculatorWrapper: {
    marginBottom: Spacing.sm,
  },
  phaseTitle: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  phaseSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  questionInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  validateButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  validateButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  waitingText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  questionText: {
    fontSize: 22,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  unitsText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: Spacing.md,
    width: '100%',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButtonText: {
    fontSize: 40,
  },
  submittedContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    justifyContent: 'center',
    flex: 1,
  },
  submittedText: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  submittedSpinner: {
    marginVertical: Spacing.xl,
  },
  submittedSubtext: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  answerContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  answerLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  answerValue: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  progressContainer: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  progressText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  rankingsList: {
    marginBottom: Spacing.lg,
  },
  rankingItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankingWinner: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF5020',
  },
  rankingLoser: {
    borderColor: '#FF4444',
    backgroundColor: '#FF444420',
  },
  rankingCurrent: {
    borderWidth: 2,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  rankingGuess: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  rankingPoints: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  rankingPointsText: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  pointsPositive: {
    color: '#4CAF50',
  },
  pointsNegative: {
    color: '#FF4444',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
  waitingNextContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  waitingNextText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
});

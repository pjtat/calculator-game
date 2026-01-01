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
  Linking,
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
  moveToStandings,
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
  const [preferredUnits, setPreferredUnits] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validatedAnswer, setValidatedAnswer] = useState<number | null>(null);
  const [validatedUnits, setValidatedUnits] = useState<string | undefined>(undefined);
  const [showAnswerPreview, setShowAnswerPreview] = useState(false);
  const [isCustomAnswerMode, setIsCustomAnswerMode] = useState(false);
  const [customAnswer, setCustomAnswer] = useState('');
  const [customUnits, setCustomUnits] = useState('');

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
    if (!g.guesses) return false;
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
    setShowAnswerPreview(false);
    setIsCustomAnswerMode(false);

    try {
      const result = await validateQuestion(questionText.trim(), preferredUnits.trim() || undefined);

      if (result.isValid && result.answer !== undefined) {
        setValidatedAnswer(result.answer);
        setValidatedUnits(result.units);
        setShowAnswerPreview(true);
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

  const handleAcceptAnswer = () => {
    if (validatedAnswer !== null) {
      handleConfirmQuestion(validatedAnswer, validatedUnits);
    }
  };

  const handleRejectAnswer = () => {
    setIsCustomAnswerMode(true);
    setCustomAnswer('');
    setCustomUnits(preferredUnits || validatedUnits || '');
  };

  const handleSubmitCustomAnswer = () => {
    const parsedAnswer = parseFloat(customAnswer.replace(/,/g, ''));
    if (isNaN(parsedAnswer)) {
      Alert.alert('Invalid Answer', 'Please enter a valid number.');
      return;
    }
    handleConfirmQuestion(parsedAnswer, customUnits || undefined);
  };

  const handleResetQuestion = () => {
    setShowAnswerPreview(false);
    setIsCustomAnswerMode(false);
    setValidatedAnswer(null);
    setValidatedUnits(undefined);
    setCustomAnswer('');
    setCustomUnits('');
  };

  const openGoogleSearch = () => {
    const query = encodeURIComponent(questionText.trim());
    Linking.openURL(`https://www.google.com/search?q=${query}`);
  };

  const handleConfirmQuestion = async (answer: number, units?: string) => {
    try {
      await submitQuestion(gameCode, playerId, questionText.trim(), answer, units);
      setQuestionText('');
      setPreferredUnits('');
      setValidatedAnswer(null);
      setValidatedUnits(undefined);
      setShowAnswerPreview(false);
      setIsCustomAnswerMode(false);
      setCustomAnswer('');
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
      Alert.alert('No Number Entered', 'Please enter a number before submitting.');
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

  const handleViewStandings = async () => {
    try {
      await moveToStandings(gameCode);
    } catch (error) {
      console.error('Error moving to standings:', error);
      Alert.alert('Error', 'Failed to view standings. Please try again.');
    }
  };

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
  const isNextAsker = game.nextAsker === playerId;

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {game.status === 'question_entry' && isNextAsker && (
          <QuestionEntryView
            questionText={questionText}
            setQuestionText={setQuestionText}
            preferredUnits={preferredUnits}
            setPreferredUnits={setPreferredUnits}
            isValidating={isValidating}
            onValidate={handleValidateQuestion}
            showAnswerPreview={showAnswerPreview}
            validatedAnswer={validatedAnswer}
            validatedUnits={validatedUnits}
            isCustomAnswerMode={isCustomAnswerMode}
            customAnswer={customAnswer}
            setCustomAnswer={setCustomAnswer}
            customUnits={customUnits}
            setCustomUnits={setCustomUnits}
            onAccept={handleAcceptAnswer}
            onReject={handleRejectAnswer}
            onSubmitCustom={handleSubmitCustomAnswer}
            onReset={handleResetQuestion}
            onGoogleSearch={openGoogleSearch}
          />
        )}

        {game.status === 'question_entry' && !isNextAsker && (
          <WaitingForQuestionView askerName={game.players[game.nextAsker]?.nickname || 'Player'} />
        )}

        {game.status === 'guessing' && !isAsker && (
          <GuessingView
            question={game.currentQuestion?.text || ''}
            units={game.currentQuestion?.units}
            askerName={game.players[game.currentQuestion?.askedBy || '']?.nickname || 'Unknown'}
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
            onViewStandings={handleViewStandings}
          />
        )}

        {game.status === 'standings' && (
          <StandingsView
            game={game}
            playerId={playerId}
            onNextRound={handleNextRound}
          />
        )}
      </ScrollView>

      {/* Demo Controls */}
      <DemoControls gameCode={gameCode} navigation={navigation} />
    </SafeAreaView>
  );
}

// ========== Sub-Components ==========

function QuestionEntryView({
  questionText,
  setQuestionText,
  preferredUnits,
  setPreferredUnits,
  isValidating,
  onValidate,
  showAnswerPreview,
  validatedAnswer,
  validatedUnits,
  isCustomAnswerMode,
  customAnswer,
  setCustomAnswer,
  customUnits,
  setCustomUnits,
  onAccept,
  onReject,
  onSubmitCustom,
  onReset,
  onGoogleSearch,
}: any) {
  // Show custom answer input mode
  if (isCustomAnswerMode) {
    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseTitle}>Enter Your Answer</Text>
        <Text style={styles.phaseSubtitle}>
          What's the correct answer to your question?
        </Text>

        <View style={styles.questionPreview}>
          <Text style={styles.questionPreviewText}>{questionText}</Text>
        </View>

        <TextInput
          style={styles.customAnswerInput}
          placeholder="Enter the correct number"
          placeholderTextColor={Colors.textSecondary}
          value={customAnswer}
          onChangeText={setCustomAnswer}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.unitsInput}
          placeholder="feet, people, dollars, etc."
          placeholderTextColor={Colors.textSecondary}
          value={customUnits}
          onChangeText={setCustomUnits}
          maxLength={30}
        />

        <TouchableOpacity style={styles.searchLink} onPress={onGoogleSearch}>
          <Text style={styles.searchLinkText}>See Google Results</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onReset}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={onSubmitCustom}>
            <Text style={styles.primaryButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show answer preview mode
  if (showAnswerPreview && validatedAnswer !== null) {
    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseTitle}>Verify Answer</Text>

        <View style={styles.questionPreview}>
          <Text style={styles.questionPreviewText}>{questionText}</Text>
        </View>

        <View style={styles.foundAnswerContainer}>
          <Text style={styles.foundAnswerLabel}>Answer:</Text>
          <Text style={styles.foundAnswerValue}>{validatedAnswer.toLocaleString()}</Text>
          {validatedUnits && <Text style={styles.foundAnswerUnits}>{validatedUnits}</Text>}
        </View>

        <Text style={styles.confirmText}>Does this look correct?</Text>

        <TouchableOpacity style={styles.searchLink} onPress={onGoogleSearch}>
          <Text style={styles.searchLinkText}>See Google Results</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onReject}>
            <Text style={styles.secondaryButtonText}>Enter My Own</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={onAccept}>
            <Text style={styles.primaryButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.editQuestionButton} onPress={onReset}>
          <Text style={styles.editQuestionText}>Edit Question</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default: question entry mode
  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>Your Turn - Ask a Question</Text>
      <Text style={styles.phaseSubtitle}>
        Ask a quantifiable question with a numeric answer
      </Text>

      <TextInput
        style={styles.questionInput}
        placeholder="How many restaurants are in NYC, etc."
        placeholderTextColor={Colors.textSecondary}
        value={questionText}
        onChangeText={setQuestionText}
        multiline={true}
        maxLength={200}
      />

      <TextInput
        style={styles.unitsInput}
        placeholder="feet, people, dollars, etc."
        placeholderTextColor={Colors.textSecondary}
        value={preferredUnits}
        onChangeText={setPreferredUnits}
        maxLength={30}
      />

      <TouchableOpacity
        style={[styles.validateButton, isValidating && styles.buttonDisabled]}
        onPress={onValidate}
        disabled={isValidating || questionText.trim().length < 5}
      >
        {isValidating ? (
          <ActivityIndicator color={Colors.primaryForeground} />
        ) : (
          <Text style={styles.validateButtonText}>Find Answer</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function WaitingForQuestionView({ askerName }: any) {
  return (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.waitingText}>Waiting for {askerName} to ask a question...</Text>
    </View>
  );
}

function GuessingView({
  question,
  units,
  askerName,
  duration,
  hasSubmitted,
  onCalculationChange,
  onSubmit,
  onTimerExpire,
}: any) {
  const snarkyComments = [
    "That wouldn't be my first guess…",
    "I'm sure you'll be closer this time..",
    "Are you sure you read the question right?",
    "Bold choice...",
    "Interesting strategy there.",
    "Let's see how this plays out...",
  ];

  const [snarkyComment] = React.useState(
    snarkyComments[Math.floor(Math.random() * snarkyComments.length)]
  );

  return (
    <View style={styles.guessingContainer}>
      <Text style={styles.questionText}>{question}</Text>
      <Text style={styles.unitsText}>
        {units || 'Number'} | {askerName}
      </Text>

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
          <Text style={styles.submittedSubtext}>{snarkyComment}</Text>
        </View>
      )}
    </View>
  );
}

function AskerWaitingView({ question, answer, duration, game, onTimerExpire }: any) {
  const guesses = game.guesses?.[`round_${game.currentRound}`] || {};
  const totalGuessers = Object.keys(game.players).length - 1;
  const submitted = Object.keys(guesses).length;
  const units = game.currentQuestion?.units;

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.questionText}>{question}</Text>

      <View style={styles.divider} />

      <View style={styles.timerContainer}>
        <Timer duration={duration} onExpire={onTimerExpire} />
      </View>

      <View style={styles.answerContainer}>
        <Text style={styles.answerLabel}>Correct Answer:</Text>
        <Text style={styles.answerValue}>{answer.toLocaleString()}</Text>
        {units && <Text style={styles.answerUnits}>{units}</Text>}
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {submitted} / {totalGuessers} players submitted
        </Text>
      </View>
    </View>
  );
}

function ResultsView({ game, playerId, isWinner, onViewStandings }: any) {
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
        <TouchableOpacity style={styles.nextButton} onPress={onViewStandings}>
          <Text style={styles.nextButtonText}>View Standings</Text>
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

function StandingsView({ game, playerId, onNextRound }: any) {
  const canContinue = game.nextAsker === playerId;

  // Create standings sorted by score
  const standings = Object.entries(game.players)
    .map(([id, player]: [string, any]) => ({
      playerId: id,
      nickname: player.nickname,
      score: player.score,
    }))
    .sort((a, b) => b.score - a.score);

  // Determine win condition text
  const winConditionText = game.config.gameMode === 'rounds'
    ? `First to ${game.config.targetRounds} rounds`
    : `First to ${game.config.targetScore} points`;

  return (
    <View style={styles.phaseContainer}>
      <Text style={styles.standingsTitle}>Overall Standings</Text>

      <View style={styles.standingsHeader}>
        <Text style={styles.standingsRound}>Round {game.currentRound}</Text>
        <Text style={styles.standingsWinCondition}>{winConditionText}</Text>
      </View>

      <ScrollView style={styles.standingsList}>
        {standings.map((standing, index) => {
          const isCurrentPlayer = standing.playerId === playerId;
          const isFirst = index === 0;
          const isLast = index === standings.length - 1;

          return (
            <View
              key={standing.playerId}
              style={[
                styles.standingItem,
                isFirst && styles.standingFirst,
                isLast && standings.length > 1 && styles.standingLast,
                isCurrentPlayer && styles.standingCurrent,
              ]}
            >
              <View style={styles.standingRank}>
                <Text style={styles.standingRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.standingInfo}>
                <View style={styles.standingNameRow}>
                  <Text style={styles.standingName}>{standing.nickname}</Text>
                  {isFirst && <Text style={styles.standingEmoji}>👑</Text>}
                  {isLast && standings.length > 1 && <Text style={styles.standingEmoji}>💩</Text>}
                </View>
              </View>
              <View style={styles.standingScore}>
                <Text style={styles.standingScoreText}>{standing.score}</Text>
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
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: Spacing.md,
  },
  unitsInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
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
  questionPreview: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questionPreviewText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontStyle: 'italic',
  },
  foundAnswerContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  foundAnswerLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  foundAnswerValue: {
    fontSize: 36,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  foundAnswerUnits: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  confirmText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  searchLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  searchLinkText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.primaryForeground,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  editQuestionButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  editQuestionText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  customAnswerInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.xl,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.sm,
    textAlign: 'center',
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
    borderColor: '#3B82F6',
  },
  answerLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  answerValue: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: '#3B82F6',
  },
  answerUnits: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
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
  standingsTitle: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  standingsHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  standingsRound: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  standingsWinCondition: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  standingsList: {
    marginBottom: Spacing.lg,
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
  standingLast: {
    borderColor: '#8B4513',
    backgroundColor: '#8B451320',
  },
  standingCurrent: {
    borderWidth: 2,
  },
  standingRank: {
    width: 40,
    alignItems: 'center',
  },
  standingRankText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  standingInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  standingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  standingName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  standingEmoji: {
    fontSize: 20,
    marginLeft: Spacing.sm,
  },
  standingScore: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  standingScoreText: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
});

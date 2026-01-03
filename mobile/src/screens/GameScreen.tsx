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
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights, Shadows } from '../constants/theme';
import {
  listenToGame,
  submitQuestion,
  submitGuess,
  calculateAndSubmitResults,
  moveToStandings,
  advanceToNextRound,
} from '../services/firebase';
import { getDatabase, ref, update } from 'firebase/database';
import { validateQuestion, convertUnits } from '../services/gemini';
import { Game, RoundRanking } from '../types/game';
import Calculator from '../components/Calculator';
import Timer from '../components/Timer';
import DemoControls from '../components/DemoControls';
import AnswerReveal from '../components/AnswerReveal';
import BestWorstReveal from '../components/BestWorstReveal';
import BinaryLoader from '../components/BinaryLoader';
import AnimatedNumber from '../components/AnimatedNumber';
import { success, mediumTap } from '../utils/haptics';

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
  const [showAnswerPreview, setShowAnswerPreview] = useState(false);
  const [isCustomAnswerMode, setIsCustomAnswerMode] = useState(false);
  const [customAnswer, setCustomAnswer] = useState('');
  const [customUnits, setCustomUnits] = useState('');
  const [showApiErrorFallback, setShowApiErrorFallback] = useState(false);
  const [isChangingUnits, setIsChangingUnits] = useState(false);
  const [newUnitsInput, setNewUnitsInput] = useState('');
  const [isConvertingUnits, setIsConvertingUnits] = useState(false);

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
          handleTimerExpire(updatedGame);
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
    setShowApiErrorFallback(false);

    try {
      const result = await validateQuestion(questionText.trim());

      if (result.isValid && result.answer !== undefined) {
        setValidatedAnswer(result.answer);
        setValidatedUnits(result.units);
        setShowAnswerPreview(true);
      } else if (result.isApiError) {
        // API error - show fallback UI with Google search link and manual entry
        setIsCustomAnswerMode(true);
        setShowApiErrorFallback(true);
        setCustomAnswer('');
        setCustomUnits('');
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
    setCustomUnits(validatedUnits || '');
  };

  const handleSubmitCustomAnswer = () => {
    const parsedAnswer = parseFloat(customAnswer.replace(/,/g, ''));
    if (isNaN(parsedAnswer)) {
      Alert.alert('Invalid Answer', 'Please enter a valid number.');
      return;
    }
    handleConfirmQuestion(parsedAnswer, customUnits || undefined);
  };

  const handleChangeUnits = () => {
    setIsChangingUnits(true);
    setNewUnitsInput('');
  };

  const handleConvertUnits = async () => {
    if (!newUnitsInput.trim() || validatedAnswer === null) {
      return;
    }

    setIsConvertingUnits(true);

    try {
      const result = await convertUnits(
        questionText,
        validatedAnswer,
        validatedUnits || '',
        newUnitsInput.trim()
      );

      if (result.success && result.answer !== undefined) {
        setValidatedAnswer(result.answer);
        setValidatedUnits(result.units);
        setIsChangingUnits(false);
        setNewUnitsInput('');
      } else {
        Alert.alert(
          'Conversion Failed',
          result.errorMessage || 'Unable to convert to these units. Try different units or enter your own answer.'
        );
      }
    } catch (error) {
      console.error('Error converting units:', error);
      Alert.alert('Error', 'Failed to convert units. Please try again.');
    } finally {
      setIsConvertingUnits(false);
    }
  };

  const handleCancelChangeUnits = () => {
    setIsChangingUnits(false);
    setNewUnitsInput('');
  };

  const handleResetQuestion = () => {
    setShowAnswerPreview(false);
    setIsCustomAnswerMode(false);
    setValidatedAnswer(null);
    setValidatedUnits(undefined);
    setCustomAnswer('');
    setCustomUnits('');
    setShowApiErrorFallback(false);
    setIsChangingUnits(false);
    setNewUnitsInput('');
    setIsConvertingUnits(false);
  };

  const openGoogleSearch = () => {
    const query = encodeURIComponent(questionText.trim());
    Linking.openURL(`https://www.google.com/search?q=${query}`);
  };

  const handleConfirmQuestion = async (answer: number, units?: string) => {
    try {
      await submitQuestion(gameCode, playerId, questionText.trim(), answer, units);
      setQuestionText('');
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
      success(); // Haptic feedback on successful submission
      await submitGuess(gameCode, game!.currentRound, playerId, guessValue, guessCalculation);
      setHasSubmittedGuess(true);
    } catch (error) {
      console.error('Error submitting guess:', error);
      Alert.alert('Error', 'Failed to submit guess. Please try again.');
    }
  };

  const handleTimerExpire = async (gameOverride?: Game) => {
    const currentGame = gameOverride || game;
    if (!currentGame) return;

    // If player hasn't submitted, submit null guess
    if (!hasSubmittedGuess && currentGame.currentQuestion?.askedBy !== playerId) {
      await submitGuess(gameCode, currentGame.currentRound, playerId, null, '');
      setHasSubmittedGuess(true);
    }

    // Calculate results (only one player should do this)
    if (currentGame.currentQuestion?.askedBy === playerId && !isCalculatingResults) {
      setIsCalculatingResults(true);
      try {
        await calculateAndSubmitResults(gameCode, currentGame.currentRound);
      } catch (error) {
        console.error('Error calculating results:', error);
      } finally {
        setIsCalculatingResults(false);
      }
    }
  };

  // ========== Results Functions ==========

  const handleContinueFromResults = async () => {
    try {
      const database = getDatabase();
      await update(ref(database, `games/${gameCode}`), {
        status: 'best_worst_reveal',
      });
    } catch (error) {
      console.error('Error moving to best/worst:', error);
      Alert.alert('Error', 'Failed to continue. Please try again.');
    }
  };

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
            showApiErrorFallback={showApiErrorFallback}
            isChangingUnits={isChangingUnits}
            newUnitsInput={newUnitsInput}
            setNewUnitsInput={setNewUnitsInput}
            isConvertingUnits={isConvertingUnits}
            onChangeUnits={handleChangeUnits}
            onConvertUnits={handleConvertUnits}
            onCancelChangeUnits={handleCancelChangeUnits}
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
            game={game}
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

        {game.status === 'results' && game.roundResults[`round_${game.currentRound}`] && (
          <AnswerReveal
            correctAnswer={game.roundResults[`round_${game.currentRound}`].correctAnswer}
            questionText={game.currentQuestion?.text || ''}
            rankings={game.roundResults[`round_${game.currentRound}`].rankings}
            players={game.players}
            currentPlayerId={playerId}
            units={game.currentQuestion?.units}
            onComplete={handleContinueFromResults}
            canContinue={game.nextAsker === playerId}
            nextAskerName={game.players[game.nextAsker]?.nickname}
          />
        )}

        {game.status === 'best_worst_reveal' && game.roundResults[`round_${game.currentRound}`] && (
          <BestWorstReveal
            bestPlayer={{
              id: game.roundResults[`round_${game.currentRound}`].rankings[0]?.playerId || '',
              name: game.players[game.roundResults[`round_${game.currentRound}`].rankings[0]?.playerId]?.nickname || 'Unknown',
              guess: game.roundResults[`round_${game.currentRound}`].rankings[0]?.guess ?? 0,
              percentError: game.roundResults[`round_${game.currentRound}`].rankings[0]?.percentageError ?? null,
            }}
            worstPlayer={{
              id: game.roundResults[`round_${game.currentRound}`].rankings[game.roundResults[`round_${game.currentRound}`].rankings.length - 1]?.playerId || '',
              name: game.players[game.roundResults[`round_${game.currentRound}`].rankings[game.roundResults[`round_${game.currentRound}`].rankings.length - 1]?.playerId]?.nickname || 'Unknown',
              guess: game.roundResults[`round_${game.currentRound}`].rankings[game.roundResults[`round_${game.currentRound}`].rankings.length - 1]?.guess ?? 0,
              percentError: game.roundResults[`round_${game.currentRound}`].rankings[game.roundResults[`round_${game.currentRound}`].rankings.length - 1]?.percentageError ?? null,
            }}
            correctAnswer={game.roundResults[`round_${game.currentRound}`].correctAnswer}
            questionText={game.currentQuestion?.text || ''}
            units={game.currentQuestion?.units}
            snarkyRemark={game.roundResults[`round_${game.currentRound}`].snarkyRemark || null}
            currentPlayerId={playerId}
            onComplete={handleViewStandings}
            canContinue={game.nextAsker === playerId}
            nextAskerName={game.players[game.nextAsker]?.nickname}
            gameCode={gameCode}
            currentRound={game.currentRound}
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
      <DemoControls gameCode={gameCode} game={game} />
    </SafeAreaView>
  );
}

// ========== Sub-Components ==========

function QuestionEntryView({
  questionText,
  setQuestionText,
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
  showApiErrorFallback,
  isChangingUnits,
  newUnitsInput,
  setNewUnitsInput,
  isConvertingUnits,
  onChangeUnits,
  onConvertUnits,
  onCancelChangeUnits,
}: any) {
  // Show custom answer input mode
  if (isCustomAnswerMode) {
    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseTitle}>Enter Your Answer</Text>
        {showApiErrorFallback ? (
          <Text style={styles.apiErrorText}>
            Automatic answers not available right now. Look up the answer and enter it below.
          </Text>
        ) : (
          <Text style={styles.phaseSubtitle}>
            What's the correct answer to your question?
          </Text>
        )}

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

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={onGoogleSearch}>
            <Text style={styles.linkText}>See Google Results</Text>
          </TouchableOpacity>
        </View>

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
    // Show unit conversion input mode
    if (isChangingUnits) {
      return (
        <View style={styles.phaseContainer}>
          <Text style={styles.phaseTitle}>Change Units</Text>
          <Text style={styles.phaseSubtitle}>
            Enter the units you want the answer in
          </Text>

          <View style={styles.currentAnswerPreview}>
            <Text style={styles.currentAnswerLabel}>Current:</Text>
            <Text style={styles.currentAnswerText}>
              {validatedAnswer.toLocaleString()} {validatedUnits || ''}
            </Text>
          </View>

          <TextInput
            style={styles.unitsInput}
            placeholder="e.g., meters, kilometers, feet..."
            placeholderTextColor={Colors.textSecondary}
            value={newUnitsInput}
            onChangeText={setNewUnitsInput}
            maxLength={30}
            autoFocus={true}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onCancelChangeUnits}
              disabled={isConvertingUnits}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, (isConvertingUnits || !newUnitsInput.trim()) && styles.buttonDisabled]}
              onPress={onConvertUnits}
              disabled={isConvertingUnits || !newUnitsInput.trim()}
            >
              {isConvertingUnits ? (
                <ActivityIndicator color={Colors.primaryForeground} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Convert</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Normal answer preview mode
    return (
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseTitle}>Verify Answer</Text>

        <Text style={styles.questionText}>{questionText}</Text>

        <TouchableOpacity style={styles.editQuestionButton} onPress={onReset}>
          <Text style={styles.editQuestionText}>Edit Question</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <View style={styles.foundAnswerContainer}>
          <Text style={styles.foundAnswerLabel}>Answer:</Text>
          <Text style={styles.foundAnswerValue}>{validatedAnswer.toLocaleString()}</Text>
          {validatedUnits && <Text style={styles.foundAnswerUnits}>{validatedUnits}</Text>}
        </View>

        <Text style={styles.confirmText}>Does this look correct?</Text>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={onChangeUnits}>
            <Text style={styles.linkText}>Change Units</Text>
          </TouchableOpacity>
          <Text style={styles.linkSeparator}> | </Text>
          <TouchableOpacity onPress={onGoogleSearch}>
            <Text style={styles.linkText}>See Google Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onReject}>
            <Text style={styles.secondaryButtonText}>Enter My Own</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={onAccept}>
            <Text style={styles.primaryButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
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
      <BinaryLoader />
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
  game,
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

  const guesses = game?.guesses?.[`round_${game?.currentRound}`] || {};
  const totalGuessers = game ? Object.keys(game.players).length - 1 : 0;
  const submitted = Object.keys(guesses).length;

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

      {hasSubmitted && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {submitted} / {totalGuessers} players submitted
          </Text>
        </View>
      )}

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
          const difference = ranking.guess !== null
            ? Math.abs(ranking.guess - roundResult.correctAnswer)
            : null;

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
                <Text style={styles.rankingName}>
                  {player.nickname}
                  <Text style={styles.rankingGuess}>
                    {' - '}
                    {ranking.guess !== null ? ranking.guess.toLocaleString() : 'No guess'}
                  </Text>
                  {difference !== null && (
                    <Text style={styles.rankingDifference}>
                      {' '}(off by {difference.toLocaleString()})
                    </Text>
                  )}
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
                {standing.score !== 0 && (
                  <AnimatedNumber
                    value={standing.score}
                    style={styles.standingScoreText}
                    prefix={standing.score > 0 ? '+' : ''}
                    duration={600}
                  />
                )}
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
  apiErrorText: {
    fontSize: FontSizes.md,
    color: '#FFA500',
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
    ...Shadows.md,
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questionPreviewText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  foundAnswerContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
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
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  linkText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xs,
  },
  currentAnswerPreview: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentAnswerLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  currentAnswerText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  confirmText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
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
    ...Shadows.md,
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
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
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
    borderColor: '#FFA500',
  },
  answerLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  answerValue: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: Colors.text,
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
    borderColor: '#3B82F6',
  },
  rankingLoser: {
    borderColor: '#FF4444',
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
  },
  rankingGuess: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.normal,
    color: Colors.text,
  },
  rankingDifference: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.normal,
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
    color: '#3B82F6',
  },
  pointsNegative: {
    color: '#FF4444',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.md,
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

import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, signInAnonymously, Auth, getAuth } from 'firebase/auth';
// @ts-expect-error - getReactNativePersistence is available in React Native bundle
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import { getDatabase, ref, set, get, onValue, off, push, update, Database } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Game, Player, Guess, CurrentQuestion, RoundResult, EmojiReaction, BotDifficulty } from '../types/game';
import { generateSnarkyRemark } from './gemini';
import {
  DEMO_GAME_CODE,
  getDemoGame,
  getDemoGameQuestionEntry,
  getDemoGameWaitingForQuestion,
  getDemoGameGuessing,
  getDemoGameAskerWaiting,
  getDemoGameResults,
  getDemoGameBestWorstReveal,
  getDemoGameStandings,
  getDemoGameEnd,
  DEMO_ASKER,
  DEMO_PARTICIPANT,
  DEMO_USER_ID,
  PLAY_WITH_BOTS,
  getDemoAskerLobby,
  getDemoParticipantLobby,
  getPlayWithBotsLobby,
} from './demoData';
import {
  BOT_PLAYERS,
  generateBotGuess,
  generateBotCalculation,
  getRandomDemoQuestion,
  isBot,
} from './demoEngine';
import { generateTriviaQuestion } from './gemini';

// Legacy demo mode state (keep for existing tests)
let demoGameState: Game = getDemoGame('waiting');
let demoGameListeners: Array<(game: Game) => void> = [];

// New demo mode states
let demoAskerState: Game = getDemoAskerLobby();
let demoParticipantState: Game = getDemoParticipantLobby();
let demoAskerListeners: Array<(game: Game) => void> = [];
let demoParticipantListeners: Array<(game: Game) => void> = [];

// Play with Bots mode state
let playWithBotsState: Game = getPlayWithBotsLobby(9);
let playWithBotsListeners: Array<(game: Game) => void> = [];
let playWithBotsPreviousQuestions: string[] = []; // Track asked questions to avoid repeats

// Firebase configuration from app.config.ts extra (populated via environment variables)
const extra = Constants.expoConfig?.extra;

// Validate required environment variables
const requiredEnvVars = {
  firebaseApiKey: extra?.firebaseApiKey,
  firebaseAuthDomain: extra?.firebaseAuthDomain,
  firebaseDatabaseUrl: extra?.firebaseDatabaseUrl,
  firebaseProjectId: extra?.firebaseProjectId,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0 && !__DEV__) {
  console.error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
  console.error('Please ensure your .env file is configured or EAS Secrets are set.');
}

const firebaseConfig = {
  apiKey: extra?.firebaseApiKey ?? '',
  authDomain: extra?.firebaseAuthDomain ?? '',
  databaseURL: extra?.firebaseDatabaseUrl ?? '',
  projectId: extra?.firebaseProjectId ?? '',
};

// Initialize Firebase (handle hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with AsyncStorage persistence
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Auth already initialized (hot reload), get existing instance
  auth = getAuth(app);
}

const database: Database = getDatabase(app);

// ==================== Authentication ====================

export const signInAnonymous = async (): Promise<string> => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user.uid;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
};

// ==================== Game Code Generation ====================

const generateGameCode = (): string => {
  // Generate 6-character alphanumeric code, excluding confusing characters (0/O, 1/I/l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ==================== Game Creation ====================

export const createGame = async (
  hostId: string,
  hostNickname: string,
  gameMode: 'rounds' | 'score',
  targetValue: number,
  timerDuration: number = 45
): Promise<string> => {
  try {
    // Generate unique game code
    let gameCode = generateGameCode();
    let gameExists = true;

    // Ensure code is unique
    while (gameExists) {
      const gameRef = ref(database, `games/${gameCode}`);
      const snapshot = await get(gameRef);
      if (!snapshot.exists()) {
        gameExists = false;
      } else {
        gameCode = generateGameCode();
      }
    }

    // Create game object
    const game: Game = {
      config: {
        gameMode,
        ...(gameMode === 'rounds' ? { targetRounds: targetValue } : { targetScore: targetValue }),
        timerDuration,
        createdAt: Date.now(),
        hostId,
      },
      status: 'waiting',
      currentRound: 0,
      players: {
        [hostId]: {
          nickname: hostNickname,
          score: 0,
          isHost: true,
          joinedAt: Date.now(),
        },
      },
      guesses: {},
      roundResults: {},
      nextAsker: hostId,
    };

    // Write to Firebase
    await set(ref(database, `games/${gameCode}`), game);

    return gameCode;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

// ==================== Join Game ====================

export const joinGame = async (
  gameCode: string,
  playerId: string,
  nickname: string
): Promise<boolean> => {
  try {
    const gameRef = ref(database, `games/${gameCode}`);
    const snapshot = await get(gameRef);

    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }

    const game = snapshot.val() as Game;

    // Check if nickname is already taken
    const nicknames = Object.values(game.players).map((p) => p.nickname.toLowerCase());
    if (nicknames.includes(nickname.toLowerCase())) {
      throw new Error('Nickname already taken');
    }

    // Add player to game
    const player: Player = {
      nickname,
      score: 0,
      isHost: false,
      joinedAt: Date.now(),
    };

    await set(ref(database, `games/${gameCode}/players/${playerId}`), player);

    return true;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

// ==================== Start Game ====================

export const startGame = async (gameCode: string): Promise<void> => {
  // Legacy demo mode
  if (gameCode === DEMO_GAME_CODE) {
    updateDemoGame(getDemoGameQuestionEntry());
    return;
  }

  // Asker demo mode - user will ask the question
  if (gameCode === DEMO_ASKER) {
    demoAskerState = {
      ...demoAskerState,
      status: 'question_entry',
      currentRound: 1,
    };
    updateDemoAsker(demoAskerState);
    return;
  }

  // Participant demo mode - bot will ask the question
  if (gameCode === DEMO_PARTICIPANT) {
    demoParticipantState = {
      ...demoParticipantState,
      status: 'question_entry',
      currentRound: 1,
    };
    updateDemoParticipant(demoParticipantState);

    // After 2 seconds, bot asks a question
    setTimeout(() => {
      const question = getRandomDemoQuestion();
      demoParticipantState = {
        ...demoParticipantState,
        status: 'guessing',
        currentRound: 1,
        currentQuestion: question,
        guesses: {
          round_1: {},
        },
      };
      updateDemoParticipant(demoParticipantState);
    }, 2000);
    return;
  }

  // Play with Bots mode
  if (gameCode === PLAY_WITH_BOTS) {
    playWithBotsState = {
      ...playWithBotsState,
      status: 'question_entry',
      currentRound: 1,
    };
    updatePlayWithBots(playWithBotsState);

    // If first asker is a bot, generate a question
    if (isBot(playWithBotsState.nextAsker)) {
      await handleBotAskQuestion();
    }
    return;
  }

  try {
    await update(ref(database, `games/${gameCode}`), {
      status: 'question_entry',
      currentRound: 1,
    });
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

// ==================== Question Submission ====================

export const submitQuestion = async (
  gameCode: string,
  playerId: string,
  questionText: string,
  answer: number,
  units?: string
): Promise<void> => {
  const question: CurrentQuestion = {
    text: questionText,
    answer,
    units,
    askedBy: playerId,
    submittedAt: Date.now(),
  };

  // Asker demo mode - user asked the question, immediately populate all bot guesses
  if (gameCode === DEMO_ASKER && playerId === DEMO_USER_ID) {
    const botGuesses: { [key: string]: Guess } = {};

    // Generate all bot guesses immediately
    BOT_PLAYERS.forEach(bot => {
      const guess = generateBotGuess(answer, bot);
      const calculation = generateBotCalculation(guess);
      botGuesses[bot.id] = {
        value: guess,
        calculation,
        submittedAt: Date.now(),
      };
    });

    demoAskerState = {
      ...demoAskerState,
      currentQuestion: question,
      status: 'guessing',
      currentRound: 1,
      guesses: {
        round_1: botGuesses,
      },
    };
    updateDemoAsker(demoAskerState);
    return;
  }

  // Play with Bots mode - user asked a question
  if (gameCode === PLAY_WITH_BOTS && playerId === DEMO_USER_ID) {
    // Track the question to avoid repeats
    playWithBotsPreviousQuestions.push(questionText);

    // Capture round number for closures
    const currentRound = playWithBotsState.currentRound;
    const roundKey = `round_${currentRound}`;

    // First, update state with the question and empty guesses
    playWithBotsState = {
      ...playWithBotsState,
      currentQuestion: question,
      status: 'guessing',
      guesses: {
        ...playWithBotsState.guesses,
        [roundKey]: {},
      },
      isBotThinking: false,
    };
    updatePlayWithBots(playWithBotsState);

    // Then stagger bot guesses one by one
    const difficulty = playWithBotsState.botDifficulty || 'medium';
    BOT_PLAYERS.forEach((bot, index) => {
      setTimeout(() => {
        // Safety check: make sure we're still on the same round
        if (playWithBotsState.currentRound !== currentRound) {
          return;
        }

        const botGuess = generateBotGuess(answer, bot, difficulty);
        const botCalculation = generateBotCalculation(botGuess);

        const currentGuesses = playWithBotsState.guesses[roundKey] || {};
        playWithBotsState = {
          ...playWithBotsState,
          guesses: {
            ...playWithBotsState.guesses,
            [roundKey]: {
              ...currentGuesses,
              [bot.id]: {
                value: botGuess,
                calculation: botCalculation,
                submittedAt: Date.now(),
              },
            },
          },
        };
        updatePlayWithBots(playWithBotsState);
      }, (index + 1) * 600); // Stagger by 600ms each
    });

    return;
  }

  try {
    await update(ref(database, `games/${gameCode}`), {
      currentQuestion: question,
      status: 'guessing',
    });
  } catch (error) {
    console.error('Error submitting question:', error);
    throw error;
  }
};

// ==================== Submit Guess ====================

export const submitGuess = async (
  gameCode: string,
  roundNumber: number,
  playerId: string,
  value: number | null,
  calculation: string
): Promise<void> => {
  const guess: Guess = {
    value,
    calculation,
    submittedAt: value !== null ? Date.now() : null,
  };

  // Participant demo mode - user submitted guess, immediately populate all bot guesses
  if (gameCode === DEMO_PARTICIPANT && playerId === DEMO_USER_ID) {
    const correctAnswer = demoParticipantState.currentQuestion?.answer || 0;
    const askerId = demoParticipantState.currentQuestion?.askedBy || '';

    // Get all bots except the asker
    const guessingBots = BOT_PLAYERS.filter(bot => bot.id !== askerId);

    // Populate all guesses immediately
    const allGuesses: { [key: string]: Guess } = {
      [DEMO_USER_ID]: guess,
    };

    // Generate all bot guesses immediately
    guessingBots.forEach(bot => {
      const botGuess = generateBotGuess(correctAnswer, bot);
      const botCalculation = generateBotCalculation(botGuess);
      allGuesses[bot.id] = {
        value: botGuess,
        calculation: botCalculation,
        submittedAt: Date.now(),
      };
    });

    demoParticipantState = {
      ...demoParticipantState,
      guesses: {
        round_1: allGuesses,
      },
    };
    updateDemoParticipant(demoParticipantState);
    return;
  }

  // Play with Bots mode - user submitted guess
  if (gameCode === PLAY_WITH_BOTS && playerId === DEMO_USER_ID) {
    const correctAnswer = playWithBotsState.currentQuestion?.answer || 0;
    const askerId = playWithBotsState.currentQuestion?.askedBy || '';

    // Capture round number for closures
    const currentRound = playWithBotsState.currentRound;
    const roundKey = `round_${roundNumber}`;

    // Get all bots except the asker
    const guessingBots = BOT_PLAYERS.filter(bot => bot.id !== askerId);

    // First, add just the user's guess
    playWithBotsState = {
      ...playWithBotsState,
      guesses: {
        ...playWithBotsState.guesses,
        [roundKey]: {
          [DEMO_USER_ID]: guess,
        },
      },
    };
    updatePlayWithBots(playWithBotsState);

    // Then stagger bot guesses one by one
    const difficulty = playWithBotsState.botDifficulty || 'medium';
    guessingBots.forEach((bot, index) => {
      setTimeout(() => {
        // Safety check: make sure we're still on the same round
        if (playWithBotsState.currentRound !== currentRound) {
          return;
        }

        const botGuess = generateBotGuess(correctAnswer, bot, difficulty);
        const botCalculation = generateBotCalculation(botGuess);

        const currentGuesses = playWithBotsState.guesses[roundKey] || {};
        playWithBotsState = {
          ...playWithBotsState,
          guesses: {
            ...playWithBotsState.guesses,
            [roundKey]: {
              ...currentGuesses,
              [bot.id]: {
                value: botGuess,
                calculation: botCalculation,
                submittedAt: Date.now(),
              },
            },
          },
        };
        updatePlayWithBots(playWithBotsState);
      }, (index + 1) * 600); // Stagger by 600ms each
    });

    return;
  }

  try {
    await set(
      ref(database, `games/${gameCode}/guesses/round_${roundNumber}/${playerId}`),
      guess
    );
  } catch (error) {
    console.error('Error submitting guess:', error);
    throw error;
  }
};

// ==================== Calculate Results ====================

export const calculateAndSubmitResults = async (
  gameCode: string,
  roundNumber: number
): Promise<void> => {
  try {
    // Get game state - use demo state for demo modes
    let game: Game;
    if (gameCode === DEMO_ASKER) {
      game = demoAskerState;
    } else if (gameCode === DEMO_PARTICIPANT) {
      game = demoParticipantState;
    } else if (gameCode === DEMO_GAME_CODE) {
      game = demoGameState;
    } else if (gameCode === PLAY_WITH_BOTS) {
      game = playWithBotsState;
    } else {
      const gameRef = ref(database, `games/${gameCode}`);
      const snapshot = await get(gameRef);
      game = snapshot.val() as Game;
    }

    const guesses = game.guesses[`round_${roundNumber}`] || {};
    const correctAnswer = game.currentQuestion?.answer || 0;

    // Calculate percentage errors (use absolute difference when answer is 0 to avoid division by zero)
    const rankings = Object.entries(guesses).map(([playerId, guess]) => {
      const guessValue = guess.value ?? null; // Ensure undefined becomes null for Firebase
      let percentageError: number | null = null;
      if (guessValue !== null) {
        if (correctAnswer !== 0) {
          percentageError = Math.abs((guessValue - correctAnswer) / correctAnswer) * 100;
        } else {
          // When correct answer is 0, use absolute difference for ranking
          percentageError = Math.abs(guessValue - correctAnswer);
        }
      }

      return {
        playerId,
        guess: guessValue,
        percentageError,
        pointsAwarded: 0,
      };
    });

    // Sort by percentage error (nulls at end)
    rankings.sort((a, b) => {
      if (a.percentageError === null) return 1;
      if (b.percentageError === null) return -1;
      return a.percentageError - b.percentageError;
    });

    // Separate actual guesses from non-responses
    const actualGuesses = rankings.filter((r) => r.guess !== null);
    const nonResponses = rankings.filter((r) => r.guess === null);

    // Award points based on whether anyone actually answered
    if (actualGuesses.length > 0) {
      // Best guess gets +1
      actualGuesses[0].pointsAwarded = 1;

      // Worst guess penalty logic:
      // - If anyone didn't submit (timeout): they get -1, worst guesser gets 0
      // - If everyone submitted: worst guesser gets -1
      if (nonResponses.length === 0 && actualGuesses.length > 1) {
        // Everyone submitted - worst guesser gets -1
        actualGuesses[actualGuesses.length - 1].pointsAwarded = -1;
      }
    }

    // All non-responders get -1 penalty
    nonResponses.forEach((ranking) => {
      ranking.pointsAwarded = -1;
    });

    // Update player scores
    const scoreUpdates: { [key: string]: any } = {};
    rankings.forEach((ranking) => {
      const currentScore = game.players[ranking.playerId]?.score || 0;
      scoreUpdates[`players/${ranking.playerId}/score`] = currentScore + ranking.pointsAwarded;
    });

    // Determine next asker (winner of this round)
    const winner = rankings[0]?.playerId || game.nextAsker;

    // Generate snarky remark for worst guess
    let snarkyRemark: string | null = null;
    const worstRanking = rankings[rankings.length - 1];
    const worstGuess = worstRanking?.guess;

    if (worstGuess !== null && correctAnswer !== 0) {
      try {
        const remarkResult = await generateSnarkyRemark(
          game.currentQuestion?.text || '',
          correctAnswer,
          worstGuess,
          game.currentQuestion?.units
        );
        snarkyRemark = remarkResult.success ? remarkResult.remark || null : null;
      } catch (error) {
        console.error('Failed to generate snarky remark:', error);
        // Continue without remark - don't block game
      }
    }

    // Create round result
    const result: RoundResult = {
      winner: rankings[0]?.playerId || '',
      loser: rankings[rankings.length - 1]?.playerId || '',
      correctAnswer,
      rankings,
      snarkyRemark,
    };

    // Update game state - handle demo modes
    if (gameCode === DEMO_ASKER || gameCode === DEMO_PARTICIPANT || gameCode === DEMO_GAME_CODE || gameCode === PLAY_WITH_BOTS) {
      // Update in-memory demo state
      const currentState = gameCode === DEMO_ASKER ? demoAskerState :
                           gameCode === DEMO_PARTICIPANT ? demoParticipantState :
                           gameCode === PLAY_WITH_BOTS ? playWithBotsState :
                           demoGameState;

      // Update player scores
      rankings.forEach((ranking) => {
        if (currentState.players[ranking.playerId]) {
          currentState.players[ranking.playerId].score += ranking.pointsAwarded;
        }
      });

      // Update round results and status
      currentState.roundResults[`round_${roundNumber}`] = result;

      // For Play with Bots, winner asks next; for other demos, set user as next asker
      if (gameCode === PLAY_WITH_BOTS) {
        // Winner of this round gets to ask the next question
        currentState.nextAsker = winner;
      } else {
        currentState.nextAsker = DEMO_USER_ID;
      }
      currentState.status = 'results';

      // Notify listeners
      if (gameCode === DEMO_ASKER) {
        updateDemoAsker({ ...currentState });
      } else if (gameCode === DEMO_PARTICIPANT) {
        updateDemoParticipant({ ...currentState });
      } else if (gameCode === PLAY_WITH_BOTS) {
        updatePlayWithBots({ ...currentState });
      } else {
        updateDemoGame({ ...currentState });
      }
    } else {
      // Update Firebase for real games
      await update(ref(database, `games/${gameCode}`), {
        ...scoreUpdates,
        [`roundResults/round_${roundNumber}`]: result,
        nextAsker: winner,
        status: 'results',
      });
    }
  } catch (error) {
    console.error('Error calculating results:', error);
    throw error;
  }
};

// ==================== Check Win Condition ====================

export const checkWinCondition = async (gameCode: string): Promise<boolean> => {
  try {
    // Get game state - use demo state for demo modes
    let game: Game;
    if (gameCode === DEMO_ASKER) {
      game = demoAskerState;
    } else if (gameCode === DEMO_PARTICIPANT) {
      game = demoParticipantState;
    } else if (gameCode === DEMO_GAME_CODE) {
      game = demoGameState;
    } else if (gameCode === PLAY_WITH_BOTS) {
      game = playWithBotsState;
    } else {
      const gameRef = ref(database, `games/${gameCode}`);
      const snapshot = await get(gameRef);
      game = snapshot.val() as Game;
    }

    if (game.config.gameMode === 'rounds') {
      return game.currentRound >= (game.config.targetRounds || 10);
    } else {
      // Score mode
      const scores = Object.values(game.players).map((p) => p.score);
      const maxScore = Math.max(...scores);
      return maxScore >= (game.config.targetScore || 10);
    }
  } catch (error) {
    console.error('Error checking win condition:', error);
    return false;
  }
};

// ==================== Move to Best/Worst Reveal ====================

export const moveToBestWorst = async (gameCode: string): Promise<void> => {
  try {
    // Handle demo modes
    if (gameCode === DEMO_ASKER) {
      demoAskerState.status = 'best_worst_reveal';
      updateDemoAsker({ ...demoAskerState });
      return;
    } else if (gameCode === DEMO_PARTICIPANT) {
      demoParticipantState.status = 'best_worst_reveal';
      updateDemoParticipant({ ...demoParticipantState });
      return;
    } else if (gameCode === DEMO_GAME_CODE) {
      demoGameState.status = 'best_worst_reveal';
      updateDemoGame({ ...demoGameState });
      return;
    } else if (gameCode === PLAY_WITH_BOTS) {
      playWithBotsState.status = 'best_worst_reveal';
      updatePlayWithBots({ ...playWithBotsState });
      return;
    }

    await update(ref(database, `games/${gameCode}`), {
      status: 'best_worst_reveal',
    });
  } catch (error) {
    console.error('Error moving to best/worst:', error);
    throw error;
  }
};

// ==================== Move to Standings ====================

export const moveToStandings = async (gameCode: string): Promise<void> => {
  try {
    // Handle demo modes
    if (gameCode === DEMO_ASKER) {
      demoAskerState.status = 'standings';
      updateDemoAsker({ ...demoAskerState });
      return;
    } else if (gameCode === DEMO_PARTICIPANT) {
      demoParticipantState.status = 'standings';
      updateDemoParticipant({ ...demoParticipantState });
      return;
    } else if (gameCode === DEMO_GAME_CODE) {
      demoGameState.status = 'standings';
      updateDemoGame({ ...demoGameState });
      return;
    } else if (gameCode === PLAY_WITH_BOTS) {
      playWithBotsState.status = 'standings';
      updatePlayWithBots({ ...playWithBotsState });
      return;
    }

    await update(ref(database, `games/${gameCode}`), {
      status: 'standings',
    });
  } catch (error) {
    console.error('Error moving to standings:', error);
    throw error;
  }
};

// ==================== Advance to Next Round ====================

export const advanceToNextRound = async (gameCode: string): Promise<void> => {
  try {
    // Handle demo modes - always end after 1 round
    if (gameCode === DEMO_ASKER) {
      demoAskerState.status = 'ended';
      updateDemoAsker({ ...demoAskerState });
      return;
    } else if (gameCode === DEMO_PARTICIPANT) {
      demoParticipantState.status = 'ended';
      updateDemoParticipant({ ...demoParticipantState });
      return;
    } else if (gameCode === DEMO_GAME_CODE) {
      const isGameOver = await checkWinCondition(gameCode);
      if (isGameOver) {
        demoGameState.status = 'ended';
        updateDemoGame({ ...demoGameState });
      } else {
        demoGameState.status = 'question_entry';
        demoGameState.currentRound = demoGameState.currentRound + 1;
        demoGameState.currentQuestion = undefined;
        updateDemoGame({ ...demoGameState });
      }
      return;
    } else if (gameCode === PLAY_WITH_BOTS) {
      const isGameOver = await checkWinCondition(gameCode);
      if (isGameOver) {
        playWithBotsState.status = 'ended';
        updatePlayWithBots({ ...playWithBotsState });
      } else {
        playWithBotsState.status = 'question_entry';
        playWithBotsState.currentRound = playWithBotsState.currentRound + 1;
        playWithBotsState.currentQuestion = undefined;
        updatePlayWithBots({ ...playWithBotsState });

        // If next asker is a bot, trigger bot question generation
        if (isBot(playWithBotsState.nextAsker)) {
          await handleBotAskQuestion();
        }
      }
      return;
    }

    const gameRef = ref(database, `games/${gameCode}`);
    const snapshot = await get(gameRef);
    const game = snapshot.val() as Game;

    const isGameOver = await checkWinCondition(gameCode);

    if (isGameOver) {
      await update(ref(database, `games/${gameCode}`), {
        status: 'ended',
      });
    } else {
      await update(ref(database, `games/${gameCode}`), {
        status: 'question_entry',
        currentRound: game.currentRound + 1,
        currentQuestion: null,
      });
    }
  } catch (error) {
    console.error('Error advancing to next round:', error);
    throw error;
  }
};

// ==================== Real-time Listeners ====================

export const listenToGame = (
  gameCode: string,
  callback: (game: Game | null) => void
): (() => void) => {
  // Legacy demo mode - return mock data
  if (gameCode === DEMO_GAME_CODE) {
    demoGameListeners.push(callback);
    callback(demoGameState);
    return () => {
      demoGameListeners = demoGameListeners.filter(cb => cb !== callback);
    };
  }

  // Asker demo mode
  if (gameCode === DEMO_ASKER) {
    demoAskerListeners.push(callback);
    callback(demoAskerState);
    return () => {
      demoAskerListeners = demoAskerListeners.filter(cb => cb !== callback);
    };
  }

  // Participant demo mode
  if (gameCode === DEMO_PARTICIPANT) {
    demoParticipantListeners.push(callback);
    callback(demoParticipantState);
    return () => {
      demoParticipantListeners = demoParticipantListeners.filter(cb => cb !== callback);
    };
  }

  // Play with Bots mode
  if (gameCode === PLAY_WITH_BOTS) {
    playWithBotsListeners.push(callback);
    callback(playWithBotsState);
    return () => {
      playWithBotsListeners = playWithBotsListeners.filter(cb => cb !== callback);
    };
  }

  const gameRef = ref(database, `games/${gameCode}`);

  const unsubscribe = onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as Game);
    } else {
      callback(null);
    }
  });

  // Return cleanup function
  return () => off(gameRef);
};

// Helper to update demo game state and notify listeners
const updateDemoGame = (newState: Game) => {
  demoGameState = newState;
  demoGameListeners.forEach(listener => listener(demoGameState));
};

// Helpers for new demo modes
const updateDemoAsker = (newState: Game) => {
  demoAskerState = newState;
  demoAskerListeners.forEach(listener => listener(demoAskerState));
};

const updateDemoParticipant = (newState: Game) => {
  demoParticipantState = newState;
  demoParticipantListeners.forEach(listener => listener(demoParticipantState));
};

// Play with Bots helpers
const updatePlayWithBots = (newState: Game) => {
  playWithBotsState = newState;
  playWithBotsListeners.forEach(listener => listener(playWithBotsState));
};

// Handle bot asking a question via Gemini
const handleBotAskQuestion = async () => {
  try {
    // Show "bot is thinking" state
    playWithBotsState.isBotThinking = true;
    updatePlayWithBots({ ...playWithBotsState });

    // Wait a moment for UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate question via Gemini
    const result = await generateTriviaQuestion(playWithBotsPreviousQuestions);

    if (result.success && result.question && result.answer !== undefined) {
      const question: CurrentQuestion = {
        text: result.question,
        answer: result.answer,
        units: result.units,
        askedBy: playWithBotsState.nextAsker,
        submittedAt: Date.now(),
      };

      // Track question to avoid repeats
      playWithBotsPreviousQuestions.push(result.question);

      playWithBotsState = {
        ...playWithBotsState,
        currentQuestion: question,
        status: 'guessing',
        isBotThinking: false,
        guesses: {
          ...playWithBotsState.guesses,
          [`round_${playWithBotsState.currentRound}`]: {},
        },
      };
      updatePlayWithBots(playWithBotsState);
    } else {
      // Fallback to a default question if Gemini fails
      useFallbackQuestion();
    }
  } catch (error) {
    console.error('Error generating bot question:', error);
    // Use fallback question on error
    useFallbackQuestion();
  }
};

// Helper function for fallback questions
const useFallbackQuestion = () => {
  const fallbackQuestions = [
    { text: 'How many bones are in the human body?', answer: 206, units: 'bones' },
    { text: 'How many countries are in the United Nations?', answer: 193, units: 'countries' },
    { text: 'How tall is Mount Everest in feet?', answer: 29032, units: 'feet' },
    { text: 'How many keys are on a standard piano?', answer: 88, units: 'keys' },
    { text: 'How many stripes are on the American flag?', answer: 13, units: 'stripes' },
  ];
  const fallback = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];

  const question: CurrentQuestion = {
    text: fallback.text,
    answer: fallback.answer,
    units: fallback.units,
    askedBy: playWithBotsState.nextAsker,
    submittedAt: Date.now(),
  };

  playWithBotsState = {
    ...playWithBotsState,
    currentQuestion: question,
    status: 'guessing',
    isBotThinking: false,
    guesses: {
      ...playWithBotsState.guesses,
      [`round_${playWithBotsState.currentRound}`]: {},
    },
  };
  updatePlayWithBots(playWithBotsState);
};

// Initialize Play with Bots mode with custom round count and difficulty
export const initPlayWithBots = (totalRounds: number, difficulty: BotDifficulty = 'medium') => {
  playWithBotsState = getPlayWithBotsLobby(totalRounds, difficulty);
  playWithBotsPreviousQuestions = [];
  updatePlayWithBots(playWithBotsState);
};

// Export function to advance demo mode (for debugging/navigation)
export const advanceDemoMode = () => {
  switch (demoGameState.status) {
    case 'waiting':
      updateDemoGame(getDemoGameQuestionEntry());
      break;
    case 'question_entry':
      updateDemoGame(getDemoGameGuessing());
      break;
    case 'guessing':
      updateDemoGame(getDemoGameResults());
      break;
    case 'results':
      updateDemoGame(getDemoGameStandings());
      break;
    case 'standings':
      updateDemoGame(getDemoGameQuestionEntry());
      break;
    default:
      updateDemoGame(getDemoGame('waiting'));
  }
};

// Demo screen options for the screen selector
export type DemoScreen =
  | 'create_game'
  | 'join_game'
  | 'lobby'
  | 'question_entry'
  | 'waiting_for_question'
  | 'guessing'
  | 'asker_waiting'
  | 'results'
  | 'best_worst_reveal'
  | 'standings'
  | 'game_end';

export const DEMO_SCREENS: { key: DemoScreen; label: string; isNavigation?: boolean }[] = [
  { key: 'create_game', label: 'Create Game', isNavigation: true },
  { key: 'join_game', label: 'Join Game', isNavigation: true },
  { key: 'lobby', label: 'Lobby (Waiting)', isNavigation: true },
  { key: 'question_entry', label: 'Ask a Question' },
  { key: 'waiting_for_question', label: 'Waiting for Question' },
  { key: 'guessing', label: 'Guessing Screen' },
  { key: 'asker_waiting', label: 'Asker Waiting' },
  { key: 'results', label: 'Round Results' },
  { key: 'best_worst_reveal', label: 'Best/Worst Reveal' },
  { key: 'standings', label: 'Standings' },
  { key: 'game_end', label: 'Game End' },
];

// Set demo mode to a specific screen
export const setDemoScreen = (screen: DemoScreen) => {
  switch (screen) {
    case 'lobby':
      updateDemoGame(getDemoGame('waiting'));
      break;
    case 'question_entry':
      updateDemoGame(getDemoGameQuestionEntry());
      break;
    case 'waiting_for_question':
      updateDemoGame(getDemoGameWaitingForQuestion());
      break;
    case 'guessing':
      updateDemoGame(getDemoGameGuessing());
      break;
    case 'asker_waiting':
      updateDemoGame(getDemoGameAskerWaiting());
      break;
    case 'results':
      updateDemoGame(getDemoGameResults());
      break;
    case 'best_worst_reveal':
      updateDemoGame(getDemoGameBestWorstReveal());
      break;
    case 'standings':
      updateDemoGame(getDemoGameStandings());
      break;
    case 'game_end':
      updateDemoGame(getDemoGameEnd());
      break;
    default:
      updateDemoGame(getDemoGame('waiting'));
  }
};

// ==================== Emoji Reactions ====================

export const submitReaction = async (
  gameCode: string,
  roundNumber: number,
  playerId: string,
  emoji: string
): Promise<void> => {
  try {
    const reactionsRef = ref(database, `games/${gameCode}/roundResults/round_${roundNumber}/reactions`);

    const reaction: EmojiReaction = {
      playerId,
      emoji,
      timestamp: Date.now(),
    };

    await push(reactionsRef, reaction);
  } catch (error) {
    console.error('Error submitting reaction:', error);
    // Fail silently - reactions are non-critical
  }
};

// ==================== Exports ====================

export { auth, database };

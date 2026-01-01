import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInAnonymously, Auth, getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get, onValue, off, push, update, Database } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Game, Player, Guess, CurrentQuestion, RoundResult } from '../types/game';
import {
  DEMO_GAME_CODE,
  getDemoGame,
  getDemoGameQuestionEntry,
  getDemoGameWaitingForQuestion,
  getDemoGameGuessing,
  getDemoGameAskerWaiting,
  getDemoGameResults,
  getDemoGameStandings,
  getDemoGameEnd,
} from './demoData';

// Demo mode state
let demoGameState: Game = getDemoGame('waiting');
let demoGameListeners: Array<(game: Game) => void> = [];

// Firebase configuration from app.config.ts extra (with local dev fallbacks)
const extra = Constants.expoConfig?.extra;
const firebaseConfig = {
  apiKey: extra?.firebaseApiKey || 'AIzaSyDc1eqon-JZ-FjCoE0pjKQjD0L7XP8DL9U',
  authDomain: extra?.firebaseAuthDomain || 'calculator-game-1690a.firebaseapp.com',
  databaseURL: extra?.firebaseDatabaseUrl || 'https://calculator-game-1690a-default-rtdb.firebaseio.com',
  projectId: extra?.firebaseProjectId || 'calculator-game-1690a',
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
  targetValue: number
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
        timerDuration: 30,
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
  // Demo mode - update demo state
  if (gameCode === DEMO_GAME_CODE) {
    updateDemoGame(getDemoGameQuestionEntry());
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
  try {
    const question: CurrentQuestion = {
      text: questionText,
      answer,
      units,
      askedBy: playerId,
      submittedAt: Date.now(),
    };

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
  try {
    const guess: Guess = {
      value,
      calculation,
      submittedAt: value !== null ? Date.now() : null,
    };

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
    const gameRef = ref(database, `games/${gameCode}`);
    const snapshot = await get(gameRef);
    const game = snapshot.val() as Game;

    const guesses = game.guesses[`round_${roundNumber}`] || {};
    const correctAnswer = game.currentQuestion?.answer || 0;

    // Calculate percentage errors
    const rankings = Object.entries(guesses).map(([playerId, guess]) => {
      let percentageError: number | null = null;
      if (guess.value !== null && correctAnswer !== 0) {
        percentageError = Math.abs((guess.value - correctAnswer) / correctAnswer) * 100;
      }

      return {
        playerId,
        guess: guess.value,
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

    // Award points: +1 for closest, -1 for furthest, -1 for null guesses
    if (rankings.length > 0) {
      rankings[0].pointsAwarded = 1; // Winner
      if (rankings.length > 1) {
        rankings[rankings.length - 1].pointsAwarded = -1; // Loser
      }
    }

    // Handle null guesses (timeouts) - always -1
    rankings.forEach((ranking) => {
      if (ranking.guess === null) {
        ranking.pointsAwarded = -1;
      }
    });

    // Update player scores
    const scoreUpdates: { [key: string]: any } = {};
    rankings.forEach((ranking) => {
      const currentScore = game.players[ranking.playerId]?.score || 0;
      scoreUpdates[`players/${ranking.playerId}/score`] = currentScore + ranking.pointsAwarded;
    });

    // Determine next asker (winner of this round)
    const winner = rankings[0]?.playerId || game.nextAsker;

    // Create round result
    const result: RoundResult = {
      winner: rankings[0]?.playerId || '',
      loser: rankings[rankings.length - 1]?.playerId || '',
      correctAnswer,
      rankings,
    };

    // Update game state
    await update(ref(database, `games/${gameCode}`), {
      ...scoreUpdates,
      [`roundResults/round_${roundNumber}`]: result,
      nextAsker: winner,
      status: 'results',
    });
  } catch (error) {
    console.error('Error calculating results:', error);
    throw error;
  }
};

// ==================== Check Win Condition ====================

export const checkWinCondition = async (gameCode: string): Promise<boolean> => {
  try {
    const gameRef = ref(database, `games/${gameCode}`);
    const snapshot = await get(gameRef);
    const game = snapshot.val() as Game;

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

// ==================== Move to Standings ====================

export const moveToStandings = async (gameCode: string): Promise<void> => {
  try {
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
  // Demo mode - return mock data
  if (gameCode === DEMO_GAME_CODE) {
    // Add listener
    demoGameListeners.push(callback);

    // Immediately call callback with current demo game state
    callback(demoGameState);

    // Return cleanup function that removes listener
    return () => {
      demoGameListeners = demoGameListeners.filter(cb => cb !== callback);
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

// ==================== Exports ====================

export { auth, database };

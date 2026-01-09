// Game type definitions based on Firebase schema

export type GameMode = 'rounds' | 'score';

export type GameStatus = 'waiting' | 'question_entry' | 'guessing' | 'results' | 'best_worst_reveal' | 'standings' | 'tiebreaker' | 'tiebreaker_results' | 'ended';

export interface GameConfig {
  gameMode: GameMode;
  targetRounds?: number;  // if gameMode === 'rounds'
  targetScore?: number;   // if gameMode === 'score'
  timerDuration: number;  // seconds
  createdAt: number;      // timestamp
  hostId: string;
  // Positional scoring config (optional, defaults applied in scoring logic)
  firstPlacePoints?: number;   // default: 4
  secondPlacePoints?: number;  // default: 2
  thirdPlacePoints?: number;   // default: 1
  lastPlacePoints?: number;    // default: 0
}

export interface Player {
  nickname: string;
  score: number;
  isHost: boolean;
  joinedAt: number;
}

export interface CurrentQuestion {
  text: string;
  answer: number;
  units?: string;
  askedBy: string;
  submittedAt: number;
}

export interface Guess {
  value: number | null;
  calculation: string;
  submittedAt: number | null;
}

export interface RoundRanking {
  playerId: string;
  guess: number | null;
  percentageError: number | null;
  pointsAwarded: number;  // based on position (1st/2nd/3rd/last/middle)
}

export interface EmojiReaction {
  playerId: string;
  emoji: string;
  timestamp: number;
}

export interface RoundResult {
  winner: string;
  loser: string;
  correctAnswer: number;
  rankings: RoundRanking[];
  snarkyRemark?: string | null;
  reactions?: { [reactionId: string]: EmojiReaction };
  questionText?: string;
  questionUnits?: string;
}

// Difficulty levels for Play with Bots mode
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Game {
  config: GameConfig;
  status: GameStatus;
  currentRound: number;
  currentQuestion?: CurrentQuestion;
  players: { [playerId: string]: Player };
  guesses: { [roundId: string]: { [playerId: string]: Guess } };
  roundResults: { [roundId: string]: RoundResult };
  nextAsker: string;
  // Play with Bots mode fields
  botDifficulty?: BotDifficulty;  // Difficulty level for bot guesses
  isBotThinking?: boolean;  // Whether a bot is currently "thinking" of a question
  // Tiebreaker fields
  tiebreakerPlayers?: string[];  // Player IDs participating in tiebreaker
  tiebreakerQuestion?: CurrentQuestion;  // The tiebreaker question
}

// Helper type for local player state
export interface LocalPlayerState {
  playerId: string;
  gameCode: string;
  isConnected: boolean;
}

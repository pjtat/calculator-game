// Game type definitions based on Firebase schema

export type GameMode = 'rounds' | 'score';

export type GameStatus = 'waiting' | 'question_entry' | 'guessing' | 'results' | 'best_worst_reveal' | 'standings' | 'ended';

export interface GameConfig {
  gameMode: GameMode;
  targetRounds?: number;  // if gameMode === 'rounds'
  targetScore?: number;   // if gameMode === 'score'
  timerDuration: number;  // seconds
  createdAt: number;      // timestamp
  hostId: string;
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
  pointsAwarded: number;  // +1, 0, or -1
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
}

export interface Game {
  config: GameConfig;
  status: GameStatus;
  currentRound: number;
  currentQuestion?: CurrentQuestion;
  players: { [playerId: string]: Player };
  guesses: { [roundId: string]: { [playerId: string]: Guess } };
  roundResults: { [roundId: string]: RoundResult };
  nextAsker: string;
}

// Helper type for local player state
export interface LocalPlayerState {
  playerId: string;
  gameCode: string;
  isConnected: boolean;
}

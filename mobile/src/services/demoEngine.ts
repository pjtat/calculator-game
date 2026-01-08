import { CurrentQuestion } from '../types/game';

// Demo mode constants
export const DEMO_ASKER = 'DEMOASK';
export const DEMO_PARTICIPANT = 'DEMOPAR';
export const DEMO_USER_ID = 'demo-user';
export const PLAY_WITH_BOTS = 'BOTPLAY';

// Difficulty levels for Play with Bots mode
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  skillMultiplier: number;  // Scales bot error ranges (higher = worse bots)
  label: string;
  description: string;
}

export const DIFFICULTY_CONFIGS: Record<BotDifficulty, DifficultyConfig> = {
  easy: { skillMultiplier: 1.5, label: 'Easy', description: 'Bots make more mistakes' },
  medium: { skillMultiplier: 1.0, label: 'Medium', description: 'Balanced challenge' },
  hard: { skillMultiplier: 0.6, label: 'Hard', description: 'Bots are sharper' },
};

// Bot player definitions with skill ranges for variability
export interface BotPlayer {
  id: string;
  nickname: string;
  minError: number;  // Minimum percentage error (best case)
  maxError: number;  // Maximum percentage error (worst case)
}

export const BOT_PLAYERS: BotPlayer[] = [
  { id: 'demo-bot-1', nickname: 'Ward', minError: 0.00, maxError: 0.15 },      // 0-15% (skilled)
  { id: 'demo-bot-2', nickname: 'Porter', minError: 0.05, maxError: 0.25 },    // 5-25% (good)
  { id: 'demo-bot-3', nickname: 'Bettis', minError: 0.15, maxError: 0.50 },    // 15-50% (medium)
  { id: 'demo-bot-4', nickname: 'Polamalu', minError: 0.10, maxError: 0.45 },  // 10-45% (medium)
  { id: 'demo-bot-5', nickname: 'Hampton', minError: 0.40, maxError: 1.00 },   // 40-100% (weak)
  { id: 'demo-bot-6', nickname: 'Ike', minError: 0.30, maxError: 0.80 },       // 30-80% (weak)
];

// Pre-curated questions for participant mode
export const DEMO_QUESTIONS: CurrentQuestion[] = [
  {
    text: 'How many people live in Tokyo?',
    answer: 37400000,
    units: 'people',
    askedBy: 'demo-bot-1',
    submittedAt: Date.now(),
  },
  {
    text: 'How tall is the Eiffel Tower in feet?',
    answer: 1083,
    units: 'feet',
    askedBy: 'demo-bot-2',
    submittedAt: Date.now(),
  },
  {
    text: 'How many McDonald\'s restaurants are in the world?',
    answer: 40275,
    units: 'restaurants',
    askedBy: 'demo-bot-3',
    submittedAt: Date.now(),
  },
];

// Get a random demo question for participant mode
export const getRandomDemoQuestion = (): CurrentQuestion => {
  const question = DEMO_QUESTIONS[Math.floor(Math.random() * DEMO_QUESTIONS.length)];
  return {
    ...question,
    submittedAt: Date.now(),
  };
};

// Check if an answer is likely a year (1500-2100 range)
const isLikelyYear = (answer: number): boolean => {
  return answer >= 1500 && answer <= 2100 && Number.isInteger(answer);
};

// Generate a bot guess based on correct answer, bot's skill range, and difficulty
export const generateBotGuess = (
  correctAnswer: number,
  bot: BotPlayer,
  difficulty: BotDifficulty = 'medium'
): number => {
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Randomly decide if guess is over or under the correct answer
  const direction = Math.random() < 0.5 ? 1 : -1;

  // Special handling for year-based answers (use absolute error, not percentage)
  if (isLikelyYear(correctAnswer)) {
    // Map bot's percentage error range to absolute year error (max ~75 years for worst bots)
    const minYearError = Math.round(bot.minError * 75 * config.skillMultiplier);
    const maxYearError = Math.round(bot.maxError * 75 * config.skillMultiplier);
    const yearError = minYearError + Math.random() * (maxYearError - minYearError);
    const guess = Math.round(correctAnswer + direction * yearError);
    return Math.max(1, guess);
  }

  // Apply difficulty multiplier to the bot's error range
  const adjustedMinError = bot.minError * config.skillMultiplier;
  const adjustedMaxError = bot.maxError * config.skillMultiplier;

  // Generate random error percentage within the adjusted range
  const errorPercent = adjustedMinError + Math.random() * (adjustedMaxError - adjustedMinError);

  // Cap error at 90% when guessing low to keep guesses proportional to the answer
  // This ensures guesses are always at least 10% of the correct answer
  const cappedErrorPercent = direction === -1 ? Math.min(errorPercent, 0.9) : errorPercent;

  // Calculate the guess with the random error
  const guess = correctAnswer * (1 + direction * cappedErrorPercent);

  // Ensure guess is positive (fallback safety, shouldn't trigger with capped error)
  const positiveGuess = Math.max(1, guess);

  // Round to a reasonable precision
  if (positiveGuess > 1000000) {
    return Math.round(positiveGuess / 100000) * 100000; // Round to nearest 100k
  } else if (positiveGuess > 10000) {
    return Math.round(positiveGuess / 1000) * 1000; // Round to nearest 1k
  } else if (positiveGuess > 100) {
    return Math.round(positiveGuess / 10) * 10; // Round to nearest 10
  } else {
    return Math.round(positiveGuess);
  }
};

// Generate a simple calculation string for the bot's guess
export const generateBotCalculation = (guess: number): string => {
  // Just return the number as a string - bots use simple calculations
  if (guess > 1000000) {
    const millions = Math.round(guess / 1000000);
    return `${millions} * 1000000`;
  } else if (guess > 10000) {
    const thousands = Math.round(guess / 1000);
    return `${thousands} * 1000`;
  } else {
    return guess.toString();
  }
};

// ==================== Play with Bots Mode ====================

// Check if a player ID is a bot
export const isBot = (playerId: string): boolean => {
  return BOT_PLAYERS.some(bot => bot.id === playerId);
};

// Get bot by ID
export const getBotById = (botId: string): BotPlayer | undefined => {
  return BOT_PLAYERS.find(bot => bot.id === botId);
};

import { CurrentQuestion } from '../types/game';

// Demo mode constants
export const DEMO_ASKER = 'DEMOASK';
export const DEMO_PARTICIPANT = 'DEMOPAR';
export const DEMO_USER_ID = 'demo-user';
export const PLAY_WITH_BOTS = 'BOTPLAY';

// Bot player definitions
export interface BotPlayer {
  id: string;
  nickname: string;
  offset: number; // Percentage offset from correct answer
}

export const BOT_PLAYERS: BotPlayer[] = [
  { id: 'demo-bot-1', nickname: 'Ward', offset: 0.05 },      // +5% (very close)
  { id: 'demo-bot-2', nickname: 'Porter', offset: -0.12 },   // -12% (good)
  { id: 'demo-bot-3', nickname: 'Bettis', offset: 0.40 },    // +40% (medium)
  { id: 'demo-bot-4', nickname: 'Polamalu', offset: -0.33 }, // -33% (medium)
  { id: 'demo-bot-5', nickname: 'Hampton', offset: 0.85 },   // +85% (bad)
  { id: 'demo-bot-6', nickname: 'Ike', offset: -0.60 },      // -60% (bad)
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

// Generate a bot guess based on correct answer and bot's offset
export const generateBotGuess = (correctAnswer: number, bot: BotPlayer): number => {
  const guess = correctAnswer * (1 + bot.offset);
  // Round to a reasonable precision
  if (guess > 1000000) {
    return Math.round(guess / 100000) * 100000; // Round to nearest 100k
  } else if (guess > 10000) {
    return Math.round(guess / 1000) * 1000; // Round to nearest 1k
  } else if (guess > 100) {
    return Math.round(guess / 10) * 10; // Round to nearest 10
  } else {
    return Math.round(guess);
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

// Schedule staggered bot submissions
export const scheduleBotSubmissions = (
  bots: BotPlayer[],
  correctAnswer: number,
  onBotSubmit: (botId: string, guess: number, calculation: string) => void,
  baseDelay: number = 1000
): void => {
  bots.forEach((bot, index) => {
    setTimeout(() => {
      const guess = generateBotGuess(correctAnswer, bot);
      const calculation = generateBotCalculation(guess);
      onBotSubmit(bot.id, guess, calculation);
    }, baseDelay + (index * 1500)); // Stagger by 1.5 seconds
  });
};

// ==================== Play with Bots Mode ====================

// Generate asker rotation for Play with Bots mode
// Pattern: Bot1 -> Bot2 -> USER -> Bot3 -> Bot4 -> USER -> Bot5 -> Bot6 -> USER -> repeat
export const generateAskerRotation = (totalRounds: number): string[] => {
  const rotation: string[] = [];
  let botIndex = 0;

  for (let i = 0; i < totalRounds; i++) {
    // Every 3rd question (index 2, 5, 8, ...) is the user's turn
    if ((i + 1) % 3 === 0) {
      rotation.push(DEMO_USER_ID);
    } else {
      // Use bots in order, cycling through them
      rotation.push(BOT_PLAYERS[botIndex % BOT_PLAYERS.length].id);
      botIndex++;
    }
  }

  return rotation;
};

// Get the next asker from the rotation
export const getNextAskerFromRotation = (
  rotation: string[],
  currentIndex: number
): { nextAsker: string; nextIndex: number } => {
  const nextIndex = (currentIndex + 1) % rotation.length;
  return {
    nextAsker: rotation[nextIndex],
    nextIndex,
  };
};

// Check if a player ID is a bot
export const isBot = (playerId: string): boolean => {
  return BOT_PLAYERS.some(bot => bot.id === playerId);
};

// Get bot by ID
export const getBotById = (botId: string): BotPlayer | undefined => {
  return BOT_PLAYERS.find(bot => bot.id === botId);
};

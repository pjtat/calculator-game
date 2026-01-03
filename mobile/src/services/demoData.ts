import { Game } from '../types/game';

export const DEMO_GAME_CODE = 'DEMO01';
export const DEMO_PLAYER_ID = 'demo-player-1';

export const getDemoGame = (status: Game['status'] = 'waiting'): Game => {
  const baseGame: Game = {
    status: status,
    currentRound: status === 'waiting' ? 0 : 1,
    nextAsker: DEMO_PLAYER_ID,
    players: {
      [DEMO_PLAYER_ID]: {
        nickname: 'You (Demo)',
        score: 0,
        isHost: true,
        joinedAt: Date.now(),
      },
      'demo-player-2': {
        nickname: 'Alice',
        score: 0,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-3': {
        nickname: 'Bob',
        score: 0,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-4': {
        nickname: 'Charlie',
        score: 0,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-5': {
        nickname: 'Diana',
        score: 0,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-6': {
        nickname: 'Ethan',
        score: 0,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-7': {
        nickname: 'Fiona',
        score: 0,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-8': {
        nickname: 'George',
        score: 0,
        isHost: false,
        joinedAt: Date.now(),
      },
    },
    config: {
      hostId: DEMO_PLAYER_ID,
      gameMode: 'rounds',
      targetRounds: 5,
      targetScore: 10,
      timerDuration: 30,
      createdAt: Date.now(),
    },
    guesses: {},
    roundResults: {},
    currentQuestion: undefined,
  };

  return baseGame;
};

// You are the asker - entering a question
export const getDemoGameQuestionEntry = (): Game => {
  return {
    ...getDemoGame('question_entry'),
    currentRound: 1,
    nextAsker: DEMO_PLAYER_ID,
  };
};

// Someone else is the asker - waiting for their question
export const getDemoGameWaitingForQuestion = (): Game => {
  return {
    ...getDemoGame('question_entry'),
    currentRound: 1,
    nextAsker: 'demo-player-2',
  };
};

// Guessing screen - you make a guess
export const getDemoGameGuessing = (): Game => {
  return {
    ...getDemoGame('guessing'),
    currentRound: 1,
    currentQuestion: {
      text: 'How many people live in Tokyo?',
      answer: 37400000,
      units: 'people',
      askedBy: 'demo-player-2',
      submittedAt: Date.now(),
    },
    nextAsker: 'demo-player-2',
  };
};

// Asker waiting - you asked the question, waiting for others to guess
export const getDemoGameAskerWaiting = (): Game => {
  return {
    ...getDemoGame('guessing'),
    currentRound: 1,
    currentQuestion: {
      text: 'How many restaurants are in New York City?',
      answer: 27000,
      units: 'restaurants',
      askedBy: DEMO_PLAYER_ID,
      submittedAt: Date.now(),
    },
    nextAsker: DEMO_PLAYER_ID,
    guesses: {
      round_1: {
        'demo-player-2': {
          value: 25000,
          calculation: '25000',
          submittedAt: Date.now(),
        },
        'demo-player-3': {
          value: 30000,
          calculation: '30000',
          submittedAt: Date.now(),
        },
        'demo-player-4': {
          value: 22000,
          calculation: '22000',
          submittedAt: Date.now(),
        },
        'demo-player-5': {
          value: 50000,
          calculation: '50000',
          submittedAt: Date.now(),
        },
        // Players 6, 7, 8 still guessing...
      },
    },
  };
};

export const getDemoGameResults = (): Game => {
  const game = getDemoGame('results');
  // Answer: 37,400,000 - create varied guesses to test scale visualization
  return {
    ...game,
    currentRound: 1,
    currentQuestion: {
      text: 'How many people live in Tokyo?',
      answer: 37400000,
      units: 'people',
      askedBy: 'demo-player-2',
      submittedAt: Date.now(),
    },
    guesses: {
      round_1: {
        'demo-player-3': {
          value: 37000000, // Winner - 1% off (green)
          calculation: '37 * 1000000',
          submittedAt: Date.now(),
        },
        [DEMO_PLAYER_ID]: {
          value: 35000000, // 6.4% off (green)
          calculation: '30000000 + 5000000',
          submittedAt: Date.now(),
        },
        'demo-player-4': {
          value: 40000000, // 7% off (green)
          calculation: '40 * 1000000',
          submittedAt: Date.now(),
        },
        'demo-player-5': {
          value: 30000000, // 19.8% off (orange)
          calculation: '30 * 1000000',
          submittedAt: Date.now(),
        },
        'demo-player-6': {
          value: 45000000, // 20.3% off (orange)
          calculation: '45 * 1000000',
          submittedAt: Date.now(),
        },
        'demo-player-7': {
          value: 20000000, // 46.5% off (orange)
          calculation: '20 * 1000000',
          submittedAt: Date.now(),
        },
        'demo-player-8': {
          value: 100000000, // 167% off (red) - way off!
          calculation: '100 * 1000000',
          submittedAt: Date.now(),
        },
        // demo-player-2 (Alice) is the asker, so doesn't guess
      },
    },
    roundResults: {
      round_1: {
        correctAnswer: 37400000,
        rankings: [
          {
            playerId: 'demo-player-3', // Bob - closest
            guess: 37000000,
            percentageError: 1.1,
            pointsAwarded: 3,
          },
          {
            playerId: DEMO_PLAYER_ID, // You
            guess: 35000000,
            percentageError: 6.4,
            pointsAwarded: 2,
          },
          {
            playerId: 'demo-player-4', // Charlie
            guess: 40000000,
            percentageError: 7.0,
            pointsAwarded: 1,
          },
          {
            playerId: 'demo-player-5', // Diana
            guess: 30000000,
            percentageError: 19.8,
            pointsAwarded: 0,
          },
          {
            playerId: 'demo-player-6', // Ethan
            guess: 45000000,
            percentageError: 20.3,
            pointsAwarded: 0,
          },
          {
            playerId: 'demo-player-7', // Fiona
            guess: 20000000,
            percentageError: 46.5,
            pointsAwarded: -1,
          },
          {
            playerId: 'demo-player-8', // George - way off!
            guess: 100000000,
            percentageError: 167.4,
            pointsAwarded: -2,
          },
        ],
        winner: 'demo-player-3',
        loser: 'demo-player-8',
      },
    },
    players: {
      [DEMO_PLAYER_ID]: {
        nickname: 'You (Demo)',
        score: 2,
        isHost: true,
        joinedAt: Date.now(),
      },
      'demo-player-2': {
        nickname: 'Alice',
        score: 0, // Asker this round
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-3': {
        nickname: 'Bob',
        score: 3,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-4': {
        nickname: 'Charlie',
        score: 1,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-5': {
        nickname: 'Diana',
        score: 0,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-6': {
        nickname: 'Ethan',
        score: 0,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-7': {
        nickname: 'Fiona',
        score: -1,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-8': {
        nickname: 'George',
        score: -2,
        isHost: false,
        joinedAt: Date.now(),
      },
    },
  };
};

export const getDemoGameStandings = (): Game => {
  const game = getDemoGame('standings');
  return {
    ...game,
    currentRound: 3,
    nextAsker: DEMO_PLAYER_ID,
    roundResults: {
      round_3: {
        correctAnswer: 37400000,
        rankings: [
          {
            playerId: 'demo-player-3',
            guess: 37000000,
            percentageError: 1.1,
            pointsAwarded: 3,
          },
          {
            playerId: DEMO_PLAYER_ID,
            guess: 35000000,
            percentageError: 6.4,
            pointsAwarded: 2,
          },
          {
            playerId: 'demo-player-4',
            guess: 40000000,
            percentageError: 7.0,
            pointsAwarded: 1,
          },
          {
            playerId: 'demo-player-5',
            guess: 30000000,
            percentageError: 19.8,
            pointsAwarded: 0,
          },
          {
            playerId: 'demo-player-6',
            guess: 45000000,
            percentageError: 20.3,
            pointsAwarded: 0,
          },
          {
            playerId: 'demo-player-7',
            guess: 20000000,
            percentageError: 46.5,
            pointsAwarded: -1,
          },
          {
            playerId: 'demo-player-8',
            guess: 100000000,
            percentageError: 167.4,
            pointsAwarded: -2,
          },
        ],
        winner: 'demo-player-3',
        loser: 'demo-player-8',
      },
    },
    players: {
      [DEMO_PLAYER_ID]: {
        nickname: 'You (Demo)',
        score: 8,
        isHost: true,
        joinedAt: Date.now(),
      },
      'demo-player-2': {
        nickname: 'Alice',
        score: 5,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-3': {
        nickname: 'Bob',
        score: 9,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-4': {
        nickname: 'Charlie',
        score: 4,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-5': {
        nickname: 'Diana',
        score: 2,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-6': {
        nickname: 'Ethan',
        score: 1,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-7': {
        nickname: 'Fiona',
        score: -2,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-8': {
        nickname: 'George',
        score: -5,
        isHost: false,
        joinedAt: Date.now(),
      },
    },
  };
};

export const getDemoGameEnd = (): Game => {
  return {
    ...getDemoGame('ended'),
    currentRound: 5,
    players: {
      [DEMO_PLAYER_ID]: {
        nickname: 'You (Demo)',
        score: 15,
        isHost: true,
        joinedAt: Date.now(),
      },
      'demo-player-2': {
        nickname: 'Alice',
        score: 12,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-3': {
        nickname: 'Bob',
        score: 18,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-4': {
        nickname: 'Charlie',
        score: 10,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-5': {
        nickname: 'Diana',
        score: 6,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-6': {
        nickname: 'Ethan',
        score: 3,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-7': {
        nickname: 'Fiona',
        score: -4,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-8': {
        nickname: 'George',
        score: -8,
        isHost: false,
        joinedAt: Date.now(),
      },
    },
  };
};

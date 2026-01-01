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
      },
    },
  };
};

export const getDemoGameResults = (): Game => {
  const game = getDemoGame('results');
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
        [DEMO_PLAYER_ID]: {
          value: 35000000,
          calculation: '30000000 + 5000000',
          submittedAt: Date.now(),
        },
        'demo-player-3': {
          value: 40000000,
          calculation: '40 * 1000000',
          submittedAt: Date.now(),
        },
      },
    },
    roundResults: {
      round_1: {
        correctAnswer: 37400000,
        rankings: [
          {
            playerId: DEMO_PLAYER_ID,
            guess: 35000000,
            percentageError: 6.4,
            pointsAwarded: 1,
          },
          {
            playerId: 'demo-player-3',
            guess: 40000000,
            percentageError: 6.9,
            pointsAwarded: 0,
          },
        ],
        winner: DEMO_PLAYER_ID,
        loser: 'demo-player-3',
      },
    },
    players: {
      [DEMO_PLAYER_ID]: {
        nickname: 'You (Demo)',
        score: 1,
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
    },
  };
};

export const getDemoGameStandings = (): Game => {
  const game = getDemoGame('standings');
  return {
    ...game,
    currentRound: 1,
    nextAsker: DEMO_PLAYER_ID,
    roundResults: {
      round_1: {
        correctAnswer: 37400000,
        rankings: [
          {
            playerId: DEMO_PLAYER_ID,
            guess: 35000000,
            percentageError: 6.4,
            pointsAwarded: 1,
          },
          {
            playerId: 'demo-player-3',
            guess: 40000000,
            percentageError: 6.9,
            pointsAwarded: 0,
          },
        ],
        winner: DEMO_PLAYER_ID,
        loser: 'demo-player-3',
      },
    },
    players: {
      [DEMO_PLAYER_ID]: {
        nickname: 'You (Demo)',
        score: 3,
        isHost: true,
        joinedAt: Date.now(),
      },
      'demo-player-2': {
        nickname: 'Alice',
        score: 1,
        isHost: false,
        joinedAt: Date.now(),
      },
      'demo-player-3': {
        nickname: 'Bob',
        score: -1,
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
      },
      'demo-player-2': {
        nickname: 'Alice',
        score: 12,
        isHost: false,
      },
      'demo-player-3': {
        nickname: 'Bob',
        score: 8,
        isHost: false,
      },
    },
  };
};

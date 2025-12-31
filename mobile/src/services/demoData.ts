import { Game } from '../types/game';

export const DEMO_GAME_CODE = 'DEMO01';
export const DEMO_PLAYER_ID = 'demo-player-1';

export const getDemoGame = (status: Game['status'] = 'waiting'): Game => {
  const baseGame: Game = {
    code: DEMO_GAME_CODE,
    status: status,
    currentRound: 1,
    nextAsker: DEMO_PLAYER_ID,
    players: {
      [DEMO_PLAYER_ID]: {
        nickname: 'You (Demo)',
        score: 0,
        isHost: true,
      },
      'demo-player-2': {
        nickname: 'Alice',
        score: 0,
        isHost: false,
      },
      'demo-player-3': {
        nickname: 'Bob',
        score: 0,
        isHost: false,
      },
    },
    config: {
      hostId: DEMO_PLAYER_ID,
      gameMode: 'rounds',
      targetRounds: 5,
      targetScore: 10,
      timerDuration: 30,
    },
    guesses: {},
    roundResults: {},
    createdAt: Date.now(),
    currentQuestion: undefined,
  };

  return baseGame;
};

export const getDemoGameQuestionEntry = (): Game => {
  return {
    ...getDemoGame('question_entry'),
    currentRound: 1,
    nextAsker: DEMO_PLAYER_ID,
  };
};

export const getDemoGameGuessing = (): Game => {
  return {
    ...getDemoGame('guessing'),
    currentRound: 1,
    currentQuestion: {
      text: 'How many people live in Tokyo?',
      answer: 37400000,
      askedBy: 'demo-player-2',
    },
    nextAsker: 'demo-player-3',
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
      askedBy: 'demo-player-2',
    },
    guesses: {
      round_1: {
        [DEMO_PLAYER_ID]: {
          value: 35000000,
          calculation: '30000000 + 5000000',
          timestamp: Date.now(),
        },
        'demo-player-3': {
          value: 40000000,
          calculation: '40 * 1000000',
          timestamp: Date.now(),
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
            pointsAwarded: 3,
          },
          {
            playerId: 'demo-player-3',
            guess: 40000000,
            percentageError: 6.9,
            pointsAwarded: 2,
          },
        ],
        winner: DEMO_PLAYER_ID,
      },
    },
    players: {
      [DEMO_PLAYER_ID]: {
        nickname: 'You (Demo)',
        score: 3,
        isHost: true,
      },
      'demo-player-2': {
        nickname: 'Alice',
        score: 0,
        isHost: false,
      },
      'demo-player-3': {
        nickname: 'Bob',
        score: 2,
        isHost: false,
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

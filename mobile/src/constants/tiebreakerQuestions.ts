// Predefined tiebreaker questions for end-game ties

export interface TiebreakerQuestion {
  text: string;
  answer: number;
  units?: string;
}

export const TIEBREAKER_QUESTIONS: TiebreakerQuestion[] = [
  {
    text: "How many bones are in the human body?",
    answer: 206,
    units: "bones",
  },
  {
    text: "How many countries are in the world?",
    answer: 195,
    units: "countries",
  },
  {
    text: "How many minutes are in a week?",
    answer: 10080,
    units: "minutes",
  },
  {
    text: "How many keys are on a standard piano?",
    answer: 88,
    units: "keys",
  },
  {
    text: "How many elements are on the periodic table?",
    answer: 118,
    units: "elements",
  },
  {
    text: "How many feet tall is the Statue of Liberty (including pedestal)?",
    answer: 305,
    units: "feet",
  },
  {
    text: "How many dimples are on a regulation golf ball?",
    answer: 336,
    units: "dimples",
  },
  {
    text: "How many miles long is the Great Wall of China?",
    answer: 13171,
    units: "miles",
  },
  {
    text: "How many teeth does an adult human have?",
    answer: 32,
    units: "teeth",
  },
  {
    text: "How many floors does the Empire State Building have?",
    answer: 102,
    units: "floors",
  },
  {
    text: "How many calories are in a Big Mac?",
    answer: 550,
    units: "calories",
  },
  {
    text: "How many hours does the average person sleep in a lifetime?",
    answer: 229961,
    units: "hours",
  },
  {
    text: "How many muscles are in the human body?",
    answer: 600,
    units: "muscles",
  },
  {
    text: "How many species of sharks exist?",
    answer: 500,
    units: "species",
  },
  {
    text: "How many words are in the average novel?",
    answer: 80000,
    units: "words",
  },
];

/**
 * Get a random tiebreaker question
 */
export const getRandomTiebreakerQuestion = (): TiebreakerQuestion => {
  const randomIndex = Math.floor(Math.random() * TIEBREAKER_QUESTIONS.length);
  return TIEBREAKER_QUESTIONS[randomIndex];
};

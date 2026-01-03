export interface FloatingEmoji {
  id: string;
  emoji: string;
  playerId: string;
  startX: number; // Random horizontal offset
  timestamp: number;
}

export const GOOD_EMOJIS = ['🎯', '💯', '🏆', '✨', '🔥', '👏'] as const;
export const BAD_EMOJIS = ['🤮', '💩', '💀', '😬', '😱', '🤯'] as const;

export type GoodEmoji = typeof GOOD_EMOJIS[number];
export type BadEmoji = typeof BAD_EMOJIS[number];

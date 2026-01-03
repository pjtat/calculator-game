/**
 * Creates a deterministic random number generator from a seed string.
 * All players with the same seed will get the same sequence of random numbers.
 */
export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  return function() {
    hash = (hash * 1664525 + 1013904223) % 4294967296;
    return hash / 4294967296;
  };
}

/**
 * Shuffles an array using a seeded random number generator.
 * Ensures deterministic shuffling across different clients.
 */
export function shuffleWithSeed<T>(array: readonly T[], rng: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

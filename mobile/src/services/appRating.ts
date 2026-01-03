/**
 * App Rating Service
 *
 * Manages prompting users to rate the app based on engagement metrics.
 * Uses expo-store-review for native store review dialogs.
 */

import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  GAMES_COMPLETED: '@app_rating:games_completed',
  HAS_RATED: '@app_rating:has_rated',
  LAST_PROMPT_TIME: '@app_rating:last_prompt_time',
  PROMPT_COUNT: '@app_rating:prompt_count',
};

// Configuration
const CONFIG = {
  // Number of games completed before first prompt
  GAMES_BEFORE_FIRST_PROMPT: 3,
  // Minimum days between prompts
  MIN_DAYS_BETWEEN_PROMPTS: 7,
  // Maximum number of times to prompt
  MAX_PROMPTS: 3,
};

/**
 * Get the current rating state from storage.
 */
async function getRatingState(): Promise<{
  gamesCompleted: number;
  hasRated: boolean;
  lastPromptTime: number | null;
  promptCount: number;
}> {
  try {
    const [gamesCompleted, hasRated, lastPromptTime, promptCount] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.GAMES_COMPLETED),
      AsyncStorage.getItem(STORAGE_KEYS.HAS_RATED),
      AsyncStorage.getItem(STORAGE_KEYS.LAST_PROMPT_TIME),
      AsyncStorage.getItem(STORAGE_KEYS.PROMPT_COUNT),
    ]);

    return {
      gamesCompleted: gamesCompleted ? parseInt(gamesCompleted, 10) : 0,
      hasRated: hasRated === 'true',
      lastPromptTime: lastPromptTime ? parseInt(lastPromptTime, 10) : null,
      promptCount: promptCount ? parseInt(promptCount, 10) : 0,
    };
  } catch (error) {
    console.error('Error reading rating state:', error);
    return {
      gamesCompleted: 0,
      hasRated: false,
      lastPromptTime: null,
      promptCount: 0,
    };
  }
}

/**
 * Increment the games completed counter.
 */
export async function incrementGamesCompleted(): Promise<void> {
  try {
    const state = await getRatingState();
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAMES_COMPLETED,
      String(state.gamesCompleted + 1)
    );
  } catch (error) {
    console.error('Error incrementing games completed:', error);
  }
}

/**
 * Mark that the user has rated the app.
 */
export async function markAsRated(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_RATED, 'true');
  } catch (error) {
    console.error('Error marking as rated:', error);
  }
}

/**
 * Check if we should show the rating prompt.
 */
export async function shouldPromptForRating(): Promise<boolean> {
  try {
    const state = await getRatingState();

    // Already rated
    if (state.hasRated) {
      return false;
    }

    // Exceeded max prompts
    if (state.promptCount >= CONFIG.MAX_PROMPTS) {
      return false;
    }

    // Not enough games played
    if (state.gamesCompleted < CONFIG.GAMES_BEFORE_FIRST_PROMPT) {
      return false;
    }

    // Check time since last prompt
    if (state.lastPromptTime) {
      const daysSinceLastPrompt =
        (Date.now() - state.lastPromptTime) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < CONFIG.MIN_DAYS_BETWEEN_PROMPTS) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking rating prompt:', error);
    return false;
  }
}

/**
 * Request a store review.
 * This uses the native store review dialog when available.
 */
export async function requestReview(): Promise<boolean> {
  try {
    // Check if store review is available
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      console.log('Store review not available on this device');
      return false;
    }

    // Update prompt tracking
    const state = await getRatingState();
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT_TIME, String(Date.now())),
      AsyncStorage.setItem(STORAGE_KEYS.PROMPT_COUNT, String(state.promptCount + 1)),
    ]);

    // Request the review
    await StoreReview.requestReview();

    // Note: We can't know if the user actually rated the app from the native dialog
    // The markAsRated() function should be called from a separate UI if needed

    return true;
  } catch (error) {
    console.error('Error requesting review:', error);
    return false;
  }
}

/**
 * Convenience function to check and prompt for rating if appropriate.
 * Call this after significant positive events (game completion, winning, etc.)
 */
export async function maybePromptForRating(): Promise<boolean> {
  const shouldPrompt = await shouldPromptForRating();
  if (shouldPrompt) {
    return requestReview();
  }
  return false;
}

/**
 * Reset all rating state (for testing purposes).
 */
export async function resetRatingState(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.GAMES_COMPLETED),
      AsyncStorage.removeItem(STORAGE_KEYS.HAS_RATED),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_PROMPT_TIME),
      AsyncStorage.removeItem(STORAGE_KEYS.PROMPT_COUNT),
    ]);
  } catch (error) {
    console.error('Error resetting rating state:', error);
  }
}

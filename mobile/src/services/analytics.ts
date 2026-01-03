/**
 * Analytics service for tracking user engagement.
 *
 * Provides simple event tracking for key user actions in the game.
 * Events are logged to console in development and can be extended
 * to use Firebase Analytics, Mixpanel, Amplitude, etc. in production.
 */

// Analytics enabled state
let analyticsEnabled = !__DEV__;

// Event names for consistency
export const AnalyticsEvents = {
  // Game lifecycle
  GAME_CREATED: 'game_created',
  GAME_JOINED: 'game_joined',
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed',
  GAME_REMATCH: 'game_rematch',

  // Gameplay
  QUESTION_SUBMITTED: 'question_submitted',
  GUESS_SUBMITTED: 'guess_submitted',
  ROUND_COMPLETED: 'round_completed',

  // User actions
  TIMER_EXPIRED: 'timer_expired',
  QUESTION_VALIDATED: 'question_validated',
  CUSTOM_ANSWER_USED: 'custom_answer_used',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',

  // Navigation
  SCREEN_VIEW: 'screen_view',
} as const;

type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Log an analytics event.
 */
export function logEvent(eventName: AnalyticsEvent, params?: EventParams): void {
  if (!analyticsEnabled && !__DEV__) return;

  const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...params,
  };

  if (__DEV__) {
    console.log('[Analytics]', eventName, params || {});
  }

  // In production, send to your analytics service
  // Example with Firebase Analytics:
  // import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';
  // firebaseLogEvent(getAnalytics(), eventName, params);
}

/**
 * Track screen views.
 */
export function logScreenView(screenName: string): void {
  logEvent(AnalyticsEvents.SCREEN_VIEW, { screen_name: screenName });
}

/**
 * Track game creation.
 */
export function logGameCreated(params: {
  gameMode: string;
  timerDuration: number;
  targetRounds?: number;
  targetScore?: number;
}): void {
  logEvent(AnalyticsEvents.GAME_CREATED, params);
}

/**
 * Track player joining a game.
 */
export function logGameJoined(params: { playerCount: number }): void {
  logEvent(AnalyticsEvents.GAME_JOINED, params);
}

/**
 * Track game start.
 */
export function logGameStarted(params: { playerCount: number }): void {
  logEvent(AnalyticsEvents.GAME_STARTED, params);
}

/**
 * Track game completion.
 */
export function logGameCompleted(params: {
  totalRounds: number;
  playerCount: number;
  winnerScore: number;
  gameDurationMs?: number;
}): void {
  logEvent(AnalyticsEvents.GAME_COMPLETED, params);
}

/**
 * Track question submission.
 */
export function logQuestionSubmitted(params: {
  wasValidated: boolean;
  usedCustomAnswer: boolean;
}): void {
  logEvent(AnalyticsEvents.QUESTION_SUBMITTED, params);
}

/**
 * Track guess submission.
 */
export function logGuessSubmitted(params: {
  timedOut: boolean;
  usedCalculator: boolean;
}): void {
  logEvent(AnalyticsEvents.GUESS_SUBMITTED, params);
}

/**
 * Track round completion.
 */
export function logRoundCompleted(params: {
  roundNumber: number;
  playerCount: number;
}): void {
  logEvent(AnalyticsEvents.ROUND_COMPLETED, params);
}

/**
 * Track errors for debugging.
 */
export function logError(params: {
  errorType: string;
  errorMessage: string;
  screen?: string;
}): void {
  logEvent(AnalyticsEvents.ERROR_OCCURRED, params);
}

/**
 * Track rematch.
 */
export function logRematch(): void {
  logEvent(AnalyticsEvents.GAME_REMATCH);
}

/**
 * Enable or disable analytics.
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  analyticsEnabled = enabled;
}

/**
 * Check if analytics is enabled.
 */
export function isAnalyticsEnabled(): boolean {
  return analyticsEnabled;
}

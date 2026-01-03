import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Sentry error tracking configuration.
 *
 * Setup instructions:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new React Native project
 * 3. Copy your DSN and add it to your .env file as SENTRY_DSN
 * 4. Add SENTRY_DSN to your app.config.ts extra config
 */

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || '';

export function initializeSentry(): void {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    // Set environment based on build type
    environment: __DEV__ ? 'development' : 'production',
    // Enable performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Disable in development by default
    enabled: !__DEV__,
    // Attach user feedback to errors
    enableAutoSessionTracking: true,
    // Auto-instrument navigation
    enableAutoPerformanceTracing: true,
    // Set the debug flag based on environment
    debug: __DEV__,
    // Filter out non-critical errors
    beforeSend(event) {
      // Filter out network errors that are expected (e.g., offline)
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }
      return event;
    },
  });
}

/**
 * Capture a custom error with context.
 */
export function captureError(
  error: Error,
  context?: Record<string, any>
): void {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
}

/**
 * Log a message to Sentry.
 */
export function logMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user information for error tracking.
 */
export function setUser(userId: string, nickname?: string): void {
  Sentry.setUser({
    id: userId,
    username: nickname,
  });
}

/**
 * Clear user information (e.g., on logout).
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions.
 */
export function addBreadcrumb(
  message: string,
  category: string = 'user',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Start a performance span.
 * Note: Sentry v7+ uses spans instead of transactions.
 */
export function startSpan<T>(
  name: string,
  operation: string,
  callback: () => T
): T {
  if (!SENTRY_DSN) return callback();
  return Sentry.startSpan({ name, op: operation }, callback);
}

/**
 * Wrap a component with Sentry error boundary.
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap screens with Sentry profiling.
 */
export const withSentryProfiler = Sentry.withProfiler;

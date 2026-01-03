import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useConnection } from '../context/ConnectionContext';

/**
 * Hook to guard actions that require network connectivity.
 * Returns a wrapped function that shows an alert if offline.
 */
export function useOfflineGuard() {
  const { canPerformActions, connectionQuality } = useConnection();

  /**
   * Wraps an async function to check for connectivity before executing.
   * Shows an alert if offline and returns undefined.
   */
  const guardAction = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      action: T,
      actionName = 'This action'
    ): ((...args: Parameters<T>) => Promise<ReturnType<T> | undefined>) => {
      return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
        if (!canPerformActions) {
          const message =
            connectionQuality === 'offline'
              ? 'You are currently offline. Please check your internet connection and try again.'
              : 'Connection is unstable. Please wait a moment and try again.';

          Alert.alert('Connection Required', message, [{ text: 'OK' }]);
          return undefined;
        }
        return action(...args);
      };
    },
    [canPerformActions, connectionQuality]
  );

  /**
   * Simply checks if actions can be performed.
   * Use this for disabling buttons.
   */
  const isOffline = !canPerformActions;

  return {
    guardAction,
    isOffline,
    canPerformActions,
  };
}

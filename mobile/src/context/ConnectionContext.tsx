import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { database } from '../services/firebase';

interface ConnectionState {
  // Network connectivity (device level)
  isOnline: boolean;
  networkType: string | null;
  // Firebase connection (server level)
  isFirebaseConnected: boolean;
  isReconnecting: boolean;
  lastConnectedAt: number | null;
}

interface ConnectionContextType extends ConnectionState {
  connectionQuality: 'good' | 'poor' | 'offline';
  // Helper for checking if actions can be performed
  canPerformActions: boolean;
  // Manual retry function
  retryConnection: () => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isOnline: true,
  networkType: null,
  isFirebaseConnected: true,
  isReconnecting: false,
  lastConnectedAt: null,
  connectionQuality: 'good',
  canPerformActions: true,
  retryConnection: () => {},
});

export function useConnection() {
  return useContext(ConnectionContext);
}

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [state, setState] = useState<ConnectionState>({
    isOnline: true,
    networkType: null,
    isFirebaseConnected: true,
    isReconnecting: false,
    lastConnectedAt: null,
  });

  // Network info listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      setState((prev) => ({
        ...prev,
        isOnline: netState.isConnected ?? false,
        networkType: netState.type,
      }));
    });

    // Get initial state
    NetInfo.fetch().then((netState) => {
      setState((prev) => ({
        ...prev,
        isOnline: netState.isConnected ?? false,
        networkType: netState.type,
      }));
    });

    return () => unsubscribe();
  }, []);

  // Firebase connection listener
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;

      setState((prev) => {
        if (connected) {
          return {
            ...prev,
            isFirebaseConnected: true,
            isReconnecting: false,
            lastConnectedAt: Date.now(),
          };
        } else {
          return {
            ...prev,
            isFirebaseConnected: false,
            isReconnecting: prev.lastConnectedAt !== null,
          };
        }
      });
    });

    return () => unsubscribe();
  }, []);

  // Manual retry connection
  const retryConnection = useCallback(() => {
    NetInfo.refresh();
  }, []);

  // Calculate connection quality based on state
  let connectionQuality: 'good' | 'poor' | 'offline';
  if (!state.isOnline) {
    connectionQuality = 'offline';
  } else if (!state.isFirebaseConnected) {
    connectionQuality = state.isReconnecting ? 'poor' : 'offline';
  } else {
    connectionQuality = 'good';
  }

  // Can perform actions if we have network and Firebase connection
  const canPerformActions = state.isOnline && state.isFirebaseConnected;

  return (
    <ConnectionContext.Provider
      value={{
        ...state,
        connectionQuality,
        canPerformActions,
        retryConnection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

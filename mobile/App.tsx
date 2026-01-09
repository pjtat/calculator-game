import { StatusBar } from 'expo-status-bar';
import { useFonts, Orbitron_700Bold, Orbitron_900Black } from '@expo-google-fonts/orbitron';
import AppNavigator from './src/navigation/AppNavigator';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { initializeSentry, SentryErrorBoundary } from './src/services/sentry';

// Initialize Sentry for crash reporting
initializeSentry();

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Orbitron_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0E1A' }}>
        <ActivityIndicator size="large" color="#FF8C42" />
      </View>
    );
  }

  return (
    <SentryErrorBoundary fallback={ErrorFallback}>
      <AppNavigator />
      <StatusBar style="light" />
    </SentryErrorBoundary>
  );
}

function ErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>
        The app ran into an unexpected error. Tap below to restart.
      </Text>
      <TouchableOpacity style={styles.errorButton} onPress={resetError}>
        <Text style={styles.errorButtonText}>Restart App</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E1A',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  errorButton: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A0E1A',
  },
});

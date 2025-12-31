import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import JoinGameScreen from '../screens/JoinGameScreen';
import CreateGameScreen from '../screens/CreateGameScreen';
import LobbyScreen from '../screens/LobbyScreen';
import GameScreen from '../screens/GameScreen';
import GameEndScreen from '../screens/GameEndScreen';

export type RootStackParamList = {
  Home: undefined;
  JoinGame: undefined;
  CreateGame: undefined;
  Lobby: { gameCode: string; playerId: string };
  QuestionEntry: { gameCode: string; playerId: string };
  Game: { gameCode: string; playerId: string };
  Results: { gameCode: string; playerId: string; roundId: string };
  GameEnd: { gameCode: string; playerId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Hide header for all screens (we'll use custom headers)
          contentStyle: { backgroundColor: '#0A0E1A' }, // Dark background
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateGame" component={CreateGameScreen} />
        <Stack.Screen name="JoinGame" component={JoinGameScreen} />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="GameEnd" component={GameEndScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

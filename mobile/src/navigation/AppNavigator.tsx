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
import HowToPlayScreen from '../screens/HowToPlayScreen';

// Import transitions
import { screenTransitions, fade } from '../utils/transitions';

export type RootStackParamList = {
  Home: undefined;
  JoinGame: undefined;
  CreateGame: undefined;
  HowToPlay: undefined;
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
          ...fade, // Default transition
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={screenTransitions.home} />
        <Stack.Screen name="CreateGame" component={CreateGameScreen} options={screenTransitions.createGame} />
        <Stack.Screen name="JoinGame" component={JoinGameScreen} options={screenTransitions.joinGame} />
        <Stack.Screen name="HowToPlay" component={HowToPlayScreen} options={screenTransitions.howToPlay} />
        <Stack.Screen name="Lobby" component={LobbyScreen} options={screenTransitions.lobby} />
        <Stack.Screen name="Game" component={GameScreen} options={screenTransitions.game} />
        <Stack.Screen name="GameEnd" component={GameEndScreen} options={screenTransitions.gameEnd} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

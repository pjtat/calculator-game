import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * Custom screen transition configurations for a polished navigation experience.
 * Uses React Navigation's native stack animator options.
 */

// Default slide from right (standard navigation)
export const slideFromRight: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  animationDuration: 300,
};

// Slide up from bottom (modal-style for Create/Join Game)
export const slideFromBottom: NativeStackNavigationOptions = {
  animation: 'slide_from_bottom',
  animationDuration: 350,
  presentation: 'card',
};

// Fade transition (for dramatic screen changes like Game -> GameEnd)
export const fade: NativeStackNavigationOptions = {
  animation: 'fade',
  animationDuration: 400,
};

// Fade with faster timing (for phase transitions within game)
export const fadeFast: NativeStackNavigationOptions = {
  animation: 'fade',
  animationDuration: 200,
};

// No animation (instant transition)
export const none: NativeStackNavigationOptions = {
  animation: 'none',
};

// iOS-style default (slide with parallax)
export const iosDefault: NativeStackNavigationOptions = {
  animation: 'ios_from_right',
  animationDuration: 350,
};

// Flip animation (for special reveals)
export const flip: NativeStackNavigationOptions = {
  animation: 'flip',
  animationDuration: 400,
};

/**
 * Screen-specific transition presets
 */
export const screenTransitions = {
  // Home -> Create/Join (modal slide up)
  createGame: slideFromBottom,
  joinGame: slideFromBottom,

  // Home -> How to Play (standard slide)
  howToPlay: slideFromRight,

  // Create/Join -> Lobby (fade for new context)
  lobby: fade,

  // Lobby -> Game (fade to indicate game start)
  game: fade,

  // Game -> GameEnd (fade for dramatic conclusion)
  gameEnd: fade,

  // Back to Home (fade for clean reset)
  home: fade,
};

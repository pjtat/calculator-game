import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

/**
 * Sound effects manager for the calculator game.
 *
 * To add sounds, place audio files (mp3/wav) in assets/sounds/ and update the soundFiles object.
 * Recommended sounds:
 * - tick.mp3: Short tick for timer countdown (last 10 seconds)
 * - submit.mp3: Confirmation sound for guess submission
 * - winner.mp3: Celebration sound for round winner
 * - loser.mp3: Sad trombone or similar for round loser
 * - button.mp3: Subtle click for calculator buttons (optional)
 */

type SoundName = 'tick' | 'submit' | 'winner' | 'loser' | 'button' | 'countdown';

// Cache loaded sounds to avoid reloading
const loadedSounds: Map<SoundName, Sound> = new Map();

// Sound file mappings - update paths when adding sound files
const soundFiles: Partial<Record<SoundName, any>> = {
  // Uncomment and update paths when sound files are added:
  // tick: require('../../assets/sounds/tick.mp3'),
  // submit: require('../../assets/sounds/submit.mp3'),
  // winner: require('../../assets/sounds/winner.mp3'),
  // loser: require('../../assets/sounds/loser.mp3'),
  // button: require('../../assets/sounds/button.mp3'),
  // countdown: require('../../assets/sounds/countdown.mp3'),
};

// Sound enabled state (can be toggled by user)
let soundEnabled = true;

/**
 * Initialize the audio system. Call once at app startup.
 */
export async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.warn('Failed to initialize audio:', error);
  }
}

/**
 * Load a sound into memory for quick playback.
 */
async function loadSound(name: SoundName): Promise<Sound | null> {
  if (loadedSounds.has(name)) {
    return loadedSounds.get(name)!;
  }

  const file = soundFiles[name];
  if (!file) {
    // Sound file not configured yet
    return null;
  }

  try {
    const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: false });
    loadedSounds.set(name, sound);
    return sound;
  } catch (error) {
    console.warn(`Failed to load sound ${name}:`, error);
    return null;
  }
}

/**
 * Play a sound effect.
 */
export async function playSound(name: SoundName): Promise<void> {
  if (!soundEnabled) return;

  const sound = await loadSound(name);
  if (sound) {
    try {
      await sound.replayAsync();
    } catch (error) {
      console.warn(`Failed to play sound ${name}:`, error);
    }
  }
}

/**
 * Enable or disable sound effects.
 */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

/**
 * Check if sounds are enabled.
 */
export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Unload all sounds from memory. Call when app is closing.
 */
export async function unloadAllSounds(): Promise<void> {
  for (const sound of loadedSounds.values()) {
    try {
      await sound.unloadAsync();
    } catch (error) {
      console.warn('Failed to unload sound:', error);
    }
  }
  loadedSounds.clear();
}

// Convenience functions for specific sounds
export const playTick = () => playSound('tick');
export const playSubmit = () => playSound('submit');
export const playWinner = () => playSound('winner');
export const playLoser = () => playSound('loser');
export const playButton = () => playSound('button');
export const playCountdown = () => playSound('countdown');

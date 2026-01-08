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

type SoundName = 'timer';

// Background music
let backgroundMusic: Sound | null = null;
let musicEnabled = true;
let musicVolume = 0.3; // Default to 30% volume
let currentTargetVolume = musicVolume; // Track target volume for fades
let hasPlayedMusicBefore = false; // Track if this is initial app start
const REVEAL_MUSIC_VOLUME = 0.12; // 12% volume for reveals
const REVEAL_MUSIC_START_POSITION = 97000; // 1:37 in milliseconds
const FADE_DURATION = 800; // Fade duration in milliseconds
const FADE_STEPS = 20; // Number of steps in fade

// Cache loaded sounds to avoid reloading
const loadedSounds: Map<SoundName, Sound> = new Map();

// Sound file mappings
const soundFiles: Record<SoundName, any> = {
  timer: require('../../assets/sounds/timer.mp3'),
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

// Volume levels for different sounds
const soundVolumes: Record<SoundName, number> = {
  timer: 0.2, // 20% volume
};

/**
 * Play a sound effect.
 */
export async function playSound(name: SoundName): Promise<void> {
  if (!soundEnabled) return;

  const sound = await loadSound(name);
  if (sound) {
    try {
      await sound.setVolumeAsync(soundVolumes[name] ?? 1.0);
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

/**
 * Stop a specific sound effect.
 */
export async function stopSound(name: SoundName): Promise<void> {
  const sound = loadedSounds.get(name);
  if (sound) {
    try {
      await sound.stopAsync();
    } catch (error) {
      console.warn(`Failed to stop sound ${name}:`, error);
    }
  }
}

// Convenience functions for specific sounds
export const playTimer = () => playSound('timer');
export const stopTimer = () => stopSound('timer');

// ============================================
// Background Music
// ============================================

const backgroundMusicFile = require('../../assets/sounds/background-music.mp3');

/**
 * Fade volume from current level to target level.
 */
async function fadeVolume(targetVolume: number, duration: number = FADE_DURATION): Promise<void> {
  if (!backgroundMusic) return;

  try {
    const status = await backgroundMusic.getStatusAsync();
    if (!status.isLoaded) return;

    const startVolume = status.volume;
    const volumeDiff = targetVolume - startVolume;
    const stepDuration = duration / FADE_STEPS;

    for (let i = 1; i <= FADE_STEPS; i++) {
      if (!backgroundMusic) return; // Music was stopped during fade
      const newVolume = startVolume + (volumeDiff * (i / FADE_STEPS));
      await backgroundMusic.setVolumeAsync(Math.max(0, Math.min(1, newVolume)));
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  } catch (error) {
    console.warn('Failed to fade volume:', error);
  }
}

/**
 * Start playing background music on loop.
 * First play starts at full volume, subsequent plays fade in.
 */
export async function playBackgroundMusic(): Promise<void> {
  if (!musicEnabled) return;

  try {
    // If music is already loaded, fade in and resume
    if (backgroundMusic) {
      const status = await backgroundMusic.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await backgroundMusic.setVolumeAsync(0);
        await backgroundMusic.playAsync();
        await fadeVolume(currentTargetVolume);
      }
      return;
    }

    // First time playing: start at full volume (no fade)
    // Subsequent plays: fade in
    const isFirstPlay = !hasPlayedMusicBefore;
    hasPlayedMusicBefore = true;

    const { sound } = await Audio.Sound.createAsync(
      backgroundMusicFile,
      {
        shouldPlay: true,
        isLooping: true,
        volume: isFirstPlay ? musicVolume : 0,
      }
    );
    backgroundMusic = sound;
    currentTargetVolume = musicVolume;

    // Only fade in if not the first play
    if (!isFirstPlay) {
      await fadeVolume(musicVolume);
    }
  } catch (error) {
    console.warn('Failed to play background music:', error);
  }
}

/**
 * Pause background music with fade out (can be resumed later).
 */
export async function pauseBackgroundMusic(): Promise<void> {
  if (backgroundMusic) {
    try {
      await fadeVolume(0);
      await backgroundMusic.pauseAsync();
    } catch (error) {
      console.warn('Failed to pause background music:', error);
    }
  }
}

/**
 * Stop and unload background music with fade out.
 */
export async function stopBackgroundMusic(): Promise<void> {
  if (backgroundMusic) {
    try {
      await fadeVolume(0);
      await backgroundMusic.stopAsync();
      await backgroundMusic.unloadAsync();
      backgroundMusic = null;
    } catch (error) {
      console.warn('Failed to stop background music:', error);
    }
  }
}

/**
 * Set background music volume (0 to 1).
 */
export async function setMusicVolume(volume: number): Promise<void> {
  musicVolume = Math.max(0, Math.min(1, volume));
  currentTargetVolume = musicVolume;
  if (backgroundMusic) {
    try {
      await backgroundMusic.setVolumeAsync(musicVolume);
    } catch (error) {
      console.warn('Failed to set music volume:', error);
    }
  }
}

/**
 * Enable or disable background music.
 */
export async function setMusicEnabled(enabled: boolean): Promise<void> {
  musicEnabled = enabled;
  if (!enabled) {
    await stopBackgroundMusic();
  }
}

/**
 * Check if music is enabled.
 */
export function isMusicEnabled(): boolean {
  return musicEnabled;
}

/**
 * Play background music for reveal sequences (low volume, starting at 1:37) with fade in.
 */
export async function playRevealMusic(): Promise<void> {
  if (!musicEnabled) return;

  try {
    // Fade out and stop any existing music first
    if (backgroundMusic) {
      await fadeVolume(0);
      await backgroundMusic.stopAsync();
      await backgroundMusic.unloadAsync();
      backgroundMusic = null;
    }

    // Load at 0 volume for fade in, starting at 1:37
    const { sound } = await Audio.Sound.createAsync(
      backgroundMusicFile,
      {
        shouldPlay: true,
        isLooping: true,
        volume: 0,
        positionMillis: REVEAL_MUSIC_START_POSITION,
      }
    );
    backgroundMusic = sound;
    currentTargetVolume = REVEAL_MUSIC_VOLUME;
    await fadeVolume(REVEAL_MUSIC_VOLUME);
  } catch (error) {
    console.warn('Failed to play reveal music:', error);
  }
}

/**
 * Play background music for game end screen (normal volume, from start) with fade in.
 */
export async function playGameEndMusic(): Promise<void> {
  if (!musicEnabled) return;

  try {
    // Fade out and stop any existing music first
    if (backgroundMusic) {
      await fadeVolume(0);
      await backgroundMusic.stopAsync();
      await backgroundMusic.unloadAsync();
      backgroundMusic = null;
    }

    // Load at 0 volume for fade in
    const { sound } = await Audio.Sound.createAsync(
      backgroundMusicFile,
      {
        shouldPlay: true,
        isLooping: true,
        volume: 0,
      }
    );
    backgroundMusic = sound;
    currentTargetVolume = musicVolume;
    await fadeVolume(musicVolume);
  } catch (error) {
    console.warn('Failed to play game end music:', error);
  }
}

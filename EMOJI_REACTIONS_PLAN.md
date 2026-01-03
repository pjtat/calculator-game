# Emoji Reactions for BestWorstReveal Screen

## Overview
Add real-time emoji reactions to the Round Highlights screen where players can tap emojis that float up the screen and are visible to all players via Firebase sync.

## Requirements
- **4 emoji buttons** at bottom of screen (above Continue button)
- **Dynamic selection**: 2 from "good" bank + 2 from "bad" bank, randomized per round
  - Good bank: 🎯 💯 🏆 ✨ 🔥 👏
  - Bad bank: 🤮 💩 💀 😬 😱 🤯
- **Synced across all players** via Firebase Realtime Database
- **Unlimited reactions** - players can tap multiple times
- **Float animation**: Emojis float upward and fade out over 2 seconds
- **Deterministic randomization**: All players see same 4 emojis (seeded by gameCode + round)

## Implementation Approach

### 1. Firebase Schema
Store reactions in round results:
```
games/{gameCode}/roundResults/round_{roundNumber}/reactions/{reactionId}
  - playerId: string
  - emoji: string
  - timestamp: number
```

### 2. Component Architecture

**New Components:**
- `FloatingEmoji.tsx` - Self-contained floating animation (React Native Reanimated)
- `EmojiPicker.tsx` - Bottom emoji selection bar with 4 buttons
- `useReactionSync.ts` - Custom hook for Firebase real-time listener

**Modified Components:**
- `BestWorstReveal/index.tsx` - Orchestrate picker + floating emojis
- Type definitions, Firebase service, GameScreen props

### 3. Animation Strategy
- Use React Native Reanimated (matches app patterns)
- Float up 300px over 2000ms with ease-out easing
- Fade out opacity 1→0 simultaneously
- Random horizontal offset (-100 to +100px) for variety
- Auto-cleanup on animation complete

### 4. Emoji Selection Algorithm
```typescript
// Deterministic seeded RNG ensures all players see same emojis
const seed = `${gameCode}-${currentRound}`;
const rng = seededRandom(seed);
const good = shuffleWithSeed(GOOD_EMOJIS, rng).slice(0, 2);
const bad = shuffleWithSeed(BAD_EMOJIS, rng).slice(0, 2);
```

### 5. Performance Safeguards
- Max 15 floating emojis on screen (remove oldest if exceeded)
- Throttle: max 1 reaction per emoji per 200ms
- Use `useNativeDriver: true` for smooth animations
- Haptic feedback on tap (lightTap)

## Files to Create

1. **`mobile/src/components/BestWorstReveal/types.ts`**
   - `FloatingEmoji` interface
   - `GOOD_EMOJIS` and `BAD_EMOJIS` constants

2. **`mobile/src/components/BestWorstReveal/FloatingEmoji.tsx`**
   - Floating animation component
   - 2s upward float + fade out
   - Calls onComplete for cleanup

3. **`mobile/src/components/BestWorstReveal/EmojiPicker.tsx`**
   - 4 emoji buttons in row
   - Press animations + haptics
   - Positioned above Continue button

4. **`mobile/src/components/BestWorstReveal/useReactionSync.ts`**
   - Firebase `onChildAdded` listener
   - Calls callback when new reaction received

5. **`mobile/src/utils/seededRandom.ts`**
   - `seededRandom(seed)` - Deterministic RNG
   - `shuffleWithSeed(array, rng)` - Shuffle with seeded RNG

## Files to Modify

1. **`mobile/src/types/game.ts`** (line ~49)
   - Add `EmojiReaction` interface
   - Update `RoundResult` to include `reactions?: { [id: string]: EmojiReaction }`

2. **`mobile/src/components/BestWorstReveal/index.tsx`**
   - Add props: `gameCode`, `currentRound`
   - Add state: `floatingEmojis`, selected emojis
   - Integrate `useReactionSync` hook
   - Render `EmojiPicker` (during 'complete' phase)
   - Render `FloatingEmoji` components in overlay container
   - Add `handleEmojiPress` - submit to Firebase
   - Add `handleEmojiComplete` - remove from state
   - New styles: `floatingEmojiContainer`, emoji-related styles

3. **`mobile/src/services/firebase.ts`**
   - Add `submitReaction(gameCode, roundNumber, playerId, emoji)` function
   - Uses Firebase `push()` to add reaction to reactions node

4. **`mobile/src/screens/GameScreen.tsx`** (lines ~412-435)
   - Pass `gameCode={game.code}` to BestWorstReveal
   - Pass `currentRound={game.currentRound}` to BestWorstReveal

## Implementation Sequence

### Step 1: Type Definitions & Utilities
1. Create `mobile/src/components/BestWorstReveal/types.ts`
2. Create `mobile/src/utils/seededRandom.ts`
3. Update `mobile/src/types/game.ts` (add EmojiReaction, update RoundResult)

### Step 2: FloatingEmoji Component
1. Create `mobile/src/components/BestWorstReveal/FloatingEmoji.tsx`
2. Implement Reanimated animations (translateY, opacity)
3. Test standalone with mock data

### Step 3: EmojiPicker Component
1. Create `mobile/src/components/BestWorstReveal/EmojiPicker.tsx`
2. Implement seeded emoji selection logic
3. Add press animations + haptic feedback
4. Test standalone rendering

### Step 4: Firebase Integration
1. Add `submitReaction` to `mobile/src/services/firebase.ts`
2. Create `mobile/src/components/BestWorstReveal/useReactionSync.ts`
3. Test Firebase writes/reads

### Step 5: BestWorstReveal Integration
1. Update `mobile/src/components/BestWorstReveal/index.tsx`:
   - Add new props
   - Add floating emoji state management
   - Integrate EmojiPicker component
   - Integrate useReactionSync hook
   - Wire up handleEmojiPress → submitReaction
   - Render FloatingEmoji components
   - Add styles
2. Update `mobile/src/screens/GameScreen.tsx` to pass new props

### Step 6: Polish & Testing
1. Add performance limits (max 15 emojis, throttling)
2. Test multiplayer sync with 3+ players
3. Test edge cases (offline, spam clicking, skip during animations)
4. Verify animations smooth on lower-end devices

## Critical Implementation Details

### Emoji Picker Visibility
- Only show during `phase === 'complete'`
- Prevents distraction during best/worst/snark animations
- Use `pointerEvents="box-none"` wrapper to allow skip taps through

### Z-Index Layering
```
- Floating emoji container: zIndex 100, pointerEvents="none"
- Skip tap area: zIndex 1 (existing TouchableWithoutFeedback)
- Emoji picker: zIndex 10, pointerEvents="box-none" on wrapper
```

### Real-time Sync Flow
1. Player taps emoji → `handleEmojiPress(emoji)`
2. Call `submitReaction()` → writes to Firebase
3. Firebase listener triggers `onChildAdded`
4. `useReactionSync` calls callback with reaction data
5. Add new `FloatingEmoji` to state array
6. Animation starts automatically on mount
7. On complete, `handleEmojiComplete` removes from state

### Performance Optimization
- Limit floating emojis array to 15 max (slice oldest)
- Throttle reactions using `lastReactionTime` ref (200ms per emoji)
- Clean up listeners on unmount
- Use `useNativeDriver: true` for all animations

## Edge Cases

1. **Offline/Disconnected**: Reactions fail silently (non-critical feature)
2. **Skip during animations**: Floating emojis continue animating (don't interrupt)
3. **Multiple players spam**: Max 15 limit prevents performance issues
4. **Same emoji selection**: Seeded RNG ensures consistency across players
5. **Phase changes**: Emoji picker only shown during 'complete' phase

## Testing Checklist

- [ ] Seeded RNG produces same emojis for all players in same round
- [ ] Different emojis selected for different rounds
- [ ] Tap emoji → appears and floats up
- [ ] Multiple simultaneous emojis animate smoothly
- [ ] Max 15 emoji limit enforced
- [ ] Throttling prevents spam (200ms)
- [ ] Haptic feedback on tap
- [ ] Real-time sync across 2+ devices
- [ ] Skip works with emoji picker visible
- [ ] Offline behavior (graceful failure)

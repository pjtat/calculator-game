# Implementation Plan: Two Interactive Demo Modes

## Overview
Replace the current static demo mode with two interactive demo experiences:
- **Asker Mode**: User experiences being the question asker with 6 bot participants
- **Participant Mode**: User experiences being a guesser with 1 bot asker + 5 bot participants

## User Requirements
- 7 total players (user + 6 bots)
- One complete round walkthrough
- Manual progression that mirrors real app (auto-advance only when all players submit, just like real game)
- Real user interaction (type actual questions in asker mode, make actual guesses in participant mode)

## Architecture

### Two Demo Game Codes
```
DEMO_ASKER = 'DEMOASK'      // User is the asker
DEMO_PARTICIPANT = 'DEMOPAR' // User is a participant/guesser
```

### Bot System (Simplified)
- 6 bot players with fixed percentage offsets
- Staggered submission timing (1-2 seconds each) for realism
- Fixed offsets for predictable variety:
  - Bot 1: +5% (very close)
  - Bot 2: -12% (good)
  - Bot 3: +40% (medium)
  - Bot 4: -33% (medium)
  - Bot 5: +85% (bad)
  - Bot 6: -60% (bad)
- Simple calculation: `answer * (1 + offset)`

## Game Flow

### Asker Mode Flow
1. **Lobby** → User clicks "Start Game"
2. **Question Entry** → User types and validates real question
3. **Asker Waiting** → Bots auto-submit guesses over 5-10 seconds
   - Show live counter: "3 / 6 players submitted"
   - Auto-advance when all bots submit (mimics real game)
4. **Results** → User clicks "Continue"
5. **Best/Worst Reveal** → User clicks "View Standings"
6. **Standings** → Shows "Game Complete"

### Participant Mode Flow
1. **Lobby** → User clicks "Start Game"
2. **Waiting for Question** → Bot asks pre-selected question (2 second delay)
3. **Guessing** → User makes real guess with calculator
   - After user submits, remaining bots submit over 3-5 seconds
   - Auto-advance when all submit
4. **Results** → User clicks "Continue"
5. **Best/Worst Reveal** → User clicks "View Standings"
6. **Standings** → Shows "Game Complete"

## Implementation Steps

### 1. Create Bot Engine (Simplified - ~80 lines total)
**New file**: `calculator-game/mobile/src/services/demoEngine.ts`
- Define 6 bot player profiles (names, IDs) - ~30 lines
- Fixed percentage offsets array - ~10 lines
- Simple `generateBotGuess()` using offsets - ~10 lines
- `scheduleBotSubmissions()` with setTimeout - ~20 lines
- 3-5 pre-curated questions for participant mode - ~10 lines

### 2. Extend Demo Data
**Modify**: `calculator-game/mobile/src/services/demoData.ts`
- Add `DEMO_ASKER` and `DEMO_PARTICIPANT` constants
- Add `DEMO_USER_ID = 'demo-user'` constant
- Update player count from 8 to 7 (user + 6 bots)
- Create asker mode state generators (user is asker, bots guess)
- Create participant mode state generators (bot is asker, user + bots guess)
- Update bot names to be distinct from "You"

### 3. Update Demo State Management
**Modify**: `calculator-game/mobile/src/services/firebase.ts`
- Add separate state variables for each demo mode:
  ```typescript
  let demoAskerState: Game;
  let demoParticipantState: Game;
  let demoAskerListeners: Array<(game: Game) => void> = [];
  let demoParticipantListeners: Array<(game: Game) => void> = [];
  ```
- Update `listenToGame()` to detect `DEMO_ASKER` and `DEMO_PARTICIPANT` codes
- Intercept `submitQuestion()` in asker mode to:
  - Store user's question in demo state
  - Transition to 'guessing' status
  - Schedule bot guess submissions
- Intercept `submitGuess()` in participant mode to:
  - Store user's guess
  - Schedule remaining bot submissions
- Hook into existing auto-advance logic (line 80-82 in GameScreen.tsx)

### 4. Update Home Screen
**Modify**: `calculator-game/mobile/src/screens/HomeScreen.tsx`
- Replace current 3-tap Alert (lines 36-56) with two demo options:
  ```
  Alert with two buttons:
  1. "Demo as Asker" → Navigate to Lobby with DEMOASK code
  2. "Demo as Participant" → Navigate to Lobby with DEMOPAR code
  ```
- Keep the 3-tap trigger mechanism
- Update playerId to `DEMO_USER_ID` for both modes

### 5. Update Demo Controls
**Modify**: `calculator-game/mobile/src/components/DemoControls.tsx`
- Update to work with both demo modes
- Add indicator showing current demo mode ("Asker Demo" / "Participant Demo")
- Update screen options for each mode

## Critical Files

1. **CREATE**: `calculator-game/mobile/src/services/demoEngine.ts`
   - Bot player definitions
   - Guess generation algorithm
   - Submission scheduling logic

2. **MODIFY**: `calculator-game/mobile/src/services/demoData.ts`
   - Add new demo constants
   - Reduce players from 8 to 7
   - Add mode-specific state generators

3. **MODIFY**: `calculator-game/mobile/src/services/firebase.ts`
   - Add demo mode detection for new codes
   - Integrate bot submission scheduling
   - Handle real user input interception

4. **MODIFY**: `calculator-game/mobile/src/screens/HomeScreen.tsx`
   - Update demo trigger to offer two options

5. **MODIFY**: `calculator-game/mobile/src/components/DemoControls.tsx`
   - Support both demo modes
   - Add mode indicator

## Key Design Decisions

### Why Two Game Codes?
- Simpler routing logic than mode parameters
- Consistent with current `DEMO_GAME_CODE` pattern
- Easy to detect and handle separately

### Why Dynamic State Generation?
- Allows incorporating real user input (questions/guesses)
- More engaging than static pre-recorded states
- Demonstrates actual gameplay mechanics

### Bot Submission Timing
- Stagger submissions by 1-2 seconds each for realism
- Auto-advance triggers when all non-asker players submit (reuses existing logic at GameScreen.tsx:80-82)
- Timer is cosmetic in participant mode (shows countdown but doesn't force expiration)

### Pre-curated Questions for Participant Mode
Example questions to include:
1. "How many people live in Tokyo?" (Answer: 37,400,000)
2. "How tall is the Eiffel Tower in feet?" (Answer: 1,083)
3. "How many McDonald's restaurants are in the world?" (Answer: 40,275)

## Testing Checklist
- [ ] Asker mode: Submit various question types, verify bot guesses are reasonable
- [ ] Participant mode: Make very good/bad guesses, verify ranking calculation
- [ ] Auto-advance: Confirm transitions happen when all bots submit
- [ ] State isolation: Ensure no state leakage between demo modes
- [ ] Edge cases: Invalid questions, extreme answers

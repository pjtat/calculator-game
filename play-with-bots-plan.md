# Plan: Convert Demo Mode to "Play with Bots" Mode

## Overview

Transform the existing demo mode into a "Play with Bots" experience where:
- 6 bots compete with the user
- User answers (guesses) every third question
- When it's the user's turn to ask, they submit a real question
- Bots ask questions from a pre-curated pool on their turns

## Current State Analysis

**What already exists:**
- 6 bot players with offset-based guess generation (`demoEngine.ts:8-15`)
- Interactive demo modes: `DEMOASK` and `DEMOPAR` (`firebase.ts`)
- Bot guess generation with staggered timing (`firebase.ts:602-630`)
- Pre-curated demo questions (3 questions in `demoEngine.ts:18-32`)
- Question rotation via `nextAsker` field
- Full game flow: question_entry → guessing → results → best_worst → standings

**What's missing:**
- Unified mode that alternates between user asking and user guessing
- Turn rotation logic (every 3rd question = user's turn to ask)
- Larger pool of bot questions
- Entry point for the new mode

## Implementation Plan

### 1. Add Bot Question Pool
**File:** `mobile/src/services/demoEngine.ts`
**Changes:** Expand from 3 to ~15-20 pre-curated trivia questions

```typescript
export const BOT_QUESTION_POOL = [
  { text: "How many people live in Tokyo?", answer: 37400000, units: "people" },
  { text: "How tall is the Eiffel Tower in feet?", answer: 1083, units: "feet" },
  // ... add 12-17 more varied trivia questions
];
```

~30 new lines

---

### 2. Create Play-With-Bots Game Mode
**File:** `mobile/src/services/firebase.ts`
**Changes:**

a) Add new game code constant:
```typescript
export const PLAY_WITH_BOTS_CODE = 'BOTSPLAY';
```

b) Add state generator function `getPlayWithBotsGame()`:
- Initialize 7 players (user + 6 bots)
- Set initial asker rotation order
- Configure for appropriate number of rounds

c) Add turn rotation logic:
- Track asker order: [Bot1, Bot2, USER, Bot3, Bot4, USER, Bot5, Bot6, USER, ...]
- When advancing round, pick next asker from rotation

d) Add bot question submission:
- When a bot is the asker, auto-submit a question from the pool
- Remove used questions to avoid repeats

~80-100 new lines

---

### 3. Add Initial Game State
**File:** `mobile/src/services/demoData.ts`
**Changes:** Add `getPlayWithBotsInitialState()` function

- Similar to existing `getInteractiveDemoGame()` but with:
  - Asker rotation array
  - Round counter
  - Bot question queue

~40 new lines

---

### 4. Handle Bot Asking Flow
**File:** `mobile/src/services/firebase.ts` (in `listenToPlayWithBotsGame`)
**Changes:**

When game status transitions to `question_entry` and asker is a bot:
1. Wait 1-2 seconds (simulate "thinking")
2. Auto-submit question from pool
3. Transition to `guessing` status

~30 new lines

---

### 5. Update GameScreen for User Feedback
**File:** `mobile/src/screens/GameScreen.tsx`
**Changes:**

- Display "Bot X is thinking of a question..." when bot is asking
- Show question number indicator: "Question 3 of 12"
- Potentially show turn preview: "You'll ask next!" when appropriate

~20-30 lines modified

---

### 6. Add Entry Point
**File:** `mobile/src/screens/HomeScreen.tsx`
**Changes:**

Option A: Replace the 3-tap secret menu with a visible "Play with Bots" button
Option B: Keep as hidden feature, add third option in secret menu

~10-20 lines

---

### 7. Update Types (if needed)
**File:** `mobile/src/types/game.ts`
**Changes:**

Add optional fields to Game interface:
```typescript
askerRotation?: string[];  // ordered list of player IDs for asking
botQuestionQueue?: Question[];  // remaining bot questions
```

~5 lines

---

## Summary of Scope

| File | Estimated Changes |
|------|-------------------|
| `demoEngine.ts` | +30 lines (question pool) |
| `firebase.ts` | +100-120 lines (mode logic) |
| `demoData.ts` | +40 lines (initial state) |
| `GameScreen.tsx` | +20-30 lines (UI feedback) |
| `HomeScreen.tsx` | +10-20 lines (entry point) |
| `types/game.ts` | +5 lines (new fields) |

**Total: ~210-250 new/modified lines**

## Extensiveness Rating: **Medium**

- Most infrastructure exists (bots, guessing, results, scoring)
- Main new work is asker rotation orchestration
- No new screens or major UI components needed

## Design Decisions (Confirmed)

1. **Entry point**: Hidden in dev menu (3-tap version number) - add as third option
2. **Number of rounds**: User-configurable before starting
3. **User asking frequency**: Every 3rd question
4. **Question pool approach**: Generate via Gemini on-demand

---

## Revised Implementation (with confirmed choices)

### Additional Changes Needed:

**Round Configuration UI:**
- Add a simple configuration screen/modal before game starts
- Slider or buttons to select: 6, 9, 12, or 15 total rounds
- Show breakdown: "You'll ask X questions, bots will ask Y"

**Gemini Question Generation:**
- New function in `gemini.ts`: `generateTriviaQuestion()`
- Returns: `{ text, answer, units }`
- Prompt: Generate a numeric trivia question with a verifiable answer
- Cache 2-3 questions ahead to reduce perceived latency
- Add loading state: "Alex is thinking of a question..."

### Updated Scope Estimate

| File | Estimated Changes |
|------|-------------------|
| `demoEngine.ts` | +20 lines (rotation logic) |
| `firebase.ts` | +120-140 lines (mode + config) |
| `demoData.ts` | +50 lines (initial state) |
| `gemini.ts` | +60 lines (question generation) |
| `GameScreen.tsx` | +30-40 lines (loading state UI) |
| `HomeScreen.tsx` | +30 lines (config modal + menu option) |
| `types/game.ts` | +10 lines (new fields) |

**Total: ~320-360 new/modified lines**

## Revised Extensiveness Rating: **Medium-High**

The Gemini question generation adds:
- New API integration complexity
- Question caching/pre-fetching logic
- Loading state handling
- Potential error handling for API failures

Still very doable, but ~30-40% more work than the curated approach.

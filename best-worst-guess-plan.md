# Implementation Plan: Best/Worst Guess Reveal Screen

## Overview
Add a new screen between round results and standings that highlights the best and worst guesses, with a Gemini-generated snarky remark contextualizing how bad the worst guess was.

## User Requirements Summary
- **Timing**: Show after every round
- **Content**: Best guess (player, value, accuracy), Worst guess (player, value, % off), AI-generated snarky remark
- **Tone**: Playfully snarky, lighthearted roasting
- **Navigation**: Continue button (only next asker can advance)
- **Best guess treatment**: Just show stats, no AI praise

## Architectural Approach

### New Game Status
Add `'best_worst_reveal'` status to game flow:
- `'results'` (AnswerReveal) → `'best_worst_reveal'` (NEW) → `'standings'` (StandingsView)
- Maintains Firebase sync pattern - all players see screen simultaneously

### Gemini API Integration
- Generate snarky remark during `calculateAndSubmitResults()` in firebase.ts
- Call Gemini API once, store result in Firebase
- All players see same remark (consistency + efficiency)
- Graceful fallback if API fails (continue without remark)

### Component Structure
New component `/src/components/BestWorstReveal/index.tsx` modeled after AnswerReveal:
- Phase-based animations (slide in best → slide in worst → reveal snarky remark → show button)
- Tap to skip functionality
- Continue button with "waiting for..." state

## Implementation Steps

### Step 1: Update Type Definitions
**File**: `calculator-game/mobile/src/types/game.ts`

Add new status to GameStatus type:
```typescript
export type GameStatus =
  | 'waiting'
  | 'question_entry'
  | 'guessing'
  | 'results'
  | 'best_worst_reveal'  // NEW
  | 'standings'
  | 'ended';
```

Add snarky remark to RoundResult interface:
```typescript
export interface RoundResult {
  winner: string;
  loser: string;
  correctAnswer: number;
  rankings: RoundRanking[];
  snarkyRemark?: string | null;  // NEW - optional for backward compatibility
}
```

### Step 2: Add Gemini API Function
**File**: `calculator-game/mobile/src/services/gemini.ts`

Add new export interface and function following existing patterns:

```typescript
export interface SnarkyRemarkResult {
  success: boolean;
  remark?: string;
  errorMessage?: string;
}

export const generateSnarkyRemark = async (
  questionText: string,
  correctAnswer: number,
  worstGuess: number,
  units?: string
): Promise<SnarkyRemarkResult>
```

**Implementation details**:
- Follow existing pattern from `validateQuestion` and `convertUnits`
- Use temperature: 0.7 (more creative than validation tasks)
- maxOutputTokens: 256
- responseMimeType: 'application/json'
- Error handling: Return success: false on failures, don't throw

**Prompt structure**:
```
You are a playfully snarky game show host commenting on a terrible guess.

Question: "${questionText}"
Correct Answer: ${correctAnswer} ${units || ''}
Worst Guess: ${worstGuess} ${units || ''}

Generate a lighthearted, funny remark that contextualizes how far off the worst guess was.
Use comparisons to well-known facts or familiar quantities.

Rules:
- Keep it playful and fun, not mean or hurtful
- One sentence only (max 100 characters)
- Use specific comparisons when possible
- Don't mention the player's name
- Focus on the magnitude of the error

Respond in JSON format:
{
  "remark": "<the snarky comment>"
}

ONLY respond with the JSON object, nothing else.
```

### Step 3: Modify Results Calculation
**File**: `calculator-game/mobile/src/services/firebase.ts`

Update `calculateAndSubmitResults()` function (keep status as 'results', generate remark):

1. After calculating rankings, extract worst guess:
   ```typescript
   const worstRanking = rankings[rankings.length - 1];
   const worstGuess = worstRanking?.guess;
   ```

2. Generate snarky remark (only if worst player actually guessed):
   ```typescript
   let snarkyRemark: string | null = null;
   if (worstGuess !== null) {
     try {
       const remarkResult = await generateSnarkyRemark(
         game.currentQuestion?.text || '',
         correctAnswer,
         worstGuess,
         game.currentQuestion?.units
       );
       snarkyRemark = remarkResult.success ? remarkResult.remark || null : null;
     } catch (error) {
       console.error('Failed to generate snarky remark:', error);
       // Continue without remark - don't block game
     }
   }
   ```

3. Include remark in RoundResult:
   ```typescript
   const result: RoundResult = {
     winner: rankings[0]?.playerId || '',
     loser: rankings[rankings.length - 1]?.playerId || '',
     correctAnswer,
     rankings,
     snarkyRemark,  // NEW
   };
   ```

4. Keep status as 'results' (no change needed here - AnswerReveal will transition to best_worst_reveal)

### Step 4: Create BestWorstReveal Component
**File**: `calculator-game/mobile/src/components/BestWorstReveal/index.tsx` (NEW FILE)

Model after AnswerReveal component structure (use as reference for patterns).

**Props Interface**:
```typescript
export interface BestWorstRevealProps {
  bestPlayer: { id: string; name: string; guess: number; percentError: number | null };
  worstPlayer: { id: string; name: string; guess: number; percentError: number | null };
  correctAnswer: number;
  questionText: string;
  units?: string;
  snarkyRemark: string | null;
  currentPlayerId: string;
  onComplete: () => void;
  canContinue: boolean;
  nextAskerName?: string;
}
```

**Animation Phases**:
```typescript
type RevealPhase = 'best' | 'worst' | 'snark' | 'complete';
```

1. `'best'` - Slide in best guess from right with accuracy stats (2s)
2. `'worst'` - Slide in worst guess from left with % off (2s)
3. `'snark'` - Fade in snarky remark if available (3s)
4. `'complete'` - Fade in continue button

**Key Features**:
- Use React Native Animated API (slideInRight, slideInLeft, fadeIn animations)
- TouchableWithoutFeedback wrapper for tap-to-skip functionality
- Display format:
  - Best: "🏆 BEST GUESS" + player name + guess value + "X% accurate"
  - Worst: "💩 WORST GUESS" + player name + guess value + "X% off"
  - Snark: Speech bubble or card with remark text (if available)
- Fallback if no remark: "The worst guess was X% off!" (simple text)
- Continue button: Primary button for next asker, "Waiting for..." text for others
- Style consistency: Use Colors, Spacing, FontSizes, FontWeights, BorderRadius from theme

**Helper Functions**:
```typescript
const calculateAccuracy = (percentError: number | null): string => {
  if (percentError === null) return 'No guess';
  const accuracy = Math.max(0, 100 - percentError);
  return `${accuracy.toFixed(1)}% accurate`;
};

const calculatePercentOff = (percentError: number | null): string => {
  if (percentError === null) return 'No guess';
  return `${percentError.toFixed(1)}% off`;
};
```

### Step 5: Update GameScreen
**File**: `calculator-game/mobile/src/screens/GameScreen.tsx`

**5.1 Add Imports** (near top with other imports):
```typescript
import BestWorstReveal from '../components/BestWorstReveal';
```

**5.2 Add Handler Function** (near other handler functions like handleViewStandings):
```typescript
const handleContinueFromResults = async () => {
  try {
    await update(ref(database, `games/${gameCode}`), {
      status: 'best_worst_reveal',
    });
  } catch (error) {
    console.error('Error moving to best/worst:', error);
    Alert.alert('Error', 'Failed to continue. Please try again.');
  }
};
```

**5.3 Update AnswerReveal Handler** (line ~388):
Change:
```typescript
onComplete={handleViewStandings}
```
To:
```typescript
onComplete={handleContinueFromResults}
```

**5.4 Add New Conditional Render** (after AnswerReveal block, before standings):
Insert between lines 392 and 394:

```typescript
{game.status === 'best_worst_reveal' && game.roundResults[`round_${game.currentRound}`] && (
  <BestWorstReveal
    bestPlayer={{
      id: game.roundResults[`round_${game.currentRound}`].rankings[0]?.playerId || '',
      name: game.players[game.roundResults[`round_${game.currentRound}`].rankings[0]?.playerId]?.nickname || 'Unknown',
      guess: game.roundResults[`round_${game.currentRound}`].rankings[0]?.guess ?? 0,
      percentError: game.roundResults[`round_${game.currentRound}`].rankings[0]?.percentageError ?? null,
    }}
    worstPlayer={{
      id: game.roundResults[`round_${game.currentRound}`].rankings[game.roundResults[`round_${game.currentRound}`].rankings.length - 1]?.playerId || '',
      name: game.players[game.roundResults[`round_${game.currentRound}`].rankings[game.roundResults[`round_${game.currentRound}`].rankings.length - 1]?.playerId]?.nickname || 'Unknown',
      guess: game.roundResults[`round_${game.currentRound}`].rankings[game.roundResults[`round_${game.currentRound}`].rankings.length - 1]?.guess ?? 0,
      percentError: game.roundResults[`round_${game.currentRound}`].rankings[game.roundResults[`round_${game.currentRound}`].rankings.length - 1]?.percentageError ?? null,
    }}
    correctAnswer={game.roundResults[`round_${game.currentRound}`].correctAnswer}
    questionText={game.currentQuestion?.text || ''}
    units={game.currentQuestion?.units}
    snarkyRemark={game.roundResults[`round_${game.currentRound}`].snarkyRemark || null}
    currentPlayerId={playerId}
    onComplete={handleViewStandings}
    canContinue={game.nextAsker === playerId}
    nextAskerName={game.players[game.nextAsker]?.nickname}
  />
)}
```

## Updated Flow Diagram

```
Results Calculation
  ↓
calculateAndSubmitResults()
  ├─ Calculate rankings
  ├─ Generate snarky remark (Gemini API)
  ├─ Store roundResult with remark
  └─ Set status: 'results'
  ↓
AnswerReveal Component
  ├─ Show drumroll
  ├─ Reveal answer
  ├─ Show guesses
  ├─ Reveal identities
  └─ Continue → handleContinueFromResults()
  ↓
Set status: 'best_worst_reveal'
  ↓
BestWorstReveal Component
  ├─ Slide in best guess
  ├─ Slide in worst guess
  ├─ Show snarky remark
  └─ Continue → handleViewStandings()
  ↓
Set status: 'standings'
  ↓
StandingsView Component
```

## Error Handling & Edge Cases

### Gemini API Failures
- Store `null` for snarkyRemark on failures
- Component shows fallback: "The worst guess was X% off!"
- Game continues normally without blocking

### Single Player / Same Best and Worst
- Show both panels (will be same player)
- Snarky remark can still be generated
- UI stays consistent

### Null Guesses (Timeout)
- If worst player didn't guess (`worstGuess === null`), skip remark generation
- Display "Didn't submit a guess" in worst player panel
- No snarky remark shown

### Network Issues
- Wrap Gemini call in try/catch
- Use timeout (built into fetch, but could add explicit timeout if needed)
- Continue without remark on timeout/error

## Files Summary

### Files to Create (1)
- `calculator-game/mobile/src/components/BestWorstReveal/index.tsx`

### Files to Modify (4)
- `calculator-game/mobile/src/types/game.ts`
- `calculator-game/mobile/src/services/gemini.ts`
- `calculator-game/mobile/src/services/firebase.ts`
- `calculator-game/mobile/src/screens/GameScreen.tsx`

## Testing Checklist
- [ ] Snarky remark appears after every round
- [ ] All players see the same screen and remark simultaneously
- [ ] Animations are smooth and can be skipped by tapping
- [ ] Continue button only active for next asker
- [ ] Graceful fallback when Gemini API fails
- [ ] Edge cases handled (null guesses, single player, same best/worst)
- [ ] Tone is playful and lighthearted, not offensive or mean
- [ ] No regressions in existing game flow

## Notes
- The snarkyRemark field is optional in RoundResult for backward compatibility
- Old games without this field will show the fallback message
- No database migration needed

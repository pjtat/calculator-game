# Calculator Game - Technical Architecture

## Overview
A multiplayer estimation game where players guess quantifiable answers using a calculator interface. Closest guess wins points, furthest loses points.

## Tech Stack

### Frontend
- **React Native** (via Expo)
- **TypeScript** for type safety
- **React Navigation** for screen management
- **React Native Reanimated** for animations (v2)

### Backend & Real-time
- **Firebase Realtime Database** for game state synchronization
- **Firebase Authentication** (Anonymous) for session management

### AI/LLM
- **Google Gemini Flash API** for answer verification
  - Free tier: 1,500 requests/day
  - Cost: ~$0.10 per 1M tokens if exceeding free tier

### State Management
- **React Context + Hooks** for local state
- Firebase listeners for real-time sync

---

## Firebase Schema Design

```json
{
  "games": {
    "GAME_CODE_12AB": {
      "config": {
        "gameMode": "rounds",           // "rounds" | "score"
        "targetRounds": 10,              // if gameMode === "rounds"
        "targetScore": 10,               // if gameMode === "score"
        "timerDuration": 30,             // seconds (v1: fixed at 30)
        "createdAt": 1234567890,
        "hostId": "player_uuid_1"
      },
      "status": "waiting",               // "waiting" | "question_entry" | "guessing" | "results" | "ended"
      "currentRound": 1,
      "currentQuestion": {
        "text": "How many restaurants are in NYC?",
        "answer": 27000,
        "askedBy": "player_uuid_2",
        "submittedAt": 1234567890
      },
      "players": {
        "player_uuid_1": {
          "nickname": "Alex",
          "score": 3,
          "isHost": true,
          "joinedAt": 1234567890
        },
        "player_uuid_2": {
          "nickname": "Jordan",
          "score": -1,
          "isHost": false,
          "joinedAt": 1234567891
        }
      },
      "guesses": {
        "round_1": {
          "player_uuid_1": {
            "value": 25000,
            "calculation": "5 boroughs * 5000",
            "submittedAt": 1234567920
          },
          "player_uuid_2": {
            "value": null,              // didn't submit in time
            "calculation": "",
            "submittedAt": null
          }
        }
      },
      "roundResults": {
        "round_1": {
          "winner": "player_uuid_1",
          "loser": "player_uuid_2",
          "correctAnswer": 27000,
          "rankings": [
            {
              "playerId": "player_uuid_1",
              "guess": 25000,
              "percentageError": 7.4,
              "pointsAwarded": 1
            },
            {
              "playerId": "player_uuid_2",
              "guess": null,
              "percentageError": null,
              "pointsAwarded": -1
            }
          ]
        }
      },
      "nextAsker": "player_uuid_1"     // who asks next question
    }
  }
}
```

---

## Game State Flow

```
1. WAITING
   ↓ (host starts game)
2. QUESTION_ENTRY
   ↓ (asker submits question → LLM validates → answer stored)
3. GUESSING
   ↓ (timer expires or all players submit)
4. RESULTS
   ↓ (next asker manually triggers next round OR game ends)
5. QUESTION_ENTRY (repeat) OR ENDED
```

---

## Core Features Breakdown

### v1 (MVP) Features

#### 1. Game Lobby
- Create game (generates 6-character code)
- Join game via code
- Enter nickname
- See list of joined players
- Host can start game

#### 2. Question Entry Phase
- Asker sees input field for question
- LLM validates question and returns answer
- If LLM can't determine answer → prompt for new question
- Asker can see answer preview
- Submit question to start round

#### 3. Guessing Phase
- Calculator interface for all players (except asker)
- 30-second countdown timer
- Calculation history display
- Submit guess button
- Show "waiting for others" after submission

#### 4. Results Phase
- Display correct answer
- Show all guesses ranked
- Highlight winner (green) and loser (red)
- Display updated scores
- Winner chooses to ask next question (or host if first round)

#### 5. Scoring System
- +1 for closest guess
- -1 for furthest guess
- -1 for no submission (timeout)
- Ties: both get +1, random winner asks next

#### 6. Win Conditions
- **Rounds mode**: First to X rounds
- **Score mode**: First to reach target score
- Game ends immediately when condition met

### v2 (Future) Features
- Avatars for players
- Configurable timer duration
- Visual error representation (logarithmic scale)
- Animations for winner/loser callouts
- Tie-breaker mini rounds
- Question categories
- Sound effects
- Game history/stats

---

## App Navigation Structure

```
App
├── SplashScreen
├── HomeScreen
│   ├── Create Game Button
│   └── Join Game Button
├── LobbyScreen
│   ├── Game Code Display
│   ├── Player List
│   └── Start Game (host only)
├── GameScreen (stateful)
│   ├── QuestionEntryView (asker only)
│   ├── GuessingView (all except asker)
│   │   ├── Calculator Component
│   │   ├── Timer Component
│   │   └── Submit Button
│   ├── ResultsView (all players)
│   │   ├── Answer Display
│   │   ├── Rankings List
│   │   └── Next Round Button (winner only)
│   └── ScoreboardView (sidebar/header)
└── GameEndScreen
    ├── Final Scores
    ├── Winner Announcement
    └── Play Again / Home
```

---

## Key Components

### Calculator Component
```typescript
interface CalculatorProps {
  onCalculationChange: (value: number, history: string) => void;
}
```

Features:
- Standard calculator operations (+, -, *, /)
- Display current calculation
- Show calculation history
- Clear/backspace functionality

### Timer Component
```typescript
interface TimerProps {
  duration: number;
  onExpire: () => void;
  onTick?: (remaining: number) => void;
}
```

Features:
- Circular progress indicator
- Display remaining seconds
- Auto-submit when expires

### Player List Component
```typescript
interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  showScores: boolean;
}
```

---

## Gemini API Integration

### Request Format
```typescript
async function validateQuestion(question: string): Promise<{
  isValid: boolean;
  answer?: number;
  errorMessage?: string;
}> {
  const prompt = `
You are helping validate a trivia estimation question.

Question: "${question}"

Your task:
1. Determine if this question has a single, factual, quantifiable numeric answer.
2. If yes, provide the most accurate answer as a number.
3. If no (subjective, time-sensitive, unknowable), explain why.

Respond in JSON format:
{
  "isValid": true/false,
  "answer": <number or null>,
  "reasoning": "<brief explanation>"
}
`;

  // Call Gemini API
  // Parse response
  // Return structured result
}
```

### Error Handling
- Network timeout → show retry option
- Invalid question → prompt asker for new question
- API rate limit → fallback to manual answer entry (v2)

---

## Implementation Phases

### Phase 1: Project Setup (Week 1)
- [ ] Initialize Expo project with TypeScript
- [ ] Set up Firebase project and Realtime Database
- [ ] Configure Gemini API credentials
- [ ] Set up navigation structure
- [ ] Create basic UI theme/design system

### Phase 2: Core Game Flow (Week 2-3)
- [ ] Build Home → Create/Join → Lobby flow
- [ ] Implement Firebase game creation and joining
- [ ] Build game state management (Context + Firebase listeners)
- [ ] Implement question entry + LLM validation
- [ ] Build calculator component

### Phase 3: Game Mechanics (Week 4-5)
- [ ] Implement timer functionality
- [ ] Build guessing submission logic
- [ ] Create results calculation (closest/furthest)
- [ ] Implement scoring system
- [ ] Build results display screen

### Phase 4: Win Conditions & Flow (Week 6)
- [ ] Implement game end conditions (rounds/score)
- [ ] Build game end screen
- [ ] Handle edge cases (player disconnect, timeout, ties)
- [ ] Testing and bug fixes

### Phase 5: Polish & Deploy (Week 7)
- [ ] UI/UX refinements
- [ ] Error handling and loading states
- [ ] Build and test on physical iOS device
- [ ] Submit to TestFlight for beta testing

---

## Security Rules (Firebase)

```json
{
  "rules": {
    "games": {
      "$gameCode": {
        ".read": true,
        ".write": "!data.exists() || data.child('players').hasChild(auth.uid)",
        "players": {
          "$playerId": {
            ".write": "$playerId === auth.uid"
          }
        },
        "guesses": {
          "$roundId": {
            "$playerId": {
              ".write": "$playerId === auth.uid && root.child('games/' + $gameCode + '/status').val() === 'guessing'"
            }
          }
        }
      }
    }
  }
}
```

---

## Technical Considerations

### Performance
- Limit Firebase listeners to current game only
- Debounce calculator updates
- Optimize re-renders with React.memo

### Offline Handling
- Show connection status indicator
- Queue writes when offline
- Graceful degradation

### Edge Cases to Handle
1. Player disconnects mid-round → treat as timeout (-1 points)
2. Asker disconnects → random new asker selected
3. All players timeout → round skipped, same asker tries again
4. Host disconnects → transfer host to next player
5. LLM API failure → allow manual answer entry (v2) or skip round

---

## Environment Variables

```env
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_DATABASE_URL=
FIREBASE_PROJECT_ID=
GEMINI_API_KEY=
```

---

## Next Steps

1. Set up development environment
2. Create Firebase project
3. Get Gemini API key
4. Initialize Expo project
5. Start with Phase 1 implementation

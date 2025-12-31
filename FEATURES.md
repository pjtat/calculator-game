# Feature Specifications

## v1 (MVP) Features

### 1. Game Creation & Joining

#### User Story
As a player, I want to create or join a game session so that I can play with my friends.

#### Acceptance Criteria
- [ ] User can tap "Create Game" to generate a new 6-character game code
- [ ] User can enter their nickname (required, 2-15 characters)
- [ ] Game code is displayed prominently and easy to share
- [ ] User can tap "Join Game" and enter a game code
- [ ] Invalid game codes show clear error message
- [ ] Duplicate nicknames in same game are not allowed

#### Technical Notes
- Generate random alphanumeric codes (exclude similar chars: 0/O, 1/I/l)
- Firebase creates game node on creation
- Check game existence before joining

---

### 2. Game Lobby

#### User Story
As a player, I want to see who's in the game before it starts so I know who I'm playing with.

#### Acceptance Criteria
- [ ] Display list of all players in the lobby with nicknames
- [ ] Show visual indicator for game host
- [ ] Real-time updates when players join/leave
- [ ] Host sees "Start Game" button
- [ ] Non-hosts see "Waiting for host to start..."
- [ ] Minimum 2 players required to start game
- [ ] Show game mode settings (rounds/score target)

#### Technical Notes
- Firebase listeners on `players` node
- Host determined by `isHost: true` flag
- Disable start button if < 2 players

---

### 3. Question Entry (Asker View)

#### User Story
As the asker, I want to submit a question and see the answer privately so I can verify it's correct before others guess.

#### Acceptance Criteria
- [ ] Asker sees text input for question
- [ ] Submit button calls Gemini API to validate question
- [ ] Loading indicator while API processes
- [ ] If valid: show answer preview to asker only
- [ ] If invalid: show error message and prompt for new question
- [ ] Asker can confirm and start the guessing phase
- [ ] Other players see "Waiting for [Name] to ask a question..."

#### Technical Notes
- Only asker can write to `currentQuestion` node
- Store answer in Firebase (visible only to asker via client-side filter)
- Handle API timeouts and errors gracefully

---

### 4. Guessing Phase (All Players Except Asker)

#### User Story
As a guesser, I want to use a calculator to estimate the answer within the time limit.

#### Acceptance Criteria
- [ ] Display the question prominently at top of screen
- [ ] Show 30-second countdown timer with visual indicator
- [ ] Calculator has buttons: 0-9, +, -, *, /, =, C (clear), ← (backspace)
- [ ] Display current calculation
- [ ] Show calculation history/formula
- [ ] Submit guess button (disabled until calculation complete)
- [ ] After submission: show "Waiting for others..." screen
- [ ] Timer auto-submits guess when it expires
- [ ] If no guess entered when timer expires: auto-submit null (penalty)

#### Technical Notes
- Timer component with progress ring
- Calculator component with state management
- Write guess to Firebase `guesses/{roundId}/{playerId}`
- Disable calculator after submission

---

### 5. Waiting Screen (Asker View During Guessing)

#### User Story
As the asker, I want to see who has submitted their guesses while waiting for the round to complete.

#### Acceptance Criteria
- [ ] Display question and correct answer
- [ ] Show list of players with status indicators:
  - ✓ Submitted
  - ⏱ Still guessing
- [ ] Auto-advance to results when timer expires

#### Technical Notes
- Listen to `guesses/{roundId}` for submission updates
- Show progress indicator (e.g., "3/5 players submitted")

---

### 6. Results Phase

#### User Story
As a player, I want to see how close everyone's guesses were and who won/lost the round.

#### Acceptance Criteria
- [ ] Display correct answer prominently
- [ ] Show ranked list of guesses:
  - Player nickname
  - Their guess
  - Difference from correct answer
  - Points awarded (+1, 0, -1)
- [ ] Highlight winner in green
- [ ] Highlight loser in red
- [ ] Show updated total scores for all players
- [ ] Winner sees "Ask Next Question" button
- [ ] Non-winners see "Waiting for [Name] to continue..."
- [ ] If tie for closest: both highlighted, random one gets to ask next

#### Technical Notes
- Calculate percentage error: `abs(guess - answer) / answer * 100`
- Sort by percentage error
- Handle null guesses (timeouts) as -1 points, show as "No guess"
- Write results to `roundResults/{roundId}`
- Update player scores in `players/{playerId}/score`

---

### 7. Scoreboard (Persistent View)

#### User Story
As a player, I want to see current scores at all times so I know my standing.

#### Acceptance Criteria
- [ ] Show compact scoreboard at top/side of screen during gameplay
- [ ] Display each player's current score
- [ ] Highlight current player
- [ ] Show current round number
- [ ] In rounds mode: show "Round 3/10"
- [ ] In score mode: show "First to 10"

#### Technical Notes
- Header component with Firebase listeners on `players` scores
- Read-only view, always visible during game

---

### 8. Game End Condition

#### User Story
As a player, I want the game to end automatically when the win condition is met.

#### Acceptance Criteria
- [ ] **Rounds Mode**: Game ends after X rounds completed
- [ ] **Score Mode**: Game ends immediately when someone reaches target score
- [ ] Automatic transition to game end screen
- [ ] Cannot continue playing after win condition met

#### Technical Notes
- Check win condition after each round results calculated
- Set game status to "ended" in Firebase
- Trigger navigation to GameEndScreen

---

### 9. Game End Screen

#### User Story
As a player, I want to see final results and celebrate the winner.

#### Acceptance Criteria
- [ ] Display final scores ranked from highest to lowest
- [ ] Show winner announcement with nickname
- [ ] Display runner-up (2nd place)
- [ ] Show total rounds played
- [ ] "Play Again" button (creates new game with same players)
- [ ] "Home" button (returns to main menu)

#### Technical Notes
- Read final state from Firebase
- "Play Again" creates new game, auto-adds all players

---

### 10. Edge Case Handling

#### User Story
As a player, I want the game to handle unexpected situations gracefully.

#### Acceptance Criteria
- [ ] **Player disconnect mid-round**: Treated as timeout (-1 points)
- [ ] **Asker disconnect**: Random new asker selected, current round restarted
- [ ] **Host disconnect**: Transfer host to next player alphabetically
- [ ] **All players timeout**: Round skipped, same asker tries again
- [ ] **LLM API failure**: Show error, prompt asker to try new question
- [ ] **Offline/poor connection**: Show connection indicator, queue updates

#### Technical Notes
- Use Firebase `onDisconnect()` hooks
- Implement connection state listeners
- Show toast notifications for connection issues

---

## v2 (Future) Features

### 11. Visual Error Representation
- Logarithmic scale visualization showing how far off each guess was
- Percentage error display next to each guess

### 12. Animations & Polish
- Winner celebration animation
- Loser "called out" animation with fun messages
- Smooth transitions between screens
- Sound effects for timer, submissions, results

### 13. Player Avatars
- Avatar selection on nickname entry
- Display avatars next to player names throughout game

### 14. Configurable Settings
- Adjustable timer duration (15s, 30s, 60s, 120s)
- Custom win conditions
- Private/public game rooms

### 15. Tie-Breaker Rounds
- When two players tie for closest, mini round with just those players
- Sudden death format

### 16. Question Categories
- Optional category selection before each question
- Categories: Geography, Science, Sports, Pop Culture, History, etc.
- Category-specific scoring multipliers

### 17. Game Statistics
- Personal stats: games played, win rate, average error
- Question history
- Leaderboards (among friends)

---

## Out of Scope (Not Planned)

- Public matchmaking with strangers
- In-app purchases / monetization
- Chat/messaging during game
- Pre-made question packs
- Real-time video/voice chat
- Cross-game persistent profiles

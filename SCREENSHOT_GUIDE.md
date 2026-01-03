# Calculator Game - Screenshot Creation Guide

## Overview

This guide provides step-by-step instructions for creating App Store screenshots for Calculator Game.

---

## Screenshot Tools & Options

### Option 1: Simulator Screenshots (Recommended for Development)
```bash
# Run on iOS Simulator
cd mobile
npx expo run:ios --device "iPhone 16 Pro Max"

# Take screenshot: Cmd + S (saves to Desktop)
```

### Option 2: Physical Device Screenshots
- iPhone: Press Side Button + Volume Up simultaneously
- Screenshots save to Photos app

### Option 3: Screenshot Frame Tools
- **Rotato** (Mac) - Adds device frames
- **Screenshots Pro** - Browser-based framing
- **AppLaunchpad** - Free online tool
- **Figma/Sketch** - Manual design control

---

## Screenshot Specifications

| Screenshot | Screen State | Key Elements to Show |
|------------|-------------|---------------------|
| 1. Home | HomeScreen | Title, subtitle, numeric rain, 3 buttons |
| 2. Create Game | CreateGameScreen | Nickname field filled, mode selector, settings |
| 3. Lobby | LobbyScreen | Game code "ABC123", 3-4 players listed |
| 4. Question Entry | GameScreen (questionEntry phase) | Question typed, AI validation complete |
| 5. Calculator | GameScreen (guessing phase) | Calculator with number, timer at ~15s |
| 6. Results | GameScreen (results phase) | Rankings with guesses and points |
| 7. Standings | GameScreen (standings phase) | Score leaderboard |
| 8. Winner | GameEndScreen | Winner name, final scores |

---

## Detailed Screenshot Setup

### Screenshot 1: Home Screen
**State:** App launch / home screen
**Setup:**
1. Launch app fresh
2. Wait for numeric rain animation to be visible
3. Ensure all 3 buttons are visible

**Must show:**
- "Calculator Game" title in Orbitron font
- "Don't be furthest away" subtitle
- Animated number background (capture mid-animation)
- "Create Game" button (orange)
- "Join Game" button
- "How to Play" button

**Caption:** "Challenge Friends to Estimation Battles"

---

### Screenshot 2: Create Game
**State:** CreateGameScreen with filled fields
**Setup:**
1. Navigate to Create Game
2. Enter nickname: "Alex"
3. Select "Rounds" mode
4. Set to 10 rounds
5. Timer: 30 seconds

**Must show:**
- Nickname input with text
- Mode selector (Rounds vs Score)
- Rounds/Score configuration
- Timer duration option
- "Create Game" button

**Caption:** "Customize Your Game"

---

### Screenshot 3: Game Lobby
**State:** LobbyScreen with multiple players
**Setup:**
1. Create a game
2. Have 3-4 test players join (or mock the data)
3. Show the game code prominently

**Ideal player names for screenshot:**
- Alex (Host)
- Jordan
- Sam
- Taylor

**Must show:**
- 6-character game code (large, copyable)
- "Share code with friends" instruction
- Player list with 3-4 names
- Host indicator on first player
- "Start Game" button (for host)

**Caption:** "Invite Friends with a Code"

---

### Screenshot 4: Question Entry
**State:** GameScreen in questionEntry phase (asker view)
**Setup:**
1. Start a game
2. When it's your turn to ask
3. Type an engaging question
4. Complete AI validation

**Sample question:** "How many countries are in Europe?"
**AI answer shown:** "44"

**Must show:**
- Question input field with text
- "Validate Question" button (or validation complete state)
- AI-generated answer preview
- Accept/Reject options
- Professional, clean layout

**Caption:** "Ask Any Numeric Question"

---

### Screenshot 5: Calculator + Timer
**State:** GameScreen in guessing phase (guesser view)
**Setup:**
1. Be in guessing phase (not your question)
2. Have ~15 seconds left on timer (orange state)
3. Enter a partial calculation like "48"

**Sample question displayed:** "How many countries are in Europe?"

**Must show:**
- Question at top of screen
- Full calculator keypad (0-9, operations, clear)
- Display showing "48" or similar estimate
- Circular timer in orange/warning state (~15s left)
- "Submit" button

**Caption:** "Crunch the Numbers Before Time Runs Out"

---

### Screenshot 6: Results
**State:** GameScreen in results phase
**Setup:**
1. Complete a round
2. Results should show varied guesses

**Sample data:**
| Player | Guess | Points |
|--------|-------|--------|
| Jordan | 45 | +1 (Closest!) |
| Alex | 42 | 0 |
| Sam | 38 | 0 |
| Taylor | 20 | -1 (Furthest) |

Correct answer: 44

**Must show:**
- "Results" header
- Correct answer prominently displayed
- Player rankings with guesses
- Point changes (+1, -1)
- Winner/loser highlighting (green/red)

**Caption:** "See Who Got Closest"

---

### Screenshot 7: Standings
**State:** GameScreen in standings phase
**Setup:**
1. After several rounds
2. Show accumulated scores

**Sample scores:**
| Player | Score |
|--------|-------|
| Jordan | 3 |
| Alex | 2 |
| Sam | 1 |
| Taylor | -1 |

**Must show:**
- "Standings" or "Scores" header
- All players with current scores
- Leader highlighted
- Round indicator (e.g., "Round 4 of 10")

**Caption:** "Track Scores Round by Round"

---

### Screenshot 8: Winner Screen
**State:** GameEndScreen
**Setup:**
1. Complete a full game
2. Have a clear winner

**Must show:**
- Winner announcement (e.g., "Jordan Wins!")
- Final score display
- Runner-up positions
- "Play Again" button
- "Home" button
- Celebratory visual elements

**Caption:** "Crown the Estimation Champion"

---

## Screenshot Text Overlays

For App Store screenshots, consider adding text overlays to highlight features:

### Overlay Style Guide
- **Font:** System San Francisco Bold or similar clean sans-serif
- **Color:** White text with subtle shadow/outline for contrast
- **Position:** Top 20% of screenshot (above fold)
- **Size:** Large enough to read in thumbnail view

### Text for Each Screenshot

1. **Home:** "Challenge Friends to Estimation Battles"
2. **Create:** "Customize Your Game"
3. **Lobby:** "Invite Friends with a Code"
4. **Question:** "Ask Any Numeric Question"
5. **Calculator:** "Crunch the Numbers"
6. **Results:** "See Who Got Closest"
7. **Standings:** "Track Every Round"
8. **Winner:** "Crown the Champion"

---

## Device Frame Options

### No Frame (Apple Default)
- Just the screenshot, no device chrome
- Cleaner, more modern look
- Apple's current preference

### With Device Frame
- Shows iPhone bezel/notch
- More "premium" feel
- Use consistent device across all screenshots

### Recommended Approach
Start with clean screenshots (no frame), add frames if conversion testing shows improvement.

---

## Background Color for Frames

If using device frames with background:
- **Primary:** #0A0E1A (matches app background)
- **Alternative:** #FF8C42 (orange accent)
- **Gradient:** Dark navy to orange

---

## Localization Notes

For international markets, consider localizing:
1. Screenshot captions/overlays
2. In-screenshot text (player names, questions)

**Priority markets:**
- English (US, UK, AU, CA)
- Spanish
- French
- German
- Japanese
- Korean
- Portuguese (Brazil)

---

## Quality Checklist

Before finalizing screenshots:

- [ ] All required sizes generated (6.9", 6.7", iPad if supported)
- [ ] No debug overlays or console messages visible
- [ ] Status bar shows appropriate time (9:41 AM is Apple standard)
- [ ] Battery icon shows full/plugged in
- [ ] No personal information visible
- [ ] Text is readable at thumbnail size
- [ ] Consistent visual style across all screenshots
- [ ] Screenshots tell a story of the user journey
- [ ] App name/branding visible in at least one screenshot

---

## Generating Screenshots from Simulator

```bash
# Start simulator with specific device
xcrun simctl boot "iPhone 16 Pro Max"

# Launch your app
npx expo run:ios --device "iPhone 16 Pro Max"

# Take screenshot via Simulator menu or Cmd+S
# Screenshots save to ~/Desktop by default

# For automated screenshots, consider:
# - Fastlane Snapshot
# - XCTest UI testing with screenshot capture
```

---

## File Naming Convention

```
CalculatorGame_[DeviceSize]_[ScreenNumber]_[ScreenName].png

Examples:
CalculatorGame_6.9_01_Home.png
CalculatorGame_6.9_02_CreateGame.png
CalculatorGame_6.9_03_Lobby.png
CalculatorGame_6.7_01_Home.png
...
```

---

## Timeline Estimate

| Task | Estimate |
|------|----------|
| Set up test data/mock states | 1-2 hours |
| Capture raw screenshots | 30 min |
| Add text overlays | 1-2 hours |
| Generate all device sizes | 30 min |
| Review and polish | 1 hour |
| **Total** | **4-6 hours** |

---

## Tools Summary

| Tool | Purpose | Cost |
|------|---------|------|
| iOS Simulator | Screenshot capture | Free |
| Figma | Text overlays & frames | Free tier |
| AppLaunchpad | Quick device frames | Free |
| Rotato | Premium 3D device mockups | Paid |
| Fastlane Snapshot | Automated screenshots | Free |

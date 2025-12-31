# Calculator Game

A multiplayer estimation game for iOS (and eventually Android) where players compete to make the closest guesses to quantifiable trivia questions.

## Game Overview

### How to Play
1. **Create or Join**: One player creates a game and shares the code with friends
2. **Ask Questions**: Players take turns asking quantifiable questions (e.g., "How many restaurants are in NYC?")
3. **Make Guesses**: Everyone except the asker uses a calculator to estimate the answer
4. **Score Points**: Closest guess gets +1, furthest gets -1
5. **Win**: First to reach target score or complete all rounds wins

### Game Modes
- **Rounds Mode**: Play for X number of rounds
- **Score Mode**: First to reach target score wins

## Tech Stack

- **React Native + Expo** - Cross-platform mobile development
- **Firebase Realtime Database** - Real-time multiplayer sync
- **Google Gemini Flash** - AI-powered answer verification
- **TypeScript** - Type-safe development

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or physical iOS device
- Firebase account
- Google AI Studio account (for Gemini API)

### Setup Instructions

1. **Clone and Install**
```bash
cd calculator-game
npm install
```

2. **Configure Firebase**
- Create new Firebase project at https://console.firebase.google.com
- Enable Realtime Database
- Enable Anonymous Authentication
- Copy config to `.env` file

3. **Configure Gemini API**
- Get API key from https://aistudio.google.com/app/apikey
- Add to `.env` file

4. **Environment Variables**
Create `.env` file in root:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
FIREBASE_PROJECT_ID=your_project_id
GEMINI_API_KEY=your_gemini_api_key
```

5. **Run Development Server**
```bash
npm start
# Press 'i' for iOS simulator
# Or scan QR code with Expo Go app on physical device
```

## Project Structure

```
calculator-game/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Calculator/
│   │   ├── Timer/
│   │   └── PlayerList/
│   ├── screens/             # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── LobbyScreen.tsx
│   │   ├── GameScreen.tsx
│   │   └── GameEndScreen.tsx
│   ├── services/            # External integrations
│   │   ├── firebase.ts
│   │   └── gemini.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useGame.ts
│   │   └── useTimer.ts
│   ├── context/             # React Context providers
│   │   └── GameContext.tsx
│   ├── types/               # TypeScript type definitions
│   │   └── game.ts
│   ├── utils/               # Helper functions
│   │   └── scoring.ts
│   └── navigation/          # Navigation configuration
│       └── AppNavigator.tsx
├── assets/                  # Images, fonts, etc.
├── ARCHITECTURE.md          # Technical architecture doc
├── .env                     # Environment variables (gitignored)
├── app.json                 # Expo configuration
├── package.json
└── tsconfig.json
```

## Development Roadmap

### v1 (MVP) - Core Gameplay
- [x] Architecture planning
- [ ] Project setup and configuration
- [ ] Game lobby (create/join)
- [ ] Question entry with LLM validation
- [ ] Calculator interface
- [ ] Timer and guessing phase
- [ ] Results and scoring
- [ ] Win conditions
- [ ] Basic UI/UX

### v2 - Polish & Features
- [ ] Player avatars
- [ ] Configurable timer
- [ ] Visual error representation
- [ ] Animations and sound effects
- [ ] Tie-breaker rounds
- [ ] Question categories
- [ ] Game history

### Future
- [ ] Android release
- [ ] Public game rooms
- [ ] Leaderboards
- [ ] Custom question packs

## Contributing

This is currently a solo project. Contributions and suggestions welcome!

## License

TBD

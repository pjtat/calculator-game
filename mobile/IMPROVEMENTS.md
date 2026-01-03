# Calculator Game - Improvement Roadmap

---

## Completed

### 1. API Key Security ✅
- [x] Removed hardcoded API keys from `firebase.ts` and `gemini.ts`
- [x] Added runtime validation for missing environment variables
- [x] Created `.gitignore` to exclude `.env` files
- [x] Updated `.env.example` with setup instructions
- [x] Configured EAS Secrets for production builds

---

## Up Next

### 2. Limited Test Coverage
- [ ] Add unit tests for Firebase service functions
- [ ] Add integration tests for game flow
- [ ] Add component rendering tests
- [ ] Add navigation tests

### 3. State Management Scalability
- [ ] Consider Zustand or Jotai for global state
- [ ] Extract game phase logic into state machine (XState)
- [ ] Refactor GameScreen.tsx (~800 lines)

### 4. Error Handling & Retry Logic
- [ ] Add exponential backoff retry wrapper
- [ ] Implement retry logic for Firebase operations
- [ ] Add user-friendly error recovery UI

### 5. Offline-First Architecture
- [ ] Queue failed operations locally
- [ ] Sync queued operations when connection restores
- [ ] Show pending state in UI

### 6. Accessibility (a11y)
- [ ] Add `accessibilityLabel` to all buttons
- [ ] Add `accessibilityRole` to interactive elements
- [ ] Test with VoiceOver/TalkBack

---

## Medium Priority

### 7. Performance Optimizations
- [ ] Fix NumericRain unbounded setInterval
- [ ] Add React.memo to PlayerList items
- [ ] Isolate Timer component to prevent re-renders

### 8. Code Organization
- [ ] Extract GameScreen phases into separate components:
  - `QuestionEntryPhase.tsx`
  - `GuessingPhase.tsx`
  - `ResultsPhase.tsx`
  - `StandingsPhase.tsx`

### 9. Type Safety
- [ ] Enable `"strict": true` in tsconfig.json
- [ ] Add explicit return types to all functions
- [ ] Fix existing TypeScript errors

### 10. Analytics & Monitoring
- [ ] Track user funnel (Home → Create/Join → Complete)
- [ ] Track drop-off points
- [ ] Add performance monitoring

---

## Feature Ideas

### 11. Social & Engagement
- [ ] In-game chat/reactions
- [ ] Player avatars
- [ ] One-tap rematch flow
- [ ] Friends list / recent players

### 12. Game Modes
- [ ] Speed mode (10-second timer)
- [ ] Category themes (Sports, History, Science)
- [ ] Daily challenge
- [ ] Single player practice

### 13. Engagement Hooks
- [ ] Streak tracking
- [ ] Achievements system
- [ ] Shareable results image

### 14. UX Polish
- [ ] Screen transition animations
- [ ] Sound design (victory, countdown, etc.)
- [ ] Light mode / color themes
- [ ] Interactive first-game tutorial

---

## Progress Log

| Date | Item | Notes |
|------|------|-------|
| 2026-01-02 | #1 API Key Security | Completed - EAS Secrets configured |

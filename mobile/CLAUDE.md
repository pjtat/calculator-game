# Calculator Game - Mobile App

## Build & Deploy Commands

Run all commands from the `mobile` folder:

```bash
cd /Users/ptatano/Documents/Side\ Projects/calculator-game/mobile
```

### Local Development
```bash
npx expo start
```

### TypeScript Check
```bash
npx tsc --noEmit
```

### Build for TestFlight (iOS)
```bash
npx eas-cli build --platform ios --profile production
```

### Submit to App Store / TestFlight
```bash
npx eas-cli submit --platform ios
```

### OTA Update (JS-only changes, faster)
```bash
npx eas-cli update --branch production --message "v1.0.x - description"
```

## Hidden Features

- **Play with Bots**: Tap version number 3x on home screen

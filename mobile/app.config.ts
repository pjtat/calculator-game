import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Calculator Game",
  slug: "calculator-game",
  version: "1.3.3",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0A0E1A"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.pjtat5.calculatorgame",
    buildNumber: "1",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0A0E1A"
    },
    package: "com.pjtat5.calculatorgame"
  },
  extra: {
    eas: {
      projectId: "aab12585-2abd-47ec-b0b1-3fe26173f96a"
    },
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
  owner: "pjtat5"
});

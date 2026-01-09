import { ExpoConfig, ConfigContext } from 'expo/config';
const { APP_VERSION } = require('../version.js');

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Calculator Game",
  slug: "calculator-game",
  version: APP_VERSION,
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
    buildNumber: "3",
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
    sentryDsn: process.env.SENTRY_DSN,
  },
  owner: "pjtat5"
});

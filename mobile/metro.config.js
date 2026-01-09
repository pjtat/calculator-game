const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Allow importing from parent directory (for version.js)
config.watchFolders = [path.resolve(__dirname, '..')];

// Enable package.json exports resolution with react-native condition
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'import',
  'require',
];
config.resolver.unstable_conditionsByPlatform = {
  ios: ['react-native', 'browser', 'import', 'require'],
  android: ['react-native', 'browser', 'import', 'require'],
};

module.exports = config;

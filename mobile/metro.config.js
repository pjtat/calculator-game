const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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

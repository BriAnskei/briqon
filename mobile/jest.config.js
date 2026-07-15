module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    // `.pnpm` MUST stay in the exception list: under pnpm, React Native lives
    // at node_modules/.pnpm/react-native@.../node_modules/react-native/, so
    // without it RN's ESM setup file (react-native/jest/setup.js) is skipped
    // by the transformer and Jest throws "Cannot use import statement outside
    // a module".
    '/node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|uuid))',
    // Skip the reanimated plugin (multi-platform) to avoid the
    // "Reentrant plugin detected" error, per the jest-expo default.
    '/node_modules/react-native-reanimated/plugin/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

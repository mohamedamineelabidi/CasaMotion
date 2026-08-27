// Dynamic Expo config so we can inject the Google Maps API key from env.
// Set EXPO_PUBLIC_GOOGLE_MAPS_KEY in a .env file for Android dev builds.
// (Expo Go and web fall back to a styled static map and need no key.)
module.exports = ({ config }) => ({
  ...config,
  name: 'CasaMotion',
  slug: 'casamotion',
  scheme: 'casamotion',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.casamotion.app',
  },
  android: {
    package: 'com.casamotion.app',
    edgeToEdgeEnabled: true,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '',
      },
    },
  },
  web: {
    bundler: 'metro',
    output: 'single',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'CasaMotion uses your location to show nearby taxis and plan trips across Casablanca.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});

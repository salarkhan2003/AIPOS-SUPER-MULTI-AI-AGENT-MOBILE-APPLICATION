import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'AIPOS',
  slug: 'aipos',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'aipos',
  userInterfaceStyle: 'dark',
  ios: { supportsTablet: true, bundleIdentifier: 'ai.aipos.app' },
  android: {
    package: 'ai.aipos.app',
    permissions: [
      'RECORD_AUDIO',
      'FOREGROUND_SERVICE',
      'RECEIVE_BOOT_COMPLETED',
      'POST_NOTIFICATIONS',
    ],
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      { icon: './assets/images/icon.png', color: '#12081F' },
    ],
    'expo-background-fetch',
    'expo-task-manager',
    'expo-sqlite',
    'expo-dev-client',
    './native/GhostAccessibility',
  ],
  experiments: { typedRoutes: true },
  extra: {
    groqKeySet: !!process.env.EXPO_PUBLIC_GROQ_API_KEY,
  },
};

export default config;

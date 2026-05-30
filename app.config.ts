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
    permissions: ['RECORD_AUDIO', 'POST_NOTIFICATIONS'],
  },
  plugins: [
    'expo-router',
    ['expo-splash-screen', { image: './assets/images/splash-icon.png', resizeMode: 'contain', backgroundColor: '#12081F' }],
    ['expo-notifications', { icon: './assets/images/icon.png', color: '#12081F' }],
    'expo-background-fetch',
    'expo-task-manager',
    'expo-sqlite',
    'expo-secure-store',
  ],
  experiments: { typedRoutes: true },
  extra: {
    groqKeySet: !!process.env.EXPO_PUBLIC_GROQ_API_KEY,
  },
};

export default config;

import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Ghost AI',
  slug: 'aipos',
  owner: 'salarkhan22',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'aipos',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'ai.aipos.app',
    infoPlist: {
      NSMicrophoneUsageDescription: 'Ghost uses the microphone for voice commands.',
      NSSpeechRecognitionUsageDescription: 'Ghost uses speech recognition to understand your commands.',
    },
  },
  android: {
    package: 'ai.aipos.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
    },
    permissions: [
      'RECORD_AUDIO',
      'POST_NOTIFICATIONS',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
    ],
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#F0EDE8',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#5B4FE8',
        sounds: [],
      },
    ],
    ['expo-av', { microphonePermission: 'Ghost uses the microphone for voice commands.' }],
    'expo-background-fetch',
    'expo-task-manager',
    'expo-sqlite',
    'expo-secure-store',
  ],
  experiments: { typedRoutes: true },
  extra: {
    groqKeySet: !!process.env.EXPO_PUBLIC_GROQ_API_KEY,
    groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '',
    eas: { projectId: '49785886-b3c9-4200-8d32-37265f1d22ae' },
  },
};

export default config;

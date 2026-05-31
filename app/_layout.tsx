import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { isGhostPro } from '@/lib/entitlements';
import { initLocalNotifications, scheduleDailyBriefing } from '@/lib/notifications-local';
import { prefsStorage, storage } from '@/lib/storage';
import { ThemeProvider, useTheme } from '@/lib/themeContext';
import { watchdogs } from '@/lib/watchdogs';
import { useGhostStore } from '@/store/ghostStore';
import { Stack } from 'expo-router';
import * as Speech from 'expo-speech';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

type VoicePersonality = 'normal' | 'friendly' | 'flirty' | 'professional' | 'jokes' | 'serious';

const getWelcomeMessages = (userName: string, personality: VoicePersonality) => {
  const messages: Record<VoicePersonality, string[]> = {
    normal: [
      `Hey ${userName}! I'm Ghost, your personal AI assistant. Let's make today amazing!`,
      `Hi ${userName}! Welcome back. I'm ready to help you with anything you need.`,
      `Hello ${userName}! Ghost here. What can I do for you today?`,
    ],
    friendly: [
      `Hey there ${userName}! So good to see you again! How's your day going so far?`,
      `Hi ${userName}! I'm super excited to help you today! What's on your mind?`,
      `Hello ${userName}! It's always a pleasure to chat with you! What can I assist with?`,
    ],
    flirty: [
      `Hey ${userName}... I've been looking forward to talking to you all day! What's up, gorgeous?`,
      `Well hello there ${userName}! You look amazing today. How can I make your day better?`,
      `Hi ${userName}! You always brighten up my day. What can I do for you, handsome/beautiful?`,
    ],
    professional: [
      `Good day ${userName}. I'm Ghost, your AI assistant. How can I help you achieve your goals today?`,
      `Hello ${userName}. I'm prepared to assist you with your tasks. What's our first priority?`,
      `${userName}, welcome. I'm here to help you be productive. Let's get started.`,
    ],
    jokes: [
      `Hey ${userName}! Why don't scientists trust atoms? Because they make up everything! What's up?`,
      `Hi ${userName}! I told my wife she was drawing her eyebrows too high. She looked surprised. Need help?`,
      `Hello ${userName}! Why did the scarecrow win an award? Because he was outstanding in his field! What can I do?`,
    ],
    serious: [
      `${userName}, let's get to work. What do you need to accomplish today?`,
      `Hey ${userName}. I'm focused and ready. Tell me what needs to be done.`,
      `${userName}. No time to waste. What's our first task?`,
    ],
  };
  return messages[personality] || messages.normal;
};

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { setPro, setAuth, setOnboarded, setHydrated, setVoiceAiEnabled } = useGhostStore();

  useEffect(() => {
    (async () => {
      await getDb();
      const session = await getSession();
      setOnboarded(session.hasOnboarded);
      const userName = session.name || 'there';
      setAuth({
        isGuest: session.isGuest,
        isAuthenticated: session.isAuthenticated,
        name: userName,
        email: session.email,
      });
      setVoiceAiEnabled(session.voiceAiEnabled);

      const prefs = await prefsStorage.get();
      const notifOk = await initLocalNotifications();
      if (notifOk && prefs.notificationsEnabled) {
        await scheduleDailyBriefing(prefs.dailyBriefingHour, 30);
      }

      await watchdogs.ensureDefaultHeartbeat();
      await watchdogs.registerBackgroundTask();
      const pro = await isGhostPro();
      setPro(pro);
      setHydrated(true);
      SplashScreen.hideAsync();

      if (session.voiceAiEnabled) {
        const today = new Date().toDateString();
        const lastWelcome = await storage.get<string>('lastWelcomeDay');
        const isFirstTime = !session.hasOnboarded;
        if (isFirstTime || lastWelcome !== today) {
          const personality = (prefs as any).voicePersonality || 'normal';
          const welcomeMessages = getWelcomeMessages(userName, personality);
          const randomMessage = isFirstTime
            ? `Hey ${userName}! I'm Ghost, your personal AI assistant. So great to meet you! Let's make today amazing!`
            : welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
          const voiceGender = (prefs as any).voiceGender || 'male';
          setTimeout(() => {
            Speech.speak(randomMessage, {
              language: 'en-IN',
              pitch: voiceGender === 'male' ? 0.75 : 1.25,
              rate: 0.9,
            });
          }, isFirstTime ? 3000 : 1000); // 3 sec after first time, 1 sec otherwise
          await storage.set('lastWelcomeDay', today);
        }
      }
    })();
  }, [setPro, setAuth, setOnboarded, setHydrated, setVoiceAiEnabled]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="briefing" />
        <Stack.Screen name="command-center" />
        <Stack.Screen name="memory-timeline" />
        <Stack.Screen name="knowledge-graph" />
        <Stack.Screen name="execution-monitor" />
        <Stack.Screen name="workflow-builder" />
        <Stack.Screen name="browser" />
        <Stack.Screen name="email-assistant" />
        <Stack.Screen name="notes" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="permissions" />
        <Stack.Screen name="integrations" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="activity-logs" />
        <Stack.Screen name="search" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="agents" />
        <Stack.Screen name="voice-history" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}

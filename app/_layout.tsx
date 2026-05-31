import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { isGhostPro } from '@/lib/entitlements';
import { initLocalNotifications, scheduleDailyBriefing } from '@/lib/notifications-local';
import { prefsStorage } from '@/lib/storage';
import { ThemeProvider, useTheme } from '@/lib/themeContext';
import { watchdogs } from '@/lib/watchdogs';
import { useGhostStore } from '@/store/ghostStore';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { setPro, setAuth, setOnboarded, setHydrated } = useGhostStore();

  useEffect(() => {
    (async () => {
      await getDb();
      const session = await getSession();
      setOnboarded(session.hasOnboarded);
      setAuth({
        isGuest: session.isGuest,
        isAuthenticated: session.isAuthenticated,
        name: session.name || 'there',
        email: session.email,
      });

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
    })();
  }, [setPro, setAuth, setOnboarded, setHydrated]);

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

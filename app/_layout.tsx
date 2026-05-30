import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { isGhostPro } from '@/lib/entitlements';
import { initLocalNotifications, notifyLocal, scheduleDailyBriefing } from '@/lib/notifications-local';
import { watchdogs } from '@/lib/watchdogs';
import { useGhostStore } from '@/store/ghostStore';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setPro, setAuth, setOnboarded, setHydrated } = useGhostStore();

  useEffect(() => {
    (async () => {
      await getDb();
      const session = await getSession();
      setOnboarded(session.hasOnboarded);
      setAuth({
        isGuest: session.isGuest,
        isAuthenticated: session.isAuthenticated,
        name: session.name,
        email: session.email,
      });

      const notifOk = await initLocalNotifications();
      if (notifOk) {
        await scheduleDailyBriefing(7, 30);
        await notifyLocal('Ghost OS', 'Local notifications are active.');
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
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F0EDE8' } }}>
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
      </Stack>
    </>
  );
}

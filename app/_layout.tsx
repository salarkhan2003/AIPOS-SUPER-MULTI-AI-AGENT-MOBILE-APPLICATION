import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { getDb } from '@/lib/db';
import { watchdogs } from '@/lib/watchdogs';
import { isGhostPro } from '@/lib/entitlements';
import { useGhostStore } from '@/store/ghostStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setPro = useGhostStore((s) => s.setPro);

  useEffect(() => {
    (async () => {
      await getDb();
      await watchdogs.ensureDefaultHeartbeat();
      await watchdogs.registerBackgroundTask();
      const pro = await isGhostPro();
      setPro(pro);
      SplashScreen.hideAsync();
    })();
  }, [setPro]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#12081F' } }}>
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

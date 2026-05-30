import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request permissions + Android channel — call on app start */
export async function initLocalNotifications(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('ghost-default', {
      name: 'Ghost Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6B4EFF',
    });
    await Notifications.setNotificationChannelAsync('ghost-watchdogs', {
      name: 'Watchdogs',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return true;
}

/** Fire a local notification immediately (Expo Go compatible) */
export async function notifyLocal(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: data as Notifications.NotificationContentInput['data'] },
    trigger: null,
  });
}

/** Schedule local notification after N seconds */
export async function scheduleLocalIn(
  seconds: number,
  title: string,
  body: string,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, seconds),
      repeats: false,
    },
  });
}

/** Daily morning briefing reminder (local) */
export async function scheduleDailyBriefing(hour = 7, minute = 30): Promise<string | null> {
  const granted = await initLocalNotifications();
  if (!granted) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ghost Daily Briefing',
      body: 'Your AI command center is ready. Tap to open your briefing.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelAllLocal(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const BRAND = {
  violet: '#5B4FE8',
  mint: '#3ECFB2',
  coral: '#E8503A',
  yellow: '#F5C842',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function initLocalNotifications(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    final = status;
  }
  if (final !== 'granted') return false;

  if (Platform.OS === 'android') {
    const channels: {
      id: string;
      name: string;
      description: string;
      importance: Notifications.AndroidImportance;
      lightColor: string;
      vibrationPattern: number[];
    }[] = [
      {
        id: 'ghost-default',
        name: 'Ghost Alerts',
        description: 'General alerts from Ghost AI',
        importance: Notifications.AndroidImportance.MAX,
        lightColor: BRAND.violet,
        vibrationPattern: [0, 200, 100, 200],
      },
      {
        id: 'ghost-watchdogs',
        name: 'Watchdog Alerts',
        description: 'Automated watchdog triggers',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: BRAND.coral,
        vibrationPattern: [0, 400, 150, 400],
      },
      {
        id: 'ghost-briefing',
        name: 'Daily Briefing',
        description: 'Your morning AI briefing',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: BRAND.yellow,
        vibrationPattern: [0, 150, 80, 150],
      },
      {
        id: 'ghost-tasks',
        name: 'Task Updates',
        description: 'Agent task completions',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: BRAND.mint,
        vibrationPattern: [0, 250, 120, 250],
      },
    ];

    for (const ch of channels) {
      await Notifications.setNotificationChannelAsync(ch.id, {
        name: ch.name,
        description: ch.description,
        importance: ch.importance,
        vibrationPattern: ch.vibrationPattern,
        lightColor: ch.lightColor,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
        showBadge: true,
        sound: 'default',
      });
    }
  }
  return true;
}

export type NotifCategory = 'default' | 'watchdog' | 'briefing' | 'task';

const channelMap: Record<NotifCategory, string> = {
  default: 'ghost-default',
  watchdog: 'ghost-watchdogs',
  briefing: 'ghost-briefing',
  task: 'ghost-tasks',
};

const categoryStyle: Record<NotifCategory, { prefix: string; accent: string }> = {
  default: { prefix: '👻', accent: BRAND.violet },
  watchdog: { prefix: '⚡', accent: BRAND.coral },
  briefing: { prefix: '☀️', accent: BRAND.yellow },
  task: { prefix: '✓', accent: BRAND.mint },
};

function styledContent(
  title: string,
  body: string,
  category: NotifCategory,
  data?: Record<string, unknown>,
  branded = true,
) {
  const style = categoryStyle[category];
  const hasPrefix = /^[👻⚡☀️✓]/.test(title);
  const brandedTitle = !branded || hasPrefix ? title : `${style.prefix} ${title}`;
  const displayBody = body?.trim() || title;

  return {
    title: brandedTitle,
    body: displayBody,
    data: { ...data, category, accent: style.accent },
    sound: 'default' as const,
    ...(Platform.OS === 'android' && {
      channelId: channelMap[category],
      color: style.accent,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
    ...(Platform.OS === 'ios' && {
      subtitle: 'Ghost AI',
    }),
  };
}

export async function notifyLocal(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  category: NotifCategory = 'default',
  options?: { branded?: boolean },
): Promise<string> {
  const granted = await initLocalNotifications();
  if (!granted) return '';

  return Notifications.scheduleNotificationAsync({
    content: styledContent(title, body, category, data, options?.branded !== false),
    trigger: null,
  });
}

/** User-facing notification — title and body shown exactly as provided (no emoji prefix). */
export async function notifyUser(
  title: string,
  body: string,
  category: NotifCategory = 'default',
): Promise<string> {
  return notifyLocal(title, body, { type: 'user' }, category, { branded: false });
}

export async function scheduleLocalIn(
  seconds: number,
  title: string,
  body: string,
  category: NotifCategory = 'default',
  data?: Record<string, unknown>,
): Promise<string> {
  const granted = await initLocalNotifications();
  if (!granted) return '';

  return Notifications.scheduleNotificationAsync({
    content: styledContent(title, body, category, data),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, seconds),
      repeats: false,
    },
  });
}

export async function scheduleDailyBriefing(hour = 7, minute = 30): Promise<string | null> {
  const granted = await initLocalNotifications();
  if (!granted) return null;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as Record<string, unknown>)?.type === 'briefing') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  return Notifications.scheduleNotificationAsync({
    content: styledContent(
      'Good morning! Your briefing is ready',
      'Ghost has prepared your daily digest. Tap to review.',
      'briefing',
      { type: 'briefing', route: '/briefing' },
    ),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function notifyWatchdog(trigger: string, message: string): Promise<string> {
  return notifyLocal('Watchdog triggered', message, { type: 'watchdog', trigger }, 'watchdog');
}

export async function notifyTaskDone(taskName: string, result: string): Promise<string> {
  const clean = result.slice(0, 200).trim() || 'Task completed successfully.';
  const shortTitle = taskName.length > 40 ? `${taskName.slice(0, 37)}…` : taskName;
  return notifyUser(shortTitle, clean, 'task');
}

export async function cancelAllLocal(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

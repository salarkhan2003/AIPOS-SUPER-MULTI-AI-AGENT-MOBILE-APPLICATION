import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { getDb, uuid } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import type { Watchdog } from '@/types';

export const WATCHDOG_TASK = 'GHOST_WATCHDOG_TASK';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

TaskManager.defineTask(WATCHDOG_TASK, async () => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      trigger: string;
      params: string;
      action: string;
      active: number;
      created_at: number;
      last_run_at: number | null;
    }>('SELECT * FROM watchdogs WHERE active = 1');

    for (const row of rows) {
      const wd: Watchdog = {
        id: row.id,
        trigger: row.trigger,
        params: JSON.parse(row.params) as Record<string, unknown>,
        action: row.action,
        active: row.active,
        createdAt: row.created_at,
        lastRunAt: row.last_run_at ?? undefined,
      };
      await runWatchdog(wd);
      await db.runAsync('UPDATE watchdogs SET last_run_at = ? WHERE id = ?', [Date.now(), wd.id]);
    }

    // Heartbeat for interval watchdogs
    const heartbeat = rows.find((r) => r.trigger === 'interval_15m');
    if (heartbeat) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ghost Watchdog',
          body: `Heartbeat ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        },
        trigger: null,
      });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.error('Watchdog task error', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function runWatchdog(wd: Watchdog): Promise<void> {
  if (wd.trigger === 'irctc_delay') {
    const train = String(wd.params.train ?? '');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Train delay check',
        body: `Monitoring train ${train}. No delay >15m detected (demo poll).`,
      },
      trigger: null,
    });
    await logAudit('workflow', 'watchdog_irctc_delay', wd.params, 'polled', 10);
  }
}

export const watchdogs = {
  async register(trigger: string, params: Record<string, unknown>, action: string): Promise<string> {
    const db = await getDb();
    const id = uuid();
    await db.runAsync(
      'INSERT INTO watchdogs (id, trigger, params, action, active, created_at) VALUES (?, ?, ?, ?, 1, ?)',
      [id, trigger, JSON.stringify(params), action, Date.now()],
    );
    return id;
  },

  async list(): Promise<Watchdog[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      trigger: string;
      params: string;
      action: string;
      active: number;
      created_at: number;
      last_run_at: number | null;
    }>('SELECT * FROM watchdogs ORDER BY created_at DESC');
    return rows.map((r) => ({
      id: r.id,
      trigger: r.trigger,
      params: JSON.parse(r.params) as Record<string, unknown>,
      action: r.action,
      active: r.active,
      createdAt: r.created_at,
      lastRunAt: r.last_run_at ?? undefined,
    }));
  },

  async registerBackgroundTask(): Promise<void> {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) return;

    const registered = await TaskManager.isTaskRegisteredAsync(WATCHDOG_TASK);
    if (!registered) {
      await BackgroundFetch.registerTaskAsync(WATCHDOG_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  },

  async ensureDefaultHeartbeat(): Promise<void> {
    const list = await watchdogs.list();
    if (!list.some((w) => w.trigger === 'interval_15m')) {
      await watchdogs.register('interval_15m', {}, 'notify + log time');
    }
  },
};

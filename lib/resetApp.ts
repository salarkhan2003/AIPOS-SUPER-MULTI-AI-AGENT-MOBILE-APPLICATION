import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { cancelAllLocal } from '@/lib/notifications-local';

const SECURE_KEYS = [
  'ghost_onboarding_done',
  'ghost_guest_mode',
  'ghost_user_name',
  'ghost_user_email',
  'ghost_authenticated',
  'ghost_user_gender',
] as const;

/** Wipes local app data and returns user to first-run onboarding. */
export async function resetAppData(): Promise<void> {
  await cancelAllLocal();

  await AsyncStorage.clear();

  await Promise.all(
    SECURE_KEYS.map((key) => SecureStore.deleteItemAsync(key).catch(() => {})),
  );

  try {
    const db = await SQLite.openDatabaseAsync('ghost.db');
    await db.execAsync(`
      DELETE FROM memories;
      DELETE FROM watchdogs;
      DELETE FROM audit_logs;
      DELETE FROM entitlements;
    `);
  } catch {
    /* db may not exist yet */
  }
}

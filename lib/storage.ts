/**
 * Persistent key-value storage using AsyncStorage.
 * Survives app close and device restart.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async keys(): Promise<string[]> {
    return (await AsyncStorage.getAllKeys()) as string[];
  },
};

// ── Typed helpers ──────────────────────────────────────────────

export interface SavedNote {
  id: string;
  title: string;
  body: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

const NOTES_KEY = 'ghost:notes';

export const notesStorage = {
  async list(): Promise<SavedNote[]> {
    return (await storage.get<SavedNote[]>(NOTES_KEY)) ?? [];
  },

  async save(note: Omit<SavedNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedNote> {
    const notes = await notesStorage.list();
    const now = Date.now();
    const newNote: SavedNote = {
      id: `note-${now}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      ...note,
    };
    await storage.set(NOTES_KEY, [newNote, ...notes]);
    return newNote;
  },

  async update(id: string, patch: Partial<Pick<SavedNote, 'title' | 'body' | 'color'>>): Promise<void> {
    const notes = await notesStorage.list();
    const updated = notes.map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
    );
    await storage.set(NOTES_KEY, updated);
  },

  async remove(id: string): Promise<void> {
    const notes = await notesStorage.list();
    await storage.set(NOTES_KEY, notes.filter((n) => n.id !== id));
  },
};

// ── Voice history ──────────────────────────────────────────────

export interface VoiceEntry {
  id: string;
  speaker: 'you' | 'ghost';
  text: string;
  timestamp: number;
}

const VOICE_KEY = 'ghost:voice_history';

export const voiceStorage = {
  async list(): Promise<VoiceEntry[]> {
    return (await storage.get<VoiceEntry[]>(VOICE_KEY)) ?? [];
  },

  async append(entry: Omit<VoiceEntry, 'id' | 'timestamp'>): Promise<VoiceEntry> {
    const history = await voiceStorage.list();
    const newEntry: VoiceEntry = {
      id: `v-${Date.now()}`,
      timestamp: Date.now(),
      ...entry,
    };
    // keep last 200
    await storage.set(VOICE_KEY, [newEntry, ...history].slice(0, 200));
    return newEntry;
  },

  async clear(): Promise<void> {
    await storage.set(VOICE_KEY, []);
  },
};

// ── User prefs ─────────────────────────────────────────────────

export interface SavedContact {
  id: string;
  name: string;
  phone: string;
}

export interface CalEventStored {
  id: string;
  title: string;
  desc: string;
  color: string;
  time: string;
  duration: string;
  dayKey: string;
}

export interface UserPrefs {
  notificationsEnabled: boolean;
  encryptMemory: boolean;
  autoRunWatchdogs: boolean;
  dailyBriefingHour: number;
  theme: 'light' | 'dark' | 'system';
  whatsappNumber: string;
}

const PREFS_KEY = 'ghost:prefs';
const CONTACTS_KEY = 'ghost:contacts';
const CALENDAR_KEY = 'ghost:calendar';

const DEFAULT_PREFS: UserPrefs = {
  notificationsEnabled: true,
  encryptMemory: true,
  autoRunWatchdogs: false,
  dailyBriefingHour: 7,
  theme: 'light',
  whatsappNumber: '',
};

export const prefsStorage = {
  async get(): Promise<UserPrefs> {
    return { ...DEFAULT_PREFS, ...((await storage.get<Partial<UserPrefs>>(PREFS_KEY)) ?? {}) };
  },
  async set(patch: Partial<UserPrefs>): Promise<void> {
    const current = await prefsStorage.get();
    await storage.set(PREFS_KEY, { ...current, ...patch });
  },
};

export const contactsStorage = {
  async list(): Promise<SavedContact[]> {
    return (await storage.get<SavedContact[]>(CONTACTS_KEY)) ?? [];
  },

  async add(name: string, phone: string): Promise<SavedContact> {
    const contacts = await contactsStorage.list();
    const entry: SavedContact = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
    };
    await storage.set(CONTACTS_KEY, [...contacts, entry]);
    return entry;
  },

  async remove(id: string): Promise<void> {
    const contacts = await contactsStorage.list();
    await storage.set(CONTACTS_KEY, contacts.filter((c) => c.id !== id));
  },
};

export const calendarStorage = {
  async list(): Promise<CalEventStored[]> {
    return (await storage.get<CalEventStored[]>(CALENDAR_KEY)) ?? [];
  },

  async add(event: Omit<CalEventStored, 'id'>): Promise<CalEventStored> {
    const events = await calendarStorage.list();
    const entry: CalEventStored = { id: `ev-${Date.now()}`, ...event };
    await storage.set(CALENDAR_KEY, [...events, entry]);
    return entry;
  },

  async remove(id: string): Promise<void> {
    const events = await calendarStorage.list();
    await storage.set(CALENDAR_KEY, events.filter((e) => e.id !== id));
  },

  async forDay(dayKey: string): Promise<CalEventStored[]> {
    const events = await calendarStorage.list();
    return events
      .filter((e) => e.dayKey === dayKey)
      .sort((a, b) => a.time.localeCompare(b.time));
  },
};

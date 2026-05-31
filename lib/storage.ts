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
  backgroundVoiceAgentEnabled: boolean;
  fullMobileAccessEnabled: boolean;
  allowedApps: string[];
}

const PREFS_KEY = 'ghost:prefs';
const CONTACTS_KEY = 'ghost:contacts';
const CALENDAR_KEY = 'ghost:calendar';
const TASKS_KEY = 'ghost:tasks';
const MEETINGS_KEY = 'ghost:meetings';
const DEADLINES_KEY = 'ghost:deadlines';

const DEFAULT_PREFS: UserPrefs = {
  notificationsEnabled: true,
  encryptMemory: true,
  autoRunWatchdogs: false,
  dailyBriefingHour: 7,
  theme: 'light',
  whatsappNumber: '',
  backgroundVoiceAgentEnabled: false,
  fullMobileAccessEnabled: false,
  allowedApps: [],
};

// ── Tasks/Meetings/Deadlines ───────────────────────────────────
export interface SavedTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: number;
}

export interface SavedMeeting {
  id: string;
  title: string;
  description?: string;
  time: string;
  location?: string;
  createdAt: number;
}

export interface SavedDeadline {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  createdAt: number;
}

export const tasksStorage = {
  async list(): Promise<SavedTask[]> {
    return (await storage.get<SavedTask[]>(TASKS_KEY)) ?? [];
  },
  async add(title: string, description?: string): Promise<SavedTask> {
    const list = await tasksStorage.list();
    const entry: SavedTask = { id: `task-${Date.now()}`, title, description, completed: false, createdAt: Date.now() };
    await storage.set(TASKS_KEY, [...list, entry]);
    return entry;
  },
  async toggle(id: string): Promise<void> {
    const list = await tasksStorage.list();
    await storage.set(TASKS_KEY, list.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  },
  async remove(id: string): Promise<void> {
    const list = await tasksStorage.list();
    await storage.set(TASKS_KEY, list.filter((t) => t.id !== id));
  },
};

export const meetingsStorage = {
  async list(): Promise<SavedMeeting[]> {
    return (await storage.get<SavedMeeting[]>(MEETINGS_KEY)) ?? [];
  },
  async add(title: string, time: string, description?: string, location?: string): Promise<SavedMeeting> {
    const list = await meetingsStorage.list();
    const entry: SavedMeeting = { id: `meeting-${Date.now()}`, title, time, description, location, createdAt: Date.now() };
    await storage.set(MEETINGS_KEY, [...list, entry]);
    return entry;
  },
  async remove(id: string): Promise<void> {
    const list = await meetingsStorage.list();
    await storage.set(MEETINGS_KEY, list.filter((m) => m.id !== id));
  },
};

export const deadlinesStorage = {
  async list(): Promise<SavedDeadline[]> {
    return (await storage.get<SavedDeadline[]>(DEADLINES_KEY)) ?? [];
  },
  async add(title: string, dueDate: string, description?: string): Promise<SavedDeadline> {
    const list = await deadlinesStorage.list();
    const entry: SavedDeadline = { id: `deadline-${Date.now()}`, title, dueDate, description, createdAt: Date.now() };
    await storage.set(DEADLINES_KEY, [...list, entry]);
    return entry;
  },
  async remove(id: string): Promise<void> {
    const list = await deadlinesStorage.list();
    await storage.set(DEADLINES_KEY, list.filter((d) => d.id !== id));
  },
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

// ── Saved Email Recipients ─────────────────────────────────────

export interface SavedEmailRecipient {
  id: string;
  name: string;
  email: string;
}

const EMAIL_RECIPIENTS_KEY = 'ghost:email_recipients';

export const emailRecipientsStorage = {
  async list(): Promise<SavedEmailRecipient[]> {
    return (await storage.get<SavedEmailRecipient[]>(EMAIL_RECIPIENTS_KEY)) ?? [];
  },
  async add(name: string, email: string): Promise<SavedEmailRecipient> {
    const list = await emailRecipientsStorage.list();
    const entry: SavedEmailRecipient = { id: `er-${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase() };
    await storage.set(EMAIL_RECIPIENTS_KEY, [...list, entry]);
    return entry;
  },
  async update(id: string, patch: Partial<Pick<SavedEmailRecipient, 'name' | 'email'>>): Promise<void> {
    const list = await emailRecipientsStorage.list();
    await storage.set(EMAIL_RECIPIENTS_KEY, list.map((r) => r.id === id ? { ...r, ...patch } : r));
  },
  async remove(id: string): Promise<void> {
    const list = await emailRecipientsStorage.list();
    await storage.set(EMAIL_RECIPIENTS_KEY, list.filter((r) => r.id !== id));
  },
  async findByNameOrEmail(query: string): Promise<SavedEmailRecipient | null> {
    const list = await emailRecipientsStorage.list();
    const q = query.toLowerCase().trim();
    return list.find((r) => r.email.toLowerCase() === q || r.name.toLowerCase().includes(q)) ?? null;
  },
};

// ── Agent Prefs ────────────────────────────────────────────────

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  provider: 'groq' | 'openrouter';
  enabled: boolean;
  description: string;
  color: string;
}

const AGENTS_KEY = 'ghost:agents';

const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agent-groq',
    name: 'Ghost Groq',
    role: 'Primary AGI — planning, execution, memory, research',
    provider: 'groq',
    enabled: true,
    description: 'Powered by Groq LLaMA 3.3 70B. Handles all core tasks: planning, tool execution, WhatsApp, reminders, research.',
    color: '#9D8AFF',
  },
  {
    id: 'agent-openai',
    name: 'Ghost OpenAI',
    role: 'Fallback AGI — activates when Groq is unavailable',
    provider: 'openrouter',
    enabled: true,
    description: 'Powered by OpenAI-compatible API. Automatically activates as fallback when Groq rate-limits or is unreachable.',
    color: '#5CE1E6',
  },
];

export const agentConfigStorage = {
  async list(): Promise<AgentConfig[]> {
    const saved = await storage.get<AgentConfig[]>(AGENTS_KEY);
    if (!saved || saved.length === 0) {
      await storage.set(AGENTS_KEY, DEFAULT_AGENTS);
      return DEFAULT_AGENTS;
    }
    return saved;
  },
  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const list = await agentConfigStorage.list();
    await storage.set(AGENTS_KEY, list.map((a) => a.id === id ? { ...a, enabled } : a));
  },
  async reset(): Promise<void> {
    await storage.set(AGENTS_KEY, DEFAULT_AGENTS);
  },
};

// ── Goals ──────────────────────────────────────────────────────

export interface SavedGoal {
  id: string;
  label: string;
  pct: number;
  color: string;
  createdAt: number;
  updatedAt: number;
}

const GOALS_KEY = 'ghost:goals';

const DEFAULT_GOALS: SavedGoal[] = [
  { id: 'g1', label: 'Railway Robot', pct: 67, color: '#9D8AFF', createdAt: 0, updatedAt: 0 },
  { id: 'g2', label: 'Ghost AI',      pct: 42, color: '#5CE1E6', createdAt: 0, updatedAt: 0 },
  { id: 'g3', label: 'Job Search',    pct: 18, color: '#FFC857', createdAt: 0, updatedAt: 0 },
];

export const goalsStorage = {
  async list(): Promise<SavedGoal[]> {
    const saved = await storage.get<SavedGoal[]>(GOALS_KEY);
    if (!saved || saved.length === 0) {
      await storage.set(GOALS_KEY, DEFAULT_GOALS);
      return DEFAULT_GOALS;
    }
    return saved;
  },
  async save(goals: SavedGoal[]): Promise<void> {
    await storage.set(GOALS_KEY, goals);
  },
  async add(label: string, pct: number, color: string): Promise<SavedGoal> {
    const list = await goalsStorage.list();
    const entry: SavedGoal = { id: `goal-${Date.now()}`, label, pct, color, createdAt: Date.now(), updatedAt: Date.now() };
    await storage.set(GOALS_KEY, [...list, entry]);
    return entry;
  },
  async update(id: string, patch: Partial<Pick<SavedGoal, 'label' | 'pct' | 'color'>>): Promise<void> {
    const list = await goalsStorage.list();
    await storage.set(GOALS_KEY, list.map((g) => g.id === id ? { ...g, ...patch, updatedAt: Date.now() } : g));
  },
  async remove(id: string): Promise<void> {
    const list = await goalsStorage.list();
    await storage.set(GOALS_KEY, list.filter((g) => g.id !== id));
  },
};

// ── Voice Sessions (each open/close = one session) ─────────────

export interface VoiceSession {
  id: string;
  startedAt: number;
  endedAt: number;
  messageCount: number;
  preview: string; // first user message
}

const VOICE_SESSIONS_KEY = 'ghost:voice_sessions';

export const voiceSessionStorage = {
  async list(): Promise<VoiceSession[]> {
    return (await storage.get<VoiceSession[]>(VOICE_SESSIONS_KEY)) ?? [];
  },
  async start(): Promise<string> {
    const id = `vs-${Date.now()}`;
    const sessions = await voiceSessionStorage.list();
    const session: VoiceSession = { id, startedAt: Date.now(), endedAt: 0, messageCount: 0, preview: '' };
    await storage.set(VOICE_SESSIONS_KEY, [session, ...sessions].slice(0, 50));
    return id;
  },
  async end(id: string, messageCount: number, preview: string): Promise<void> {
    const sessions = await voiceSessionStorage.list();
    await storage.set(VOICE_SESSIONS_KEY, sessions.map((s) =>
      s.id === id ? { ...s, endedAt: Date.now(), messageCount, preview } : s,
    ));
  },
  async getEntries(sessionId: string): Promise<VoiceEntry[]> {
    const all = await storage.get<VoiceEntry[]>(`ghost:voice_session_${sessionId}`) ?? [];
    return all;
  },
  async appendEntry(sessionId: string, entry: Omit<VoiceEntry, 'id' | 'timestamp'>): Promise<VoiceEntry> {
    const existing = await voiceSessionStorage.getEntries(sessionId);
    const newEntry: VoiceEntry = { id: `ve-${Date.now()}`, timestamp: Date.now(), ...entry };
    await storage.set(`ghost:voice_session_${sessionId}`, [...existing, newEntry]);
    return newEntry;
  },
  async clearSession(sessionId: string): Promise<void> {
    await storage.remove(`ghost:voice_session_${sessionId}`);
    const sessions = await voiceSessionStorage.list();
    await storage.set(VOICE_SESSIONS_KEY, sessions.filter((s) => s.id !== sessionId));
  },
};

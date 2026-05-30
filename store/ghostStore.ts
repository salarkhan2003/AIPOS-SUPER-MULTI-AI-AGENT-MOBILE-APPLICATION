import { create } from 'zustand';
import type { AuditLogEntry, ExecutionTask, PredictionCard, ThoughtEvent, UserProfile } from '@/types';

interface GhostState {
  user: UserProfile;
  thoughts: ThoughtEvent[];
  tasks: ExecutionTask[];
  predictions: PredictionCard[];
  isPro: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  hydrated: boolean;
  addThought: (t: ThoughtEvent) => void;
  setPredictions: (p: PredictionCard[]) => void;
  setTasks: (t: ExecutionTask[]) => void;
  setPro: (v: boolean) => void;
  setAuth: (p: { isGuest: boolean; isAuthenticated: boolean; name?: string; email?: string }) => void;
  setOnboarded: (v: boolean) => void;
  setHydrated: (v: boolean) => void;
}

export const useGhostStore = create<GhostState>((set) => ({
  user: {
    name: 'Guest',
    email: '',
    plan: 'free',
    creditsUsed: 0,
    creditsTotal: 50,
  },
  thoughts: [],
  tasks: [],
  predictions: [],
  isPro: false,
  isGuest: true,
  isAuthenticated: false,
  hasOnboarded: false,
  hydrated: false,
  addThought: (t) => set((s) => ({ thoughts: [t, ...s.thoughts].slice(0, 200) })),
  setPredictions: (predictions) => set({ predictions }),
  setTasks: (tasks) => set({ tasks }),
  setPro: (isPro) =>
    set((s) => ({
      isPro,
      user: { ...s.user, plan: isPro ? 'ghost_pro' : 'free', creditsTotal: isPro ? 99999 : 50 },
    })),
  setAuth: ({ isGuest, isAuthenticated, name, email }) =>
    set((s) => ({
      isGuest,
      isAuthenticated,
      user: {
        ...s.user,
        name: name ?? s.user.name,
        email: email ?? s.user.email,
      },
    })),
  setOnboarded: (hasOnboarded) => set({ hasOnboarded }),
  setHydrated: (hydrated) => set({ hydrated }),
}));

export type { AuditLogEntry };

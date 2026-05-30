import { create } from 'zustand';
import type { AuditLogEntry, ExecutionTask, PredictionCard, ThoughtEvent, UserProfile } from '@/types';

interface GhostState {
  user: UserProfile;
  thoughts: ThoughtEvent[];
  tasks: ExecutionTask[];
  predictions: PredictionCard[];
  isPro: boolean;
  addThought: (t: ThoughtEvent) => void;
  setPredictions: (p: PredictionCard[]) => void;
  setTasks: (t: ExecutionTask[]) => void;
  setPro: (v: boolean) => void;
}

export const useGhostStore = create<GhostState>((set) => ({
  user: {
    name: 'Ghost User',
    email: 'user@ghost.ai',
    plan: 'free',
    creditsUsed: 0,
    creditsTotal: 50,
  },
  thoughts: [],
  tasks: [],
  predictions: [],
  isPro: false,
  addThought: (t) => set((s) => ({ thoughts: [t, ...s.thoughts].slice(0, 200) })),
  setPredictions: (predictions) => set({ predictions }),
  setTasks: (tasks) => set({ tasks }),
  setPro: (isPro) =>
    set((s) => ({
      isPro,
      user: { ...s.user, plan: isPro ? 'ghost_pro' : 'free', creditsTotal: isPro ? 99999 : 50 },
    })),
}));

export type { AuditLogEntry };

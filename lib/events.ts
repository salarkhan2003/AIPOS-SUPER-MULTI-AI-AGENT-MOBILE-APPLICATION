/** Simple event bus for Command Center real-time thoughts */
type Listener = (payload: unknown) => void;

class GhostEventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.off(event, fn);
  }

  off(event: string, fn: Listener) {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event: string, payload: unknown) {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }
}

export const ghostEvents = new GhostEventEmitter();
export const EVENTS = {
  THOUGHT: 'thought',
  TASK_UPDATE: 'task_update',
  AUDIT: 'audit',
} as const;

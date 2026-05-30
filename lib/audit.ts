import { getDb, uuid } from '@/lib/db';
import { ghostEvents, EVENTS } from '@/lib/events';
import type { AgentRole, AuditLogEntry } from '@/types';

export async function logAudit(
  agent: AgentRole,
  action: string,
  params: Record<string, unknown>,
  result: string,
  risk = 0,
  approved = 1,
): Promise<AuditLogEntry> {
  const db = await getDb();
  const entry: AuditLogEntry = {
    id: uuid(),
    timestamp: Date.now(),
    agent,
    action,
    params: JSON.stringify(params),
    result,
    risk,
    approved,
  };
  await db.runAsync(
    'INSERT INTO audit_logs (id, timestamp, agent, action, params, result, risk, approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [entry.id, entry.timestamp, entry.agent, entry.action, entry.params, entry.result, entry.risk, entry.approved],
  );
  ghostEvents.emit(EVENTS.AUDIT, entry);
  return entry;
}

export async function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const db = await getDb();
  return db.getAllAsync<AuditLogEntry>(
    'SELECT id, timestamp, agent, action, params, result, risk, approved FROM audit_logs ORDER BY timestamp DESC LIMIT ?',
    [limit],
  );
}

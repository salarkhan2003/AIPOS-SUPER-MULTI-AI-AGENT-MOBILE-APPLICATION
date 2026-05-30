/** AIPOS / Ghost — core production types */

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'waiting' | 'error';

export type AgentRole =
  | 'planner'
  | 'research'
  | 'executor'
  | 'verifier'
  | 'memory'
  | 'security'
  | 'communication'
  | 'workflow';

export type ToolName =
  | 'deep_link'
  | 'ui_tap'
  | 'ui_type'
  | 'http_request'
  | 'create_watchdog'
  | 'memory_search'
  | 'send_notification'
  | 'get_screen_text'
  | 'browser_command'
  | 'respond';

export interface AgentAction {
  agent: AgentRole;
  action: ToolName | string;
  params: Record<string, unknown>;
  reasoning: string[];
}

export interface OrchestratorResponse {
  agent: AgentRole;
  action: string;
  params: Record<string, unknown>;
  reasoning: string[];
  raw?: string;
}

export interface ThoughtEvent {
  id: string;
  timestamp: number;
  agent: AgentRole;
  message: string;
  action?: AgentAction;
}

export interface MemoryRecord {
  id: string;
  text: string;
  type: MemoryType;
  timestamp: number;
  encrypted: number;
  source?: string;
}

export type MemoryType = 'episodic' | 'semantic' | 'preference' | 'person' | 'project' | 'task' | 'sms' | 'email' | 'ocr';

export interface Watchdog {
  id: string;
  trigger: string;
  params: Record<string, unknown>;
  action: string;
  active: number;
  createdAt: number;
  lastRunAt?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  agent: AgentRole;
  action: string;
  params: string;
  result: string;
  risk: number;
  approved: number;
}

export interface BrowserCommand {
  action: 'fill' | 'click' | 'navigate' | 'extract';
  selector?: string;
  value?: string;
  url?: string;
}

export type TaskStatus = 'queued' | 'running' | 'awaiting_approval' | 'completed' | 'failed';

export interface ExecutionTask {
  id: string;
  title: string;
  status: TaskStatus;
  progress: number;
  agentRole: AgentRole;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  email: string;
  plan: 'free' | 'ghost_pro';
  creditsUsed: number;
  creditsTotal: number;
}

export interface PredictionCard {
  id: string;
  title: string;
  subtitle: string;
  action?: string;
}

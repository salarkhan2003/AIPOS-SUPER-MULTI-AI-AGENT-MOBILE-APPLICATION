/**
 * Ghost Orchestrator — 8 agents via Groq JSON mode
 * Flow: User Input → Planner → Research → Executor → Verifier → Response
 */
import { agentChat, agentSimpleReply, formatAgentError, parseAgentJson } from '@/lib/agents';
import * as appmesh from '@/lib/appmesh';
import { logAudit } from '@/lib/audit';
import { uuid } from '@/lib/db';
import { formatDisplayText } from '@/lib/displayText';
import { EVENTS, ghostEvents } from '@/lib/events';
import { memory } from '@/lib/memory';
import { notifyLocal } from '@/lib/notifications-local';
import {
  deadlinesStorage,
  meetingsStorage,
  tasksStorage,
  type Category,
  type Priority,
} from '@/lib/storage';
import { watchdogs } from '@/lib/watchdogs';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import type { AgentRole, OrchestratorResponse, ThoughtEvent } from '@/types';

const MAX_STEPS = 6;

function emitThought(agent: AgentRole, message: string, action?: OrchestratorResponse) {
  const t: ThoughtEvent = {
    id: uuid(),
    timestamp: Date.now(),
    agent,
    message,
    action: action
      ? {
          agent: action.agent as AgentRole,
          action: action.action,
          params: action.params,
          reasoning: action.reasoning,
        }
      : undefined,
  };
  ghostEvents.emit(EVENTS.THOUGHT, t);
  return t;
}

async function callAgent(
  agent: AgentRole,
  userInput: string,
  context: string,
): Promise<OrchestratorResponse> {
  const raw = await agentChat([
    {
      role: 'user',
      content: `Agent role: ${agent}. User said: "${userInput}". Context: ${context.slice(0, 1500)}. Return next JSON action for this agent only.`,
    },
  ]);
  const parsed = parseAgentJson(raw);
  return {
    agent: (parsed.agent as AgentRole) || agent,
    action: parsed.action,
    params: parsed.params,
    reasoning: parsed.reasoning,
    raw,
  };
}

export async function executeTool(
  action: string,
  params: Record<string, unknown>,
): Promise<string> {
  switch (action) {
    case 'deep_link': {
      const app = String(params.app ?? '').toLowerCase();
      if (app.includes('whatsapp')) {
        const contact = String(params.contact ?? params.to ?? params.name ?? '');
        const text = String(params.text ?? params.message ?? '');
        if (contact) {
          const { ok, detail } = await sendWhatsAppMessage(contact, text);
          return detail;
        }
      }
      const ok = await appmesh.deepLink(app, params);
      return ok ? `Opened ${app}` : `Failed to open ${app}`;
    }
    case 'search_app': {
      const app = String(params.app ?? '').toLowerCase();
      const query = String(params.query ?? params.search ?? '');
      const ok = await appmesh.searchOnApp(app, query);
      return ok ? `Searched "${query}" on ${app}` : `Failed to search ${app}`;
    }
    case 'ui_tap': {
      const app = String(params.app ?? 'whatsapp');
      const text = String(params.text ?? params.xpath ?? '');
      const ok = await appmesh.uiTap(app, text, String(params.xpath ?? ''));
      return ok ? `Tapped "${text}" in ${app}` : `ui_tap failed — enable Accessibility`;
    }
    case 'ui_type': {
      const app = String(params.app ?? 'whatsapp');
      const field = String(params.text ?? 'Search');
      const value = String(params.value ?? '');
      const ok = await appmesh.uiType(app, field, value);
      return ok ? `Typed in ${app}` : `ui_type failed`;
    }
    case 'get_screen_text': {
      const app = String(params.app ?? 'whatsapp');
      const text = await appmesh.getScreenText(app);
      return text || 'No screen text';
    }
    case 'http_request': {
      const url = String(params.url ?? '');
      const method = String(params.method ?? 'GET').toUpperCase();
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(params.headers as Record<string, string>) },
        body: method !== 'GET' ? JSON.stringify(params.body ?? {}) : undefined,
      });
      const body = await res.text();
      return `HTTP ${res.status}: ${body.slice(0, 500)}`;
    }
    case 'create_watchdog': {
      const id = await watchdogs.register(
        String(params.trigger ?? 'interval_15m'),
        (params.params as Record<string, unknown>) ?? {},
        String(params.action ?? 'notify'),
      );
      return `Watchdog created: ${id}`;
    }
    case 'memory_search': {
      const q = String(params.query ?? '');
      const hits = await memory.search(q, Number(params.k ?? 5));
      if (!hits.length) return 'No memories found for that query.';
      return hits.map((h) => `• ${h.text.slice(0, 200)}`).join('\n');
    }
    case 'whatsapp_send': {
      const contact = String(params.contact ?? params.to ?? params.name ?? '');
      const message = String(params.message ?? params.text ?? '');
      const { ok, detail } = await sendWhatsAppMessage(contact, message);
      return detail;
    }
    case 'send_notification': {
      await notifyLocal(String(params.title ?? 'Ghost'), String(params.body ?? ''));
      return 'Notification sent';
    }
    case 'browser_command':
      return 'browser_command queued — open Browser screen';
    case 'list_tasks': {
      const tasks = await tasksStorage.list();
      if (tasks.length === 0) return 'No tasks found';
      return tasks.map(t => `• ${t.title}${t.completed ? ' (completed)' : ''}`).join('\n');
    }
    case 'list_meetings': {
      const meetings = await meetingsStorage.list();
      if (meetings.length === 0) return 'No meetings found';
      return meetings.map(m => `• ${m.title} on ${m.date} at ${m.time}`).join('\n');
    }
    case 'list_deadlines': {
      const deadlines = await deadlinesStorage.list();
      if (deadlines.length === 0) return 'No deadlines found';
      return deadlines.map(d => `• ${d.title} due ${d.dueDate}`).join('\n');
    }
    case 'create_task': {
      const title = String(params.title ?? '');
      if (!title) return 'Task title required';
      await tasksStorage.add({
        title,
        description: params.description ? String(params.description) : undefined,
        priority: (params.priority as Priority) ?? 'medium',
        category: (params.category as Category) ?? 'personal',
        dueDate: params.dueDate ? String(params.dueDate) : undefined,
        repeat: 'none',
      });
      return `Created task: ${title}`;
    }
    case 'create_meeting': {
      const title = String(params.title ?? '');
      if (!title) return 'Meeting title required';
      await meetingsStorage.add({
        title,
        description: params.description ? String(params.description) : undefined,
        date: params.date ? String(params.date) : new Date().toISOString().split('T')[0],
        time: params.time ? String(params.time) : '10:00',
        location: params.location ? String(params.location) : undefined,
        category: (params.category as Category) ?? 'personal',
        priority: (params.priority as Priority) ?? 'medium',
        repeat: 'none',
      });
      return `Created meeting: ${title}`;
    }
    case 'create_deadline': {
      const title = String(params.title ?? '');
      if (!title) return 'Deadline title required';
      await deadlinesStorage.add({
        title,
        description: params.description ? String(params.description) : undefined,
        dueDate: params.dueDate ? String(params.dueDate) : new Date().toISOString().split('T')[0],
        category: (params.category as Category) ?? 'personal',
        priority: (params.priority as Priority) ?? 'medium',
        repeat: 'none',
      });
      return `Created deadline: ${title}`;
    }
    case 'respond':
      return String(params.message ?? params.text ?? 'Done.');
    default:
      return `Unknown action: ${action}`;
  }
}

async function runGhostInner(userInput: string): Promise<{
  finalMessage: string;
  thoughts: ThoughtEvent[];
}> {
  const thoughts: ThoughtEvent[] = [];
  let context = '';
  let finalMessage = 'Done.';

  const memHits = await memory.search(userInput, 3);
  if (memHits.length) {
    context += `Memory: ${memHits.map((m) => m.text).join('; ')}`;
  }

  emitThought('planner', `Planning: "${userInput}"`);
  let step = await callAgent('planner', userInput, context);
  thoughts.push(emitThought('planner', step.reasoning.join(' · ') || step.action, step));

  const chain: AgentRole[] = ['research', 'executor', 'verifier'];
  let iterations = 0;

  while (iterations < MAX_STEPS) {
    iterations++;
    const agent = chain[Math.min(iterations - 1, chain.length - 1)] ?? 'executor';

    if (step.action === 'respond') {
      finalMessage = String(step.params.message ?? step.params.text ?? 'Done.');
      break;
    }

    if (iterations === 1 && step.agent === 'planner' && step.action !== 'respond') {
      const research = await callAgent('research', userInput, context + JSON.stringify(step.params));
      thoughts.push(emitThought('research', research.reasoning.join(' · ') || research.action, research));
      context += ` Research: ${research.raw}`;
    }

    const execAgent: AgentRole = step.agent === 'planner' ? 'executor' : (step.agent as AgentRole);
    if (['deep_link', 'search_app', 'ui_tap', 'ui_type', 'http_request', 'create_watchdog', 'memory_search', 'send_notification', 'get_screen_text', 'whatsapp_send', 'list_tasks', 'list_meetings', 'list_deadlines', 'create_task', 'create_meeting', 'create_deadline'].includes(step.action)) {
      const result = await executeTool(step.action, step.params);
      await logAudit(execAgent, step.action, step.params, result, 20);
      thoughts.push(emitThought('executor', result, step));

      const verify = await callAgent('verifier', userInput, `Tool result: ${result}`);
      thoughts.push(emitThought('verifier', verify.reasoning.join(' · ') || 'verified', verify));

      if (verify.action === 'respond') {
        finalMessage = String(verify.params.message ?? result);
        break;
      }
      step = verify;
      continue;
    }

    step = await callAgent(agent, userInput, context);
    thoughts.push(emitThought(agent, step.reasoning.join(' · ') || step.action, step));

    if (step.action === 'respond') {
      finalMessage = String(step.params.message ?? 'Done.');
      break;
    }
  }

  await memory.add(`User: ${userInput} → Ghost: ${finalMessage}`, 'episodic');
  await logAudit('executor', 'ghost_run', { input: userInput }, finalMessage, 5);

  finalMessage = formatDisplayText(finalMessage);

  return { finalMessage, thoughts };
}

/** Main entry: process natural language command */
export async function runGhost(userInput: string): Promise<{
  finalMessage: string;
  thoughts: ThoughtEvent[];
}> {
  try {
    return await runGhostInner(userInput);
  } catch (err) {
    const friendly = formatAgentError(err);
    try {
      const simple = await agentSimpleReply(userInput);
      const t: ThoughtEvent = {
        id: uuid(),
        timestamp: Date.now(),
        agent: 'planner',
        message: simple,
      };
      return { finalMessage: formatDisplayText(simple), thoughts: [t] };
    } catch {
      const t: ThoughtEvent = {
        id: uuid(),
        timestamp: Date.now(),
        agent: 'planner',
        message: friendly,
      };
      return { finalMessage: friendly, thoughts: [t] };
    }
  }
}

/** Home screen predictions from Planner */
export async function fetchPredictions(): Promise<{ id: string; title: string; subtitle: string; action?: string }[]> {
  try {
    const raw = await agentChat(
      [
        {
          role: 'user',
          content:
            'Return JSON: {"predictions":[{"title":"","subtitle":"","action":""}]} with 3 short predictive actions for a 22yo in Nellore India (productivity, travel, family).',
        },
      ],
      true,
    );
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '')) as {
      predictions: { title: string; subtitle: string; action?: string }[];
    };
    return (parsed.predictions ?? []).slice(0, 3).map((p, i) => ({
      id: `pred-${i}`,
      title: p.title,
      subtitle: p.subtitle,
      action: p.action,
    }));
  } catch {
    return [
      { id: '1', title: 'Book cab to station', subtitle: 'Uber deep link', action: 'book cab' },
      { id: '2', title: 'Text Mom ETA', subtitle: 'WhatsApp', action: "text Mom I'm reaching in 10min" },
      { id: '3', title: 'Check train 12712', subtitle: 'IRCTC watchdog', action: 'train delay 12712' },
    ];
  }
}

export const AGENT_RESPONSIBILITIES: Record<AgentRole, string> = {
  planner: 'Goal decomposition',
  research: 'Information gathering',
  executor: 'Tool execution',
  verifier: 'Validation',
  memory: 'Context storage',
  security: 'Permissions',
  communication: 'Messaging',
  workflow: 'Automations',
};

// CLI test helper
export async function testOrchestrator(input: string): Promise<void> {
  const result = await runGhost(input);
  console.log('[Ghost]', JSON.stringify(result, null, 2));
}

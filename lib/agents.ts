/**
 * Ghost AI Agents — Groq (primary) + OpenAI (fallback via OpenRouter)
 *
 * APK BUILD: Both keys are baked into the APK via app.config.ts extra{}.
 * The app reads them from Constants.expoConfig.extra at runtime — no .env needed on device.
 *
 * Key resolution order:
 *   1. process.env.EXPO_PUBLIC_* (Metro bundler, dev builds)
 *   2. Constants.expoConfig.extra (EAS/production APK builds)
 */
import Constants from 'expo-constants';

// ── API endpoints ─────────────────────────────────────────────────────────────
const GROQ_API   = 'https://api.groq.com/openai/v1';
const OPENAI_API = 'https://openrouter.ai/api/v1'; // OpenAI-compatible via OpenRouter

// ── Models ────────────────────────────────────────────────────────────────────
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
] as const;

const OPENAI_MODEL = 'mistralai/mistral-7b-instruct';

// ── Types ─────────────────────────────────────────────────────────────────────
export type AgentProvider = 'groq' | 'openai';
export type ChatMessage   = { role: 'system' | 'user' | 'assistant'; content: string };

type CompletionBody = { choices?: Array<{ message?: { content?: string } }> };

type ExtraConfig = {
  groqApiKey?: string;
  openRouterApiKey?: string;
  groqKeySet?: boolean;
};

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT =
  'You are Ghost, the user\'s AI OS. User: 22M, India, Nellore.\n' +
  'Output ONLY valid JSON: {"agent":"planner|research|executor|verifier|memory|security|communication|workflow","action":"TOOL","params":{},"reasoning":["step"]}\n' +
  'TOOLS (use exact names): deep_link(app:uber|whatsapp|gmail|flipkart|amazon|playstore|gallery|camera|settings|calculator|calendar|youtube|maps|messages|phone|spotify|netflix), search_app(app,query), whatsapp_send(contact,name,message,text), ui_tap(app,text), ui_type(app,text,value), http_request(url), create_watchdog(trigger,params,action), memory_search(query), send_notification(title,body), get_screen_text(app), browser_command, respond(message).\n' +
  'Contacts are saved in Settings by name+phone. User must set their WhatsApp number in Settings.\n' +
  'For general chat or questions, use: {"agent":"planner","action":"respond","params":{"message":"your helpful reply"},"reasoning":["Reply"]}\n' +
  'Examples: "book cab" -> {"agent":"executor","action":"deep_link","params":{"app":"uber"},"reasoning":["Open Uber"]}\n' +
  '"text Mom I\'m reaching in 10 min" -> {"agent":"executor","action":"whatsapp_send","params":{"contact":"Mom","message":"I\'m reaching in 10 min"},"reasoning":["Send via WhatsApp"]}\n' +
  '"search shoes on flipkart" -> {"agent":"executor","action":"search_app","params":{"app":"flipkart","query":"shoes"},"reasoning":["Search Flipkart"]}';

// ── Key resolution — works in both dev (Metro) and APK (EAS baked extra) ──────
function getExtra(): ExtraConfig {
  return (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
}

function resolveKey(
  envVar: string,
  extraField: keyof ExtraConfig,
  placeholder?: string,
): string | undefined {
  // 1. Metro bundler inlines process.env.EXPO_PUBLIC_* at build time
  const fromEnv = process.env[envVar]?.trim();
  if (fromEnv && fromEnv.length > 10 && (!placeholder || !fromEnv.includes(placeholder))) {
    return fromEnv;
  }
  // 2. EAS bakes keys into Constants.expoConfig.extra at APK build time
  const raw = getExtra()[extraField];
  const fromExtra = typeof raw === 'string' ? raw.trim() : '';
  if (fromExtra.length > 10 && (!placeholder || !fromExtra.includes(placeholder))) {
    return fromExtra;
  }
  return undefined;
}

// ── Public API ────────────────────────────────────────────────────────────────
export function isAiConfigured(): boolean {
  return !!(
    resolveKey('EXPO_PUBLIC_GROQ_API_KEY', 'groqApiKey', 'your_groq') ||
    resolveKey('EXPO_PUBLIC_OPENROUTER_API_KEY', 'openRouterApiKey')
  );
}

/** @deprecated use isAiConfigured */
export const isGroqConfigured = isAiConfigured;

export function getGroqKey(): string {
  const key = resolveKey('EXPO_PUBLIC_GROQ_API_KEY', 'groqApiKey', 'your_groq');
  if (!key) throw new Error('Groq API key missing. Add EXPO_PUBLIC_GROQ_API_KEY to aipos/.env and rebuild APK.');
  return key;
}

export function getOpenAiKey(): string {
  const key = resolveKey('EXPO_PUBLIC_OPENROUTER_API_KEY', 'openRouterApiKey');
  if (!key) throw new Error('OpenAI API key missing. Add EXPO_PUBLIC_OPENROUTER_API_KEY to aipos/.env and rebuild APK.');
  return key;
}

/** @deprecated use getOpenAiKey */
export const getOpenRouterKey = getOpenAiKey;

export function getAgentProviders(): { groq: boolean; openai: boolean } {
  return {
    groq:   !!resolveKey('EXPO_PUBLIC_GROQ_API_KEY', 'groqApiKey', 'your_groq'),
    openai: !!resolveKey('EXPO_PUBLIC_OPENROUTER_API_KEY', 'openRouterApiKey'),
  };
}

/** Verify both APIs are reachable — call after APK launch to surface key issues early */
export async function verifyAgentApis(): Promise<{ groq: boolean; openai: boolean; errors: string[] }> {
  const errors: string[] = [];
  let groqOk = false;
  let openaiOk = false;

  const groqKey = resolveKey('EXPO_PUBLIC_GROQ_API_KEY', 'groqApiKey', 'your_groq');
  if (groqKey) {
    try {
      const res = await fetch(GROQ_API + '/models', {
        headers: { Authorization: 'Bearer ' + groqKey },
      });
      groqOk = res.ok;
      if (!res.ok) errors.push('Groq: HTTP ' + res.status);
    } catch (e) {
      errors.push('Groq: ' + (e instanceof Error ? e.message : String(e)));
    }
  } else {
    errors.push('Groq: key not set');
  }

  const openaiKey = resolveKey('EXPO_PUBLIC_OPENROUTER_API_KEY', 'openRouterApiKey');
  if (openaiKey) {
    try {
      const res = await fetch(OPENAI_API + '/models', {
        headers: { Authorization: 'Bearer ' + openaiKey },
      });
      openaiOk = res.ok;
      if (!res.ok) errors.push('OpenAI: HTTP ' + res.status);
    } catch (e) {
      errors.push('OpenAI: ' + (e instanceof Error ? e.message : String(e)));
    }
  } else {
    errors.push('OpenAI: key not set');
  }

  return { groq: groqOk, openai: openaiOk, errors };
}

export function formatAgentError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('API key missing') || raw.includes('EXPO_PUBLIC_')) {
    return 'AI not configured. Set EXPO_PUBLIC_GROQ_API_KEY and/or EXPO_PUBLIC_OPENROUTER_API_KEY in aipos/.env, then rebuild the APK.';
  }
  if (raw.includes('401') || raw.includes('invalid_api_key')) {
    return 'Invalid API key. Update keys in aipos/.env and rebuild the APK.';
  }
  if (raw.includes('429')) return 'Rate limit reached. Wait a minute and try again.';
  if (raw.includes('Failed to fetch') || raw.includes('Network')) {
    return 'No internet connection. Check Wi-Fi or mobile data.';
  }
  if (raw.length > 180) return raw.slice(0, 180) + '...';
  return raw || 'AI request failed. Please try again.';
}

/** @deprecated use formatAgentError */
export const formatGroqError = formatAgentError;

// ── Internal chat functions ───────────────────────────────────────────────────
async function groqChatOnce(
  key: string,
  model: string,
  messages: ChatMessage[],
  jsonMode: boolean,
): Promise<string> {
  const res = await fetch(GROQ_API + '/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    const err = new Error('Groq ' + res.status + ' (' + model + '): ' + errText.slice(0, 200));
    if (res.status === 401 || res.status === 403) throw err;
    throw err;
  }
  const data = (await res.json()) as CompletionBody;
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new Error('Empty response from Groq');
  return content;
}

async function openAiChatOnce(
  key: string,
  messages: ChatMessage[],
  jsonMode: boolean,
): Promise<string> {
  const res = await fetch(OPENAI_API + '/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ghost-ai.app',
      'X-Title': 'Ghost AI OS',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error('OpenAI ' + res.status + ': ' + errText.slice(0, 200));
  }
  const data = (await res.json()) as CompletionBody;
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new Error('Empty response from OpenAI');
  return content;
}

/** Primary: Groq. Fallback: OpenAI. Both tried before giving up. */
export async function agentChat(messages: ChatMessage[], jsonMode = true): Promise<string> {
  let lastError: Error | null = null;

  const groqKey = resolveKey('EXPO_PUBLIC_GROQ_API_KEY', 'groqApiKey', 'your_groq');
  if (groqKey) {
    for (const model of GROQ_MODELS) {
      try {
        return await groqChatOnce(groqKey, model, messages, jsonMode);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (lastError.message.includes('401') || lastError.message.includes('403') || lastError.message.includes('API key')) {
          throw lastError;
        }
      }
    }
  }

  const openaiKey = resolveKey('EXPO_PUBLIC_OPENROUTER_API_KEY', 'openRouterApiKey');
  if (openaiKey) {
    try {
      return await openAiChatOnce(openaiKey, messages, jsonMode);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  if (!groqKey && !openaiKey) {
    throw new Error('No AI keys configured. Add EXPO_PUBLIC_GROQ_API_KEY or EXPO_PUBLIC_OPENROUTER_API_KEY to aipos/.env and rebuild.');
  }

  throw lastError ?? new Error('All AI providers unavailable');
}

/** @deprecated use agentChat */
export const groqChat = agentChat;

export async function agentSimpleReply(userInput: string): Promise<string> {
  const prompt =
    'Reply helpfully and briefly to: "' + userInput +
    '". Return JSON: {"agent":"planner","action":"respond","params":{"message":"..."},"reasoning":[]}';
  const raw = await agentChat([{ role: 'user', content: prompt }], true);
  const parsed = parseAgentJson(raw);
  return String(parsed.params.message ?? parsed.params.text ?? raw);
}

/** @deprecated */
export const groqSimpleReply = agentSimpleReply;

export async function groqWhisper(audioUri: string): Promise<string> {
  try {
    const key = getGroqKey();
    const form = new FormData();
    // @ts-ignore - React Native FormData accepts this format
    form.append('file', { uri: audioUri, name: 'audio.m4a', type: 'audio/m4a' });
    form.append('model', 'whisper-large-v3');
    form.append('language', 'en');

    const res = await fetch(GROQ_API + '/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key },
      body: form,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new Error('Whisper error ' + res.status + ': ' + errorText.slice(0, 120));
    }

    const data = (await res.json()) as { text: string };
    return data.text?.trim() ?? '';
  } catch (error) {
    console.error('Error in groqWhisper:', error);
    throw error;
  }
}

export function parseAgentJson(raw: string): {
  agent: string;
  action: string;
  params: Record<string, unknown>;
  reasoning: string[];
} {
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        return { agent: 'planner', action: 'respond', params: { message: cleaned || 'Done.' }, reasoning: [] };
      }
    } else {
      return { agent: 'planner', action: 'respond', params: { message: cleaned || 'Done.' }, reasoning: [] };
    }
  }
  const params = (parsed.params as Record<string, unknown>) ?? {};
  return {
    agent: String(parsed.agent ?? 'planner'),
    action: String(parsed.action ?? 'respond'),
    params,
    reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning.map(String) : [],
  };
}

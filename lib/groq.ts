import Constants from 'expo-constants';

const GROQ_API = 'https://api.groq.com/openai/v1';

const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.1-70b-versatile'] as const;

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type GroqCompletionBody = {
  choices?: Array<{ message?: { content?: string } }>;
};

const SYSTEM_PROMPT = `You are Ghost, the user's AI OS. User: 22M, India, Nellore.
Output ONLY valid JSON: {"agent":"planner|research|executor|verifier|memory|security|communication|workflow","action":"TOOL","params":{},"reasoning":["step"]}
TOOLS (use exact names): deep_link(app:uber|whatsapp|gmail), whatsapp_send(contact,name,message,text), ui_tap(app,text), ui_type(app,text,value), http_request(url), create_watchdog(trigger,params,action), memory_search(query), send_notification(title,body), get_screen_text(app), browser_command, respond(message).
Contacts are saved in Settings by name+phone. User must set their WhatsApp number in Settings.
For general chat or questions, use: {"agent":"planner","action":"respond","params":{"message":"your helpful reply"},"reasoning":["Reply"]}
Examples: "book cab" -> {"agent":"executor","action":"deep_link","params":{"app":"uber"},"reasoning":["Open Uber"]}
"text Mom I'm reaching in 10 min" -> {"agent":"executor","action":"whatsapp_send","params":{"contact":"Mom","message":"I'm reaching in 10 min"},"reasoning":["Send via WhatsApp"]}`;

export function isGroqConfigured(): boolean {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();
  if (key && key.length > 10 && !key.includes('your_groq')) return true;
  const extra = Constants.expoConfig?.extra as { groqApiKey?: string } | undefined;
  return !!(extra?.groqApiKey && String(extra.groqApiKey).length > 10);
}

export function getGroqKey(): string {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();
  if (!key || key.includes('your_groq') || key.length < 10) {
    throw new Error(
      'Groq API key missing. Add EXPO_PUBLIC_GROQ_API_KEY=gsk_... to aipos/.env then restart with: npx expo start -c',
    );
  }
  return key;
}

export function formatGroqError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('EXPO_PUBLIC_GROQ_API_KEY') || raw.includes('API key missing')) {
    return 'AI is not configured. Add your Groq API key in aipos/.env and restart the app (npx expo start -c).';
  }
  if (raw.includes('401') || raw.includes('invalid_api_key')) {
    return 'Invalid Groq API key. Check your key at console.groq.com and update aipos/.env';
  }
  if (raw.includes('429')) {
    return 'Groq rate limit reached. Wait a minute and try again.';
  }
  if (raw.includes('Failed to fetch') || raw.includes('Network')) {
    return 'No internet connection. Check Wi‑Fi or mobile data and try again.';
  }
  if (raw.length > 180) return `${raw.slice(0, 180)}…`;
  return raw || 'AI request failed. Please try again.';
}

async function groqChatOnce(
  key: string,
  model: string,
  messages: ChatMessage[],
  jsonMode: boolean,
): Promise<string> {
  const res = await fetch(`${GROQ_API}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
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
    const err = new Error(`Groq ${res.status} (${model}): ${errText.slice(0, 200)}`);
    if (res.status === 401 || res.status === 403) throw err;
    throw err;
  }

  const data = (await res.json()) as GroqCompletionBody;
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new Error('Empty response from Groq');
  return content;
}

export async function groqChat(messages: ChatMessage[], jsonMode = true): Promise<string> {
  const key = getGroqKey();
  let lastError: Error | null = null;

  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i];
    try {
      return await groqChatOnce(key, model, messages, jsonMode);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const msg = lastError.message;
      if (msg.includes('401') || msg.includes('API key') || msg.includes('403')) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error('Groq API unavailable');
}

export async function groqSimpleReply(userInput: string): Promise<string> {
  const raw = await groqChat(
    [
      {
        role: 'user',
        content: `Reply helpfully and briefly to: "${userInput}". Return JSON: {"agent":"planner","action":"respond","params":{"message":"..."},"reasoning":[]}`,
      },
    ],
    true,
  );
  const parsed = parseAgentJson(raw);
  return String(parsed.params.message ?? parsed.params.text ?? raw);
}

export async function groqWhisper(audioUri: string): Promise<string> {
  const key = getGroqKey();
  const form = new FormData();
  form.append('file', {
    uri: audioUri,
    name: 'audio.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);
  form.append('model', 'whisper-large-v3');
  form.append('language', 'en');

  const res = await fetch(`${GROQ_API}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Whisper error ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = (await res.json()) as { text: string };
  return data.text?.trim() ?? '';
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
        return {
          agent: 'planner',
          action: 'respond',
          params: { message: cleaned || 'Done.' },
          reasoning: [],
        };
      }
    } else {
      return {
        agent: 'planner',
        action: 'respond',
        params: { message: cleaned || 'Done.' },
        reasoning: [],
      };
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

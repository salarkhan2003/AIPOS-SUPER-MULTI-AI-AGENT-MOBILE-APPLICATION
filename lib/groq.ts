const GROQ_API = 'https://api.groq.com/openai/v1';
/** Groq: llama-3.1-70b-versatile deprecated → 3.3 equivalent */
const MODEL = 'llama-3.3-70b-versatile';

export function getGroqKey(): string {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!key) throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set');
  return key;
}

const SYSTEM_PROMPT = `You are Ghost, the user's AI OS. User: 22M, India, Nellore.
Output ONLY valid JSON: {"agent":"planner|research|executor|verifier|memory|security|communication|workflow","action":"TOOL","params":{},"reasoning":["step"]}
TOOLS (use exact names): deep_link(app:uber|whatsapp|gmail), ui_tap(app,text), ui_type(app,text,value), http_request(url), create_watchdog(trigger,params,action), memory_search(query), send_notification(title,body), get_screen_text(app), browser_command, respond(message).
Examples: "book cab" -> {"agent":"executor","action":"deep_link","params":{"app":"uber"},"reasoning":["Open Uber"]}
"text Mom" -> {"agent":"executor","action":"deep_link","params":{"app":"whatsapp","text":"..."},"reasoning":["Open WhatsApp"]}`;

let cachedSystem = SYSTEM_PROMPT;

export async function groqChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  jsonMode = true,
): Promise<string> {
  const res = await fetch(`${GROQ_API}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getGroqKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: cachedSystem }, ...messages],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: jsonMode ? { type: 'json_object' } : undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? '{}';
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
  if (!res.ok) throw new Error(`Whisper error ${res.status}: ${await res.text()}`);
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
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  return {
    agent: String(parsed.agent ?? 'planner'),
    action: String(parsed.action ?? 'respond'),
    params: (parsed.params as Record<string, unknown>) ?? {},
    reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning.map(String) : [],
  };
}

/** Run: node --env-file=.env scripts/test-orchestrator.mjs "book cab" */
const key = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const input = process.argv[2] ?? 'book cab';

const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are Ghost. Output JSON: {agent, action, params, reasoning}. Tools: deep_link, ui_tap, respond.',
      },
      { role: 'user', content: `Planner: user said "${input}"` },
    ],
  }),
});
const data = await res.json();
if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}
console.log(data.choices?.[0]?.message?.content);

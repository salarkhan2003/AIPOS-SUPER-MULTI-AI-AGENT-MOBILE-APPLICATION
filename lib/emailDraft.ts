import { agentChat } from '@/lib/agents';

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

/** Generate structured email draft (does not send). */
export async function generateEmailDraft(
  description: string,
  recipientHint = '',
): Promise<EmailDraft> {
  const raw = await agentChat(
    [
      {
        role: 'user',
        content: `Write a professional email based on this request: "${description}"
${recipientHint ? `Recipient hint: ${recipientHint}` : 'If no recipient given, use a sensible placeholder like recipient@example.com'}
Return ONLY JSON: {"to":"email@domain.com","subject":"clear subject line","body":"full email body with greeting and sign-off"}`,
      },
    ],
    true,
  );

  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  let body = String(parsed.body ?? '').trim();
  const subject = String(parsed.subject ?? 'Draft email').trim();
  let to = String(parsed.to ?? recipientHint ?? '').trim();

  if (!to) to = 'recipient@example.com';

  return { to, subject, body };
}

export function parseEmailFromText(text: string): Partial<EmailDraft> {
  const subjectMatch = text.match(/subject:\s*(.+)/i);
  const toMatch = text.match(/to:\s*(\S+@\S+)/i);
  return {
    to: toMatch?.[1],
    subject: subjectMatch?.[1]?.trim(),
    body: text,
  };
}

/**
 * Converts raw tool/agent output (often JSON) into human-readable text.
 */
export function formatDisplayText(raw: string): string {
  if (!raw?.trim()) return '';

  const httpMatch = raw.trim().match(/^HTTP (\d+):\s*([\s\S]*)$/);
  if (httpMatch) {
    const status = httpMatch[1];
    const body = httpMatch[2].trim();
    if (body.startsWith('{') || body.startsWith('[')) {
      try {
        return `HTTP ${status}: ${formatParsedValue(JSON.parse(body))}`;
      } catch {
        /* keep body */
      }
    }
    return raw;
  }

  const t = raw.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return raw;

  try {
    return formatParsedValue(JSON.parse(t));
  } catch {
    return raw;
  }
}

function formatParsedValue(p: unknown): string {
  if (p === null || p === undefined) return '';
  if (typeof p === 'string') return p;
  if (typeof p === 'number' || typeof p === 'boolean') return String(p);

  if (Array.isArray(p)) {
    if (p.length === 0) return 'No results found.';
    if (p.every((x) => x && typeof x === 'object')) {
      const lines = p.map((item) => {
        const o = item as Record<string, unknown>;
        const text = o.text ?? o.content ?? o.message ?? o.title ?? o.name;
        if (text) return `• ${String(text)}`;
        const id = o.id ? `[${o.id}] ` : '';
        return `• ${id}${JSON.stringify(item).slice(0, 120)}`;
      });
      return lines.join('\n');
    }
    return p.map((x) => formatParsedValue(x)).filter(Boolean).join('\n');
  }

  if (typeof p === 'object') {
    const o = p as Record<string, unknown>;
    for (const key of ['message', 'text', 'result', 'response', 'content', 'body', 'summary', 'title', 'description']) {
      const v = o[key];
      if (typeof v === 'string' && v.trim()) return v;
    }
    const params = o.params as Record<string, unknown> | undefined;
    if (params) {
      const fromParams = formatParsedValue(params);
      if (fromParams && fromParams !== JSON.stringify(params)) return fromParams;
    }
    const simple = Object.entries(o).filter(
      ([, v]) => v != null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'),
    );
    if (simple.length > 0 && simple.length <= 5) {
      return simple.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ');
    }
  }

  const s = JSON.stringify(p);
  return s.length > 400 ? `${s.slice(0, 400)}…` : s;
}

/** @deprecated use formatDisplayText */
export const cleanDisplayText = formatDisplayText;

import { getDb, uuid } from '@/lib/db';
import type { MemoryRecord, MemoryType } from '@/types';

/** Lightweight local embedding (384-dim hash projection) — swap for ONNX MiniLM in native build */
function embedText(text: string): Float32Array {
  const dim = 384;
  const vec = new Float32Array(dim);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const token of tokens) {
    let h = 0;
    for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % dim;
    vec[idx] += 1;
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) vec[i] /= norm;
  return vec;
}

function blobFromFloat32(arr: Float32Array): Uint8Array {
  return new Uint8Array(arr.buffer);
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i] * b[i];
  return dot;
}

function float32FromBlob(blob: Uint8Array | null): Float32Array | null {
  if (!blob || blob.length === 0) return null;
  return new Float32Array(blob.buffer, blob.byteOffset, blob.length / 4);
}

export const memory = {
  async add(text: string, type: MemoryType = 'semantic', source?: string): Promise<string> {
    const db = await getDb();
    const id = uuid();
    const embedding = embedText(text);
    const ts = Date.now();
    await db.runAsync(
      'INSERT INTO memories (id, text, embedding, type, timestamp, encrypted, source) VALUES (?, ?, ?, ?, ?, 0, ?)',
      [id, text, blobFromFloat32(embedding), type, ts, source ?? null],
    );
    return id;
  },

  async search(query: string, k = 5): Promise<MemoryRecord[]> {
    const db = await getDb();
    const qVec = embedText(query);
    const rows = await db.getAllAsync<{
      id: string;
      text: string;
      type: string;
      timestamp: number;
      encrypted: number;
      source: string | null;
      embedding: Uint8Array | null;
    }>('SELECT id, text, type, timestamp, encrypted, source, embedding FROM memories ORDER BY timestamp DESC LIMIT 500');

    const scored = rows
      .map((r) => {
        const emb = float32FromBlob(r.embedding);
        const score = emb ? cosine(qVec, emb) : 0;
        const textBoost = r.text.toLowerCase().includes(query.toLowerCase()) ? 0.5 : 0;
        return { ...r, score: score + textBoost };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    return scored.map((r) => ({
      id: r.id,
      text: r.text,
      type: r.type as MemoryType,
      timestamp: r.timestamp,
      encrypted: r.encrypted,
      source: r.source ?? undefined,
    }));
  },

  async list(limit = 50): Promise<MemoryRecord[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string;
      text: string;
      type: string;
      timestamp: number;
      encrypted: number;
      source: string | null;
    }>('SELECT id, text, type, timestamp, encrypted, source FROM memories ORDER BY timestamp DESC LIMIT ?', [
      limit,
    ]);
    return rows.map((r) => ({
      id: r.id,
      text: r.text,
      type: r.type as MemoryType,
      timestamp: r.timestamp,
      encrypted: r.encrypted,
      source: r.source ?? undefined,
    }));
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM memories WHERE id = ?', [id]);
  },
};

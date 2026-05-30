import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('ghost.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY NOT NULL,
      text TEXT NOT NULL,
      embedding BLOB,
      type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      encrypted INTEGER DEFAULT 0,
      source TEXT
    );
    CREATE TABLE IF NOT EXISTS watchdogs (
      id TEXT PRIMARY KEY NOT NULL,
      trigger TEXT NOT NULL,
      params TEXT NOT NULL,
      action TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      last_run_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      timestamp INTEGER NOT NULL,
      agent TEXT NOT NULL,
      action TEXT NOT NULL,
      params TEXT,
      result TEXT,
      risk INTEGER DEFAULT 0,
      approved INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS entitlements (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#FFFFFF',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  return db;
}

export function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

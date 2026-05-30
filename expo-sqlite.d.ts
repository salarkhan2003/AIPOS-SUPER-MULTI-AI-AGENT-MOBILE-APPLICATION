declare module 'expo-sqlite' {
  export interface SQLiteDatabase {
    execAsync(sql: string): Promise<void>;
    runAsync(sql: string, params?: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>;
    getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
    getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  }
  export function openDatabaseAsync(name: string): Promise<SQLiteDatabase>;
}

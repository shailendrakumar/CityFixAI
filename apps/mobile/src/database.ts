// src/database.ts
// Canonical Expo SQLite database access for CityFixAI.
import * as SQLite from 'expo-sqlite';
import { applyMigrations } from './migrations';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('cityfix.db');
  }
  return dbPromise;
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const db = await getDatabase();
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await applyMigrations(db);
    return db;
  })();
  try {
    return await initPromise;
  } catch (e) {
    initPromise = null;
    throw e;
  }
}

export async function closeDatabase(): Promise<void> {
  // expo-sqlite keeps a single connection; reset handle so a fresh one can be opened.
  dbPromise = null;
  initPromise = null;
}

export async function withTransaction<T>(fn: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  const db = await initDatabase();
  let result: T;
  await db.withTransactionAsync(async () => {
    result = await fn(db);
  });
  return result!;
}

export async function resetDatabaseForTests(): Promise<void> {
  dbPromise = null;
  initPromise = null;
}
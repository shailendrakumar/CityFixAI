// src/db/schema.ts
import { initDatabase } from '../database';
import { applyMigrations } from '../migrations';

export const SCHEMA_VERSION = 2;

export async function applySchema(): Promise<void> {
  const db = await initDatabase();
  await applyMigrations(db);
}

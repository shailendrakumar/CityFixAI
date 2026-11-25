// src/db/repos/categories.ts
import { getDb } from '../client';
import type { Category } from '../../types';

export async function upsertCategory(c: Category): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO categories (id,name,icon,color,default_severity,description,is_demo) VALUES (?,?,?,?,?,?,?)`,
    [c.id, c.name, c.icon, c.color, c.defaultSeverity, c.description, c.isDemo ? 1 : 0]
  );
}
export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM categories ORDER BY name');
  return rows.map((r: any) => ({
    id: r.id, name: r.name, icon: r.icon, color: r.color, defaultSeverity: r.default_severity,
    description: r.description, isDemo: !!r.is_demo,
  }));
}

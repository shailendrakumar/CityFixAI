// src/db/repos/wards.ts
import { getDb } from '../client';
import type { Ward } from '../../types';

export async function upsertWard(w: Ward): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO wards (id,name,city,boundary_geojson,population,is_demo) VALUES (?,?,?,?,?,?)`,
    [w.id, w.name, w.city, w.boundaryGeojson, w.population, w.isDemo ? 1 : 0]
  );
}
export async function listWards(): Promise<Ward[]> {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM wards ORDER BY name');
  return rows.map((r: any) => ({
    id: r.id, name: r.name, city: r.city, boundaryGeojson: r.boundary_geojson,
    population: r.population, isDemo: !!r.is_demo,
  }));
}
export async function getWard(id: string): Promise<Ward | null> {
  const db = await getDb();
  const r: any = await db.getFirstAsync('SELECT * FROM wards WHERE id=?', [id]);
  if (!r) return null;
  return { id: r.id, name: r.name, city: r.city, boundaryGeojson: r.boundary_geojson, population: r.population, isDemo: !!r.is_demo };
}

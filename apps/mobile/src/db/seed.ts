// src/db/seed.ts — synthetic demo data, clearly labelled
import { CATEGORIES_SEED } from '../types';
import { upsertCategory } from './repos/categories';
import { upsertWard } from './repos/wards';
import { insertReport } from './repos/reports';
import type { Ward } from '../types';
import { uuid } from '../utils/uuid';

export const DEMO_WARDS: Ward[] = [
  { id: 'ward-northbridge', name: 'Northbridge', city: 'Demo City', boundaryGeojson: null, population: 42000, isDemo: true },
  { id: 'ward-riverside', name: 'Riverside', city: 'Demo City', boundaryGeojson: null, population: 38000, isDemo: true },
  { id: 'ward-oldtown', name: 'Old Town', city: 'Demo City', boundaryGeojson: null, population: 25000, isDemo: true },
  { id: 'ward-tech', name: 'Tech District', city: 'Demo City', boundaryGeojson: null, population: 31000, isDemo: true },
  { id: 'ward-greenfield', name: 'Greenfield', city: 'Demo City', boundaryGeojson: null, population: 29000, isDemo: true },
];

const DEMO_TITLES: Record<string, string[]> = {
  pothole: ['Large pothole near bus stop', 'Pothole on main road', 'Deep pothole after rain'],
  streetlight: ['Streetlight out for 2 weeks', 'Flickering lamp post', 'Dark corner at night'],
  water_leak: ['Water pooling on sidewalk', 'Leaking pipe near park', 'Hydrant leaking'],
  trash: ['Illegal dumping behind store', 'Overflowing bin', 'Construction debris left'],
  sidewalk: ['Cracked sidewalk tripping hazard', 'Blocked wheelchair access', 'Uneven pavement'],
  graffiti: ['Graffiti on underpass', 'Vandalism on wall'],
  traffic_signal: ['Signal not changing', 'Pedestrian button broken'],
  other: ['Abandoned vehicle', 'Noise complaint', 'Stray animal report'],
};

export async function seedDemoData(): Promise<{ wards: number; categories: number; reports: number }> {
  for (const c of CATEGORIES_SEED) await upsertCategory({ ...c, isDemo: false });
  for (const w of DEMO_WARDS) await upsertWard(w);

  let reportCount = 0;
  const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
  const statuses = ['open', 'in_progress', 'resolved_pending_verification', 'resolved'] as const;
  const wardIds = DEMO_WARDS.map((w) => w.id);
  const cats = Object.keys(DEMO_TITLES);

  // deterministic-ish seed
  let i = 0;
  for (const wardId of wardIds) {
    for (let j = 0; j < 8; j++) {
      const cat = cats[(i + j) % cats.length];
      const titles = DEMO_TITLES[cat];
      const title = titles[(i + j) % titles.length];
      const sev = severities[(i + j) % severities.length];
      const score = sev === 'low' ? 20 : sev === 'medium' ? 45 : sev === 'high' ? 75 : 90;
      const status = statuses[(i + j) % statuses.length];
      // rough coordinates around demo city center
      const lat = 40.7128 + (Math.sin(i + j) * 0.02);
      const lng = -74.006 + (Math.cos(i + j) * 0.02);
      await insertReport({
        id: uuid(),
        title: `[DEMO] ${title}`,
        description: `Synthetic demo report for ${cat} in ${wardId}. This is clearly labelled demo data.`,
        category: cat,
        severityScore: score,
        severityLabel: sev,
        status,
        lat, lng,
        address: `Demo St ${(i + j) * 3 + 1}, Demo City`,
        wardId,
        isDemo: true,
        aiCategory: cat,
        aiSeverity: score,
        aiConfidence: 0.8,
        aiRationale: 'Demo seed: pre-classified.',
        aiModelVersion: 'demo-seed-v1',
      });
      reportCount++;
      i++;
    }
  }
  return { wards: DEMO_WARDS.length, categories: CATEGORIES_SEED.length, reports: reportCount };
}

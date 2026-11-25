// src/services/syncEngine.ts
import { listQueued, markInFlight, markDone, markFailed, queueDepth } from '../db/repos/syncQueue';
import { getReport, updateReport } from '../db/repos/reports';
import { useAppStore } from '../stores/appStore';
import { apiFetch } from './api';

const MAX_BACKOFF_MS = 5 * 60 * 1000;

function backoffMs(attempts: number): number {
  const base = Math.min(1000 * Math.pow(2, attempts), MAX_BACKOFF_MS);
  return base + Math.random() * 1000;
}

let running = false;

export async function drainQueue(): Promise<void> {
  if (running) return;
  if (!useAppStore.getState().isOnline) return;
  running = true;
  try {
    const items = await listQueued(20);
    for (const item of items) {
      await markInFlight(item.id);
      try {
        if (item.entityType === 'report' && item.operation === 'create') {
          const report = await getReport(item.entityId);
          if (!report) { await markDone(item.id); continue; }
          const res = await apiFetch('/sync/push', {
            method: 'POST',
            body: JSON.stringify({ items: [{ client_request_id: item.clientRequestId, entity_type: 'report', operation: 'create', payload: JSON.parse(item.payload) }] }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const r = data.results?.[0];
          if (r?.status === 'ok' || r?.status === 'done') {
            await updateReport(report.id, { syncStatus: 'synced', serverId: r.server_id ?? report.serverId, syncError: null });
            if (r.server_fields) await updateReport(report.id, r.server_fields);
            await markDone(item.id);
          } else {
            throw new Error(r?.error || 'sync failed');
          }
        } else {
          // generic: try push
          const res = await apiFetch('/sync/push', {
            method: 'POST',
            body: JSON.stringify({ items: [{ client_request_id: item.clientRequestId, entity_type: item.entityType, operation: item.operation, payload: JSON.parse(item.payload) }] }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          await markDone(item.id);
        }
      } catch (e: any) {
        const attempts = item.attempts + 1;
        const dead = attempts >= item.maxAttempts;
        const next = dead ? null : new Date(Date.now() + backoffMs(attempts)).toISOString();
        await markFailed(item.id, String(e?.message ?? e), attempts, next, dead);
        if (item.entityType === 'report') {
          await updateReport(item.entityId, { syncStatus: dead ? 'failed' : 'pending', syncError: String(e?.message ?? e) });
        }
      }
    }
  } finally {
    running = false;
    const n = await queueDepth();
    useAppStore.getState().setPendingSyncCount(n);
  }
}

export function startSyncLoop(): () => void {
  const id = setInterval(() => { drainQueue(); }, 15000);
  // also drain on online
  return () => clearInterval(id);
}

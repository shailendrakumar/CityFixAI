// src/syncQueue.ts
import { initDatabase } from './database';
import type { SyncQueueItem, SyncOp } from './types';
import { uuid } from './utils/uuid';
import { getReport } from './reportRepository';

function rowTo(r: any): SyncQueueItem {
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    operation: r.operation as SyncOp,
    payload: r.payload,
    clientRequestId: r.client_request_id,
    attempts: r.attempts ?? 0,
    maxAttempts: r.max_attempts ?? 8,
    nextRetryAt: r.next_retry_at ?? null,
    status: r.status,
    lastError: r.last_error ?? null,
    createdAt: r.created_at,
  };
}

export interface EnqueueInput {
  entityType: string;
  entityId: string;
  operation: SyncOp | string;
  payload: string | object;
  clientRequestId: string;
  maxAttempts?: number;
}

export async function enqueue(input: EnqueueInput): Promise<SyncQueueItem> {
  const db = await initDatabase();
  // Prevent duplicate submissions: if a queue item with the same client request id exists, reuse it.
  const existing = await db.getFirstAsync('SELECT * FROM sync_queue WHERE client_request_id = ?', [input.clientRequestId]);
  if (existing) return rowTo(existing);

  // Never queue a report that is already confirmed by the server.
  if (input.entityType === 'report') {
    const report = await getReport(input.entityId);
    if (report?.serverId) {
      // Already synced; return a synthetic done item.
      const now = new Date().toISOString();
      return {
        id: uuid(),
        entityType: input.entityType,
        entityId: input.entityId,
        operation: input.operation as SyncOp,
        payload: typeof input.payload === 'string' ? input.payload : JSON.stringify(input.payload),
        clientRequestId: input.clientRequestId,
        attempts: 0,
        maxAttempts: input.maxAttempts ?? 8,
        nextRetryAt: null,
        status: 'done',
        lastError: null,
        createdAt: now,
      };
    }
  }

  const now = new Date().toISOString();
  const payload = typeof input.payload === 'string' ? input.payload : JSON.stringify(input.payload);
  const q: SyncQueueItem = {
    id: uuid(),
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation as SyncOp,
    payload,
    clientRequestId: input.clientRequestId,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 8,
    nextRetryAt: null,
    status: 'queued',
    lastError: null,
    createdAt: now,
  };

  await db.runAsync(
    `INSERT OR IGNORE INTO sync_queue (id,entity_type,entity_id,operation,payload,client_request_id,attempts,max_attempts,next_retry_at,status,last_error,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [q.id, q.entityType, q.entityId, q.operation, q.payload, q.clientRequestId, q.attempts, q.maxAttempts, q.nextRetryAt, q.status, q.lastError, q.createdAt]
  );

  const row = await db.getFirstAsync('SELECT * FROM sync_queue WHERE client_request_id = ?', [input.clientRequestId]);
  return row ? rowTo(row) : q;
}

export async function listQueued(limit = 50): Promise<SyncQueueItem[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync(
    `SELECT * FROM sync_queue WHERE status IN ('queued','in_flight') AND (next_retry_at IS NULL OR next_retry_at <= ?) ORDER BY created_at ASC LIMIT ?`,
    [new Date().toISOString(), limit]
  );
  return rows.map(rowTo);
}

export async function listFailed(): Promise<SyncQueueItem[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync(`SELECT * FROM sync_queue WHERE status IN ('failed','dead') ORDER BY created_at DESC`);
  return rows.map(rowTo);
}

export async function markInFlight(id: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync("UPDATE sync_queue SET status='in_flight' WHERE id=?", [id]);
}

export async function markDone(id: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync("UPDATE sync_queue SET status='done', last_error=NULL, next_retry_at=NULL WHERE id=?", [id]);
}

export async function markFailed(id: string, err: string, attempts: number, nextRetryAt: string | null, dead = false): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    "UPDATE sync_queue SET status=?, last_error=?, attempts=?, next_retry_at=? WHERE id=?",
    [dead ? 'dead' : 'queued', err, attempts, nextRetryAt, id]
  );
}

export async function retry(id: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    "UPDATE sync_queue SET status='queued', attempts=0, next_retry_at=NULL, last_error=NULL WHERE id=?",
    [id]
  );
}

export async function retryAllFailed(): Promise<number> {
  const db = await initDatabase();
  const res = await db.runAsync(
    "UPDATE sync_queue SET status='queued', attempts=0, next_retry_at=NULL WHERE status IN ('failed','dead','queued')"
  );
  return (res as any)?.changes ?? 0;
}

export async function removeCompleted(): Promise<number> {
  const db = await initDatabase();
  const res = await db.runAsync("DELETE FROM sync_queue WHERE status='done'");
  return (res as any)?.changes ?? 0;
}

export async function queueDepth(): Promise<number> {
  const db = await initDatabase();
  const row: any = await db.getFirstAsync("SELECT COUNT(*) as c FROM sync_queue WHERE status IN ('queued','in_flight')");
  return row?.c ?? 0;
}

export async function hasPendingForEntity(entityType: string, entityId: string): Promise<boolean> {
  const db = await initDatabase();
  const row: any = await db.getFirstAsync(
    "SELECT COUNT(*) as c FROM sync_queue WHERE entity_type=? AND entity_id=? AND status IN ('queued','in_flight')",
    [entityType, entityId]
  );
  return (row?.c ?? 0) > 0;
}
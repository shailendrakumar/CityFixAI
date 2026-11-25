// src/reportRepository.ts
import { initDatabase } from './database';
import type { Report, ReportImage, ReportStatus, SyncStatus } from './types';
import { uuid } from './utils/uuid';

function safeParse(s: any, fallback: any) {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

function rowToReport(r: any): Report {
  return {
    id: r.id,
    serverId: r.server_id ?? null,
    clientRequestId: r.client_request_id ?? null,
    userId: r.user_id ?? null,
    title: r.title,
    description: r.description ?? '',
    category: r.category,
    subcategory: r.subcategory ?? null,
    severityScore: r.severity_score ?? 0,
    severityLabel: r.severity_label ?? 'low',
    status: (r.status ?? 'open') as ReportStatus,
    lat: r.lat,
    lng: r.lng,
    address: r.address ?? null,
    wardId: r.ward_id ?? null,
    photoUris: safeParse(r.photo_uris, []),
    serverPhotoUrls: safeParse(r.server_photo_urls, []),
    aiCategory: r.ai_category ?? null,
    aiSeverity: r.ai_severity ?? null,
    aiConfidence: r.ai_confidence ?? null,
    aiRationale: r.ai_rationale ?? null,
    aiModelVersion: r.ai_model_version ?? null,
    duplicateOf: r.duplicate_of ?? null,
    upvoteCount: r.upvote_count ?? 0,
    isDemo: !!r.is_demo,
    syncStatus: (r.sync_status ?? 'pending') as SyncStatus,
    syncError: r.sync_error ?? null,
    serverUpdatedAt: r.server_updated_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    resolvedAt: r.resolved_at ?? null,
  };
}

function rowToImage(r: any): ReportImage {
  return {
    id: r.id,
    reportId: r.report_id,
    localUri: r.local_uri,
    remoteUrl: r.remote_url ?? null,
    uploadStatus: (r.upload_status ?? 'pending') as ReportImage['uploadStatus'],
    error: r.error ?? null,
    createdAt: r.created_at,
  };
}

export interface CreateReportInput {
  id?: string;
  clientRequestId?: string;
  userId?: string | null;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string | null;
  severityScore?: number;
  severityLabel?: string;
  status?: ReportStatus;
  lat: number;
  lng: number;
  address?: string | null;
  wardId?: string | null;
  photoUris?: string[];
  isDemo?: boolean;
  aiCategory?: string | null;
  aiSeverity?: number | null;
  aiConfidence?: number | null;
  aiRationale?: string | null;
  aiModelVersion?: string | null;
  serverId?: string | null;
  syncStatus?: SyncStatus;
}
export async function createReport(input: CreateReportInput): Promise<Report> {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const id = input.id ?? uuid();
  const clientRequestId = input.clientRequestId ?? uuid();
  const report: Report = {
    id,
    serverId: input.serverId ?? null,
    clientRequestId,
    userId: input.userId ?? null,
    title: input.title,
    description: input.description ?? '',
    category: input.category ?? 'other',
    subcategory: input.subcategory ?? null,
    severityScore: input.severityScore ?? 0,
    severityLabel: (input.severityLabel ?? 'low') as any,
    status: input.status ?? 'open',
    lat: input.lat,
    lng: input.lng,
    address: input.address ?? null,
    wardId: input.wardId ?? null,
    photoUris: input.photoUris ?? [],
    serverPhotoUrls: [],
    aiCategory: input.aiCategory ?? null,
    aiSeverity: input.aiSeverity ?? null,
    aiConfidence: input.aiConfidence ?? null,
    aiRationale: input.aiRationale ?? null,
    aiModelVersion: input.aiModelVersion ?? null,
    duplicateOf: null,
    upvoteCount: 0,
    isDemo: input.isDemo ?? false,
    syncStatus: (input.syncStatus ?? 'pending') as SyncStatus,
    syncError: null,
    serverUpdatedAt: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  };

  await db.runAsync(
    `INSERT INTO reports (id,server_id,client_request_id,user_id,title,description,category,subcategory,severity_score,severity_label,status,lat,lng,address,ward_id,photo_uris,server_photo_urls,ai_category,ai_severity,ai_confidence,ai_rationale,ai_model_version,duplicate_of,upvote_count,is_demo,sync_status,sync_error,server_updated_at,created_at,updated_at,resolved_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      report.id, report.serverId, report.clientRequestId, report.userId, report.title, report.description, report.category, report.subcategory,
      report.severityScore, report.severityLabel, report.status, report.lat, report.lng, report.address, report.wardId,
      JSON.stringify(report.photoUris), JSON.stringify(report.serverPhotoUrls), report.aiCategory, report.aiSeverity, report.aiConfidence,
      report.aiRationale, report.aiModelVersion, report.duplicateOf, report.upvoteCount, report.isDemo ? 1 : 0, report.syncStatus,
      report.syncError, report.serverUpdatedAt, report.createdAt, report.updatedAt, report.resolvedAt,
    ]
  );
  return report;
}

export async function getReport(id: string): Promise<Report | null> {
  const db = await initDatabase();
  const row = await db.getFirstAsync('SELECT * FROM reports WHERE id = ?', [id]);
  return row ? rowToReport(row) : null;
}

export async function getReportByClientRequestId(clientRequestId: string): Promise<Report | null> {
  const db = await initDatabase();
  const row = await db.getFirstAsync('SELECT * FROM reports WHERE client_request_id = ?', [clientRequestId]);
  return row ? rowToReport(row) : null;
}

export async function listReports(filter: any = {}): Promise<Report[]> {
  const db = await initDatabase();
  const where: string[] = [];
  const params: any[] = [];
  if (filter.wardId) { where.push('ward_id = ?'); params.push(filter.wardId); }
  if (filter.status) { where.push('status = ?'); params.push(filter.status); }
  if (filter.category) { where.push('category = ?'); params.push(filter.category); }
  if (filter.syncStatus) { where.push('sync_status = ?'); params.push(filter.syncStatus); }
  const sql = `SELECT * FROM reports ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT ?`;
  params.push(filter.limit ?? 500);
  const rows = await db.getAllAsync(sql, params);
  return rows.map(rowToReport);
}
export async function updateReport(id: string, patch: any): Promise<void> {
  const db = await initDatabase();
  const fields: string[] = [];
  const params: any[] = [];
  const map: Record<string, string> = {
    serverId: 'server_id', clientRequestId: 'client_request_id', userId: 'user_id', title: 'title', description: 'description',
    category: 'category', subcategory: 'subcategory', severityScore: 'severity_score', severityLabel: 'severity_label',
    status: 'status', lat: 'lat', lng: 'lng', address: 'address', wardId: 'ward_id', duplicateOf: 'duplicate_of',
    upvoteCount: 'upvote_count', isDemo: 'is_demo', syncStatus: 'sync_status', syncError: 'sync_error',
    serverUpdatedAt: 'server_updated_at', resolvedAt: 'resolved_at', aiCategory: 'ai_category', aiSeverity: 'ai_severity',
    aiConfidence: 'ai_confidence', aiRationale: 'ai_rationale', aiModelVersion: 'ai_model_version',
  };
  for (const [k, col] of Object.entries(map)) {
    if (patch[k] !== undefined) {
      fields.push(`${col} = ?`);
      params.push(typeof patch[k] === 'boolean' ? (patch[k] ? 1 : 0) : patch[k]);
    }
  }
  if (patch.photoUris !== undefined) { fields.push('photo_uris = ?'); params.push(JSON.stringify(patch.photoUris)); }
  if (patch.serverPhotoUrls !== undefined) { fields.push('server_photo_urls = ?'); params.push(JSON.stringify(patch.serverPhotoUrls)); }
  fields.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);
  await db.runAsync(`UPDATE reports SET ${fields.join(', ')} WHERE id = ?`, params);
}

export async function markReportSyncing(id: string): Promise<void> {
  await updateReport(id, { syncStatus: 'syncing', syncError: null });
}

export async function markReportSynced(id: string, serverId: string | null, serverFields?: any): Promise<void> {
  await updateReport(id, { syncStatus: 'synced', serverId: serverId ?? undefined, syncError: null, ...serverFields });
}

export async function markReportFailed(id: string, error: string, dead = false): Promise<void> {
  await updateReport(id, { syncStatus: dead ? 'failed' : 'pending', syncError: error });
}

export function shouldApplyServerUpdate(local: Report, serverUpdatedAt: string | null): boolean {
  if (!serverUpdatedAt) return true;
  if (!local.serverUpdatedAt) return true;
  return new Date(serverUpdatedAt).getTime() > new Date(local.serverUpdatedAt).getTime();
}

export async function applyServerReport(id: string, server: any): Promise<void> {
  const local = await getReport(id);
  if (!local) return;
  const serverUpdatedAt = server.updated_at ?? server.updatedAt ?? null;
  if (!shouldApplyServerUpdate(local, serverUpdatedAt)) {
    if (server.id && server.id !== local.serverId) {
      await updateReport(id, { serverId: server.id });
    }
    return;
  }

  await updateReport(id, {
    serverId: server.id ?? local.serverId,
    status: server.status ?? local.status,
    severityScore: server.severity_score ?? server.severityScore ?? local.severityScore,
    severityLabel: server.severity_label ?? server.severityLabel ?? local.severityLabel,
    aiCategory: server.ai_category ?? server.aiCategory ?? local.aiCategory,
    aiSeverity: server.ai_severity ?? server.aiSeverity ?? local.aiSeverity,
    aiConfidence: server.ai_confidence ?? server.aiConfidence ?? local.aiConfidence,
    aiRationale: server.ai_rationale ?? server.aiRationale ?? local.aiRationale,
    aiModelVersion: server.ai_model_version ?? server.aiModelVersion ?? local.aiModelVersion,
    duplicateOf: server.duplicate_of ?? server.duplicateOf ?? local.duplicateOf,
    upvoteCount: server.upvote_count ?? server.upvoteCount ?? local.upvoteCount,
    resolvedAt: server.resolved_at ?? server.resolvedAt ?? local.resolvedAt,
    serverUpdatedAt,
    syncStatus: 'synced',
    syncError: null,
  });
}
export async function deleteReport(id: string, options: { force?: boolean } = {}): Promise<void> {
  const db = await initDatabase();
  const report = await getReport(id);
  if (!report) return;
  if (!options.force && report.syncStatus !== 'synced' && report.serverId === null) {
    throw new Error('Cannot delete a report that has not been confirmed by the server');
  }
  await db.runAsync('DELETE FROM reports WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM report_images WHERE report_id = ?', [id]);
}

export async function addReportImage(reportId: string, localUri: string): Promise<ReportImage> {
  const db = await initDatabase();
  const img: ReportImage = {
    id: uuid(),
    reportId,
    localUri,
    remoteUrl: null,
    uploadStatus: 'pending',
    error: null,
    createdAt: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO report_images (id,report_id,local_uri,remote_url,upload_status,error,created_at) VALUES (?,?,?,?,?,?,?)`,
    [img.id, img.reportId, img.localUri, img.remoteUrl, img.uploadStatus, img.error, img.createdAt]
  );
  return img;
}

export async function listReportImages(reportId: string): Promise<ReportImage[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync('SELECT * FROM report_images WHERE report_id = ? ORDER BY created_at', [reportId]);
  return rows.map(rowToImage);
}

export async function markImageUploaded(id: string, remoteUrl: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('UPDATE report_images SET upload_status=?, remote_url=?, error=NULL WHERE id=?', ['uploaded', remoteUrl, id]);
}

export async function markImageFailed(id: string, error: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('UPDATE report_images SET upload_status=?, error=? WHERE id=?', ['failed', error, id]);
}

export async function countPendingSync(): Promise<number> {
  const db = await initDatabase();
  const row: any = await db.getFirstAsync("SELECT COUNT(*) as c FROM sync_queue WHERE status IN ('queued','in_flight')");
  return row?.c ?? 0;
}
